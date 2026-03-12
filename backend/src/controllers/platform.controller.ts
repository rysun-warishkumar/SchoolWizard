import { Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { env } from '../config/env';
import fs from 'fs/promises';
import path from 'path';

const assertControlPlaneEnabled = () => {
  if (!env.saas.controlPlaneEnabled) {
    throw createError('Control-plane features are disabled by configuration', 403);
  }
};

const getTenantBySchoolId = async (schoolId: number) => {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT id, school_id, lifecycle_status, runtime_mode, is_readonly_freeze
     FROM tenants
     WHERE school_id = ?
     LIMIT 1`,
    [schoolId]
  ) as any[];
  if (!rows || rows.length === 0) {
    throw createError('Tenant record not found for school. Run control-plane migration first.', 404);
  }
  return rows[0];
};

const FILE_COLUMN_PATTERN = /(image|logo|favicon|file|path|photo|attachment|document|banner|icon)/i;

const toUploadAbsPath = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let normalized = trimmed.replace(/\\/g, '/');
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return null;
  if (normalized.startsWith('/')) normalized = normalized.slice(1);
  if (normalized.startsWith('uploads/')) normalized = normalized.slice('uploads/'.length);
  if (!normalized) return null;
  return path.resolve(process.cwd(), 'uploads', normalized);
};

const calculateSchoolStorageBytes = async (schoolId: number): Promise<number> => {
  const db = getDatabase();
  const [columns] = await db.execute(
    `SELECT c.table_name, c.column_name
     FROM information_schema.columns c
     INNER JOIN information_schema.columns school_col
       ON school_col.table_schema = c.table_schema
      AND school_col.table_name = c.table_name
      AND school_col.column_name = 'school_id'
     WHERE c.table_schema = ?
       AND c.data_type IN ('varchar', 'text', 'mediumtext', 'longtext')
       AND c.column_name REGEXP 'image|logo|favicon|file|path|photo|attachment|document|banner|icon'
     ORDER BY c.table_name, c.column_name`,
    [env.db.name]
  ) as any[];

  const files = new Set<string>();
  const grouped = new Map<string, string[]>();

  for (const col of columns as any[]) {
    const tableName = String(col.table_name);
    const colName = String(col.column_name);
    if (!FILE_COLUMN_PATTERN.test(colName)) continue;
    const arr = grouped.get(tableName) || [];
    arr.push(colName);
    grouped.set(tableName, arr);
  }

  for (const [tableName, colNames] of grouped.entries()) {
    const selected = colNames.map((c) => `\`${c}\``).join(', ');
    try {
      const [rows] = await db.execute(
        `SELECT ${selected} FROM \`${tableName}\` WHERE school_id = ? LIMIT 5000`,
        [schoolId]
      ) as any[];

      for (const row of rows as any[]) {
        for (const colName of colNames) {
          const value = row[colName];
          if (!value || typeof value !== 'string') continue;
          const parts = value.split(',').map((x) => x.trim()).filter(Boolean);
          for (const part of parts) {
            const abs = toUploadAbsPath(part);
            if (abs) files.add(abs);
          }
        }
      }
    } catch {
      // Ignore optional/missing tables in older databases.
    }
  }

  let total = 0;
  for (const f of files) {
    try {
      const st = await fs.stat(f);
      if (st.isFile()) total += st.size;
    } catch {
      // Ignore missing files.
    }
  }
  return total;
};

/**
 * GET /api/v1/platform/schools
 * List all schools with optional filters: status, search (name/email).
 */
export const listSchools = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const offset = (pageNum - 1) * limitNum;

    const db = getDatabase();

    let whereClause = '1=1';
    const params: (string | number)[] = [];

    if (status && typeof status === 'string' && ['trial', 'active', 'expired', 'suspended'].includes(status)) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }

    if (search && typeof search === 'string' && search.trim()) {
      whereClause += ' AND (s.name LIKE ? OR s.slug LIKE ? OR admin_user.email LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const [rows] = await db.execute(
      `SELECT s.id, s.name, s.slug, s.status, s.trial_starts_at, s.trial_ends_at, s.custom_domain, s.created_at,
              (SELECT u.email FROM users u INNER JOIN roles r ON r.id = u.role_id AND r.name = 'admin' WHERE u.school_id = s.id LIMIT 1) AS admin_email,
              (SELECT u.name FROM users u INNER JOIN roles r ON r.id = u.role_id AND r.name = 'admin' WHERE u.school_id = s.id LIMIT 1) AS admin_name
       FROM schools s
       WHERE ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    ) as any[];

    const [countResult] = await db.execute(
      `SELECT COUNT(*) AS total FROM schools s WHERE ${whereClause}`,
      params
    ) as any[];

    const total = countResult[0]?.total ?? 0;

    res.json({
      success: true,
      data: rows,
      pagination: { page: pageNum, limit: limitNum, total },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/platform/schools/:id
 * School detail + basic stats (students count, users count).
 */
export const getSchool = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw createError('Invalid school ID', 400);
    }

    const db = getDatabase();

    const [schools] = await db.execute(
      `SELECT s.id, s.name, s.slug, s.status, s.trial_starts_at, s.trial_ends_at, s.custom_domain, s.created_at, s.updated_at
       FROM schools s WHERE s.id = ?`,
      [id]
    ) as any[];

    if (schools.length === 0) {
      throw createError('School not found', 404);
    }

    const school = schools[0];

    const [adminRows] = await db.execute(
      `SELECT u.email, u.name FROM users u
       INNER JOIN roles r ON r.id = u.role_id AND r.name = 'admin'
       WHERE u.school_id = ? LIMIT 1`,
      [id]
    ) as any[];

    let studentsCount = 0;
    let usersCount = 0;
    let storageUsedBytes = 0;
    try {
      const [studentsResult] = await db.execute(
        'SELECT COUNT(*) AS c FROM students WHERE school_id = ?',
        [id]
      ) as any[];
      studentsCount = studentsResult[0]?.c ?? 0;
      const [usersResult] = await db.execute(
        'SELECT COUNT(*) AS c FROM users WHERE school_id = ?',
        [id]
      ) as any[];
      usersCount = usersResult[0]?.c ?? 0;
      storageUsedBytes = await calculateSchoolStorageBytes(id);
    } catch {
      // Tables may not have school_id in old DB
    }

    res.json({
      success: true,
      data: {
        ...school,
        admin_email: adminRows[0]?.email,
        admin_name: adminRows[0]?.name,
        students_count: studentsCount,
        users_count: usersCount,
        storage_used_bytes: storageUsedBytes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/platform/schools/:id
 * Update school: name, status, trial_ends_at, custom_domain.
 */
export const updateSchool = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw createError('Invalid school ID', 400);
    }

    const { name, status, trial_ends_at, custom_domain } = req.body;

    const db = getDatabase();

    const [existing] = await db.execute('SELECT id FROM schools WHERE id = ?', [id]) as any[];
    if (existing.length === 0) {
      throw createError('School not found', 404);
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (name !== undefined && typeof name === 'string' && name.trim()) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (status !== undefined && ['trial', 'active', 'expired', 'suspended'].includes(status)) {
      updates.push('status = ?');
      values.push(status);
    }
    if (trial_ends_at !== undefined) {
      updates.push('trial_ends_at = ?');
      values.push(trial_ends_at === null || trial_ends_at === '' ? null : trial_ends_at);
    }
    if (custom_domain !== undefined) {
      updates.push('custom_domain = ?');
      values.push(custom_domain === null || custom_domain === '' ? null : String(custom_domain).trim());
    }

    if (updates.length === 0) {
      const [schools] = await db.execute(
        'SELECT id, name, slug, status, trial_starts_at, trial_ends_at, custom_domain, updated_at FROM schools WHERE id = ?',
        [id]
      ) as any[];
      res.json({ success: true, data: schools[0] });
      return;
    }

    values.push(id);
    await db.execute(
      `UPDATE schools SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    const [updated] = await db.execute(
      'SELECT id, name, slug, status, trial_starts_at, trial_ends_at, custom_domain, updated_at FROM schools WHERE id = ?',
      [id]
    ) as any[];

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/platform/schools/:id/control-plane
 */
export const getSchoolControlPlane = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    assertControlPlaneEnabled();
    const schoolId = parseInt(req.params.id, 10);
    if (isNaN(schoolId)) throw createError('Invalid school ID', 400);

    const db = getDatabase();
    const tenant = await getTenantBySchoolId(schoolId);

    const [domains] = await db.execute(
      `SELECT * FROM tenant_domains WHERE tenant_id = ? ORDER BY is_primary DESC, created_at DESC`,
      [tenant.id]
    ) as any[];
    const [environments] = await db.execute(
      `SELECT * FROM tenant_environments WHERE tenant_id = ? ORDER BY created_at DESC`,
      [tenant.id]
    ) as any[];
    const [migrations] = await db.execute(
      `SELECT * FROM tenant_migrations WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10`,
      [tenant.id]
    ) as any[];
    const [events] = await db.execute(
      `SELECT * FROM tenant_events WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 30`,
      [tenant.id]
    ) as any[];

    res.json({
      success: true,
      data: {
        tenant,
        domains,
        environments,
        migrations,
        events,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/platform/schools/:id/domains
 */
export const registerTenantDomain = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    assertControlPlaneEnabled();
    const schoolId = parseInt(req.params.id, 10);
    if (isNaN(schoolId)) throw createError('Invalid school ID', 400);

    const { domain, domain_type = 'custom', dns_target, is_primary = false } = req.body;
    if (!domain || typeof domain !== 'string') {
      throw createError('Domain is required', 400);
    }

    const db = getDatabase();
    const tenant = await getTenantBySchoolId(schoolId);
    const [result] = await db.execute(
      `INSERT INTO tenant_domains
       (tenant_id, domain, domain_type, verification_status, dns_target, ssl_status, is_primary, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, 'pending', ?, 0, NOW(), NOW())`,
      [tenant.id, domain.trim().toLowerCase(), domain_type, dns_target || null, is_primary ? 1 : 0]
    ) as any;

    await db.execute(
      `INSERT INTO tenant_events (tenant_id, event_type, event_message, actor_user_id, created_at)
       VALUES (?, 'domain_registered', ?, ?, NOW())`,
      [tenant.id, `Domain ${domain} registered`, req.user?.id || null]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/platform/schools/:id/domains/:domainId
 */
export const updateTenantDomain = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    assertControlPlaneEnabled();
    const schoolId = parseInt(req.params.id, 10);
    const domainId = parseInt(req.params.domainId, 10);
    if (isNaN(schoolId) || isNaN(domainId)) throw createError('Invalid ID', 400);

    const { verification_status, ssl_status, is_active, is_primary, dns_target } = req.body;
    const db = getDatabase();
    const tenant = await getTenantBySchoolId(schoolId);

    const updates: string[] = [];
    const values: any[] = [];
    if (verification_status) {
      updates.push('verification_status = ?');
      values.push(verification_status);
      if (verification_status === 'verified') {
        updates.push('verified_at = NOW()');
      }
    }
    if (ssl_status) {
      updates.push('ssl_status = ?');
      values.push(ssl_status);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }
    if (is_primary !== undefined) {
      updates.push('is_primary = ?');
      values.push(is_primary ? 1 : 0);
    }
    if (dns_target !== undefined) {
      updates.push('dns_target = ?');
      values.push(dns_target || null);
    }

    if (updates.length === 0) {
      throw createError('No fields to update', 400);
    }

    values.push(domainId, tenant.id);
    await db.execute(
      `UPDATE tenant_domains SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      values
    );

    await db.execute(
      `INSERT INTO tenant_events (tenant_id, event_type, event_message, event_payload, actor_user_id, created_at)
       VALUES (?, 'domain_updated', ?, ?, ?, NOW())`,
      [tenant.id, `Domain ${domainId} updated`, JSON.stringify(req.body), req.user?.id || null]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/platform/schools/:id/dedicated/provision
 */
export const requestDedicatedProvision = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    assertControlPlaneEnabled();
    if (!env.saas.dedicatedWorkflowEnabled) {
      throw createError('Dedicated workflow features are disabled by configuration', 403);
    }
    const schoolId = parseInt(req.params.id, 10);
    if (isNaN(schoolId)) throw createError('Invalid school ID', 400);
    const { server_host, app_port, db_name, db_host, db_port, db_user, notes } = req.body;

    const db = getDatabase();
    const tenant = await getTenantBySchoolId(schoolId);

    const [result] = await db.execute(
      `INSERT INTO tenant_environments
       (tenant_id, environment_type, environment_status, server_host, app_port, db_name, db_host, db_port, db_user, notes, created_at, updated_at)
       VALUES (?, 'dedicated', 'provisioning', ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [tenant.id, server_host || null, app_port || null, db_name || null, db_host || null, db_port || null, db_user || null, notes || null]
    ) as any;

    await db.execute(
      `UPDATE tenants
       SET lifecycle_status = 'provisioning_dedicated', updated_at = NOW()
       WHERE id = ?`,
      [tenant.id]
    );

    await db.execute(
      `INSERT INTO tenant_events (tenant_id, event_type, event_message, actor_user_id, created_at)
       VALUES (?, 'dedicated_provision_requested', ?, ?, NOW())`,
      [tenant.id, 'Dedicated environment provisioning requested', req.user?.id || null]
    );

    res.status(201).json({ success: true, data: { environment_id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/platform/schools/:id/environments/:environmentId
 */
export const updateTenantEnvironment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    assertControlPlaneEnabled();
    const schoolId = parseInt(req.params.id, 10);
    const environmentId = parseInt(req.params.environmentId, 10);
    if (isNaN(schoolId) || isNaN(environmentId)) throw createError('Invalid ID', 400);

    const db = getDatabase();
    const tenant = await getTenantBySchoolId(schoolId);
    const { environment_status, server_host, app_port, db_name, db_host, db_port, db_user, notes } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    if (environment_status) { updates.push('environment_status = ?'); values.push(environment_status); }
    if (server_host !== undefined) { updates.push('server_host = ?'); values.push(server_host || null); }
    if (app_port !== undefined) { updates.push('app_port = ?'); values.push(app_port || null); }
    if (db_name !== undefined) { updates.push('db_name = ?'); values.push(db_name || null); }
    if (db_host !== undefined) { updates.push('db_host = ?'); values.push(db_host || null); }
    if (db_port !== undefined) { updates.push('db_port = ?'); values.push(db_port || null); }
    if (db_user !== undefined) { updates.push('db_user = ?'); values.push(db_user || null); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes || null); }

    if (updates.length === 0) throw createError('No fields to update', 400);
    values.push(environmentId, tenant.id);
    await db.execute(
      `UPDATE tenant_environments SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      values
    );

    if (environment_status === 'ready') {
      await db.execute(
        `UPDATE tenants SET lifecycle_status = 'ready_for_migration', updated_at = NOW() WHERE id = ?`,
        [tenant.id]
      );
    }

    await db.execute(
      `INSERT INTO tenant_events (tenant_id, event_type, event_message, event_payload, actor_user_id, created_at)
       VALUES (?, 'environment_updated', ?, ?, ?, NOW())`,
      [tenant.id, `Environment ${environmentId} updated`, JSON.stringify(req.body), req.user?.id || null]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/platform/schools/:id/migrations
 */
export const createTenantMigration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    assertControlPlaneEnabled();
    const schoolId = parseInt(req.params.id, 10);
    if (isNaN(schoolId)) throw createError('Invalid school ID', 400);
    const { source_environment_id, target_environment_id } = req.body;

    const db = getDatabase();
    const tenant = await getTenantBySchoolId(schoolId);

    const [result] = await db.execute(
      `INSERT INTO tenant_migrations
       (tenant_id, migration_status, source_environment_id, target_environment_id, created_by, created_at, updated_at)
       VALUES (?, 'queued', ?, ?, ?, NOW(), NOW())`,
      [tenant.id, source_environment_id || null, target_environment_id || null, req.user?.id || null]
    ) as any;

    await db.execute(
      `UPDATE tenants SET lifecycle_status = 'migrating', updated_at = NOW() WHERE id = ?`,
      [tenant.id]
    );
    await db.execute(
      `INSERT INTO tenant_events (tenant_id, event_type, event_message, actor_user_id, created_at)
       VALUES (?, 'migration_created', ?, ?, NOW())`,
      [tenant.id, `Migration ${result.insertId} created`, req.user?.id || null]
    );

    res.status(201).json({ success: true, data: { migration_id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/platform/schools/:id/migrations/:migrationId/precheck
 */
export const runTenantMigrationPrecheck = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    assertControlPlaneEnabled();
    const schoolId = parseInt(req.params.id, 10);
    const migrationId = parseInt(req.params.migrationId, 10);
    if (isNaN(schoolId) || isNaN(migrationId)) throw createError('Invalid ID', 400);

    const db = getDatabase();
    const tenant = await getTenantBySchoolId(schoolId);

    const [studentCountRows] = await db.execute(
      'SELECT COUNT(*) AS c FROM students WHERE school_id = ?',
      [schoolId]
    ) as any[];
    const [staffCountRows] = await db.execute(
      'SELECT COUNT(*) AS c FROM staff WHERE school_id = ?',
      [schoolId]
    ) as any[];
    const [userCountRows] = await db.execute(
      'SELECT COUNT(*) AS c FROM users WHERE school_id = ?',
      [schoolId]
    ) as any[];

    const summary = {
      students: Number(studentCountRows[0]?.c || 0),
      staff: Number(staffCountRows[0]?.c || 0),
      users: Number(userCountRows[0]?.c || 0),
      checkedAt: new Date().toISOString(),
    };

    await db.execute(
      `UPDATE tenant_migrations
       SET migration_status = 'ready_for_cutover', validation_summary = ?, updated_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      [JSON.stringify(summary), migrationId, tenant.id]
    );

    await db.execute(
      `INSERT INTO tenant_events (tenant_id, event_type, event_message, event_payload, actor_user_id, created_at)
       VALUES (?, 'migration_precheck_complete', ?, ?, ?, NOW())`,
      [tenant.id, `Migration ${migrationId} precheck completed`, JSON.stringify(summary), req.user?.id || null]
    );

    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/platform/schools/:id/migrations/:migrationId/cutover
 */
export const markTenantCutoverComplete = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    assertControlPlaneEnabled();
    const schoolId = parseInt(req.params.id, 10);
    const migrationId = parseInt(req.params.migrationId, 10);
    if (isNaN(schoolId) || isNaN(migrationId)) throw createError('Invalid ID', 400);

    const db = getDatabase();
    const tenant = await getTenantBySchoolId(schoolId);

    await db.execute(
      `UPDATE tenant_migrations
       SET migration_status = 'cutover_complete', completed_at = NOW(), updated_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      [migrationId, tenant.id]
    );
    await db.execute(
      `UPDATE tenants
       SET lifecycle_status = 'active_dedicated', runtime_mode = 'dedicated', is_readonly_freeze = 0, updated_at = NOW()
       WHERE id = ?`,
      [tenant.id]
    );
    await db.execute(
      `INSERT INTO tenant_events (tenant_id, event_type, event_message, actor_user_id, created_at)
       VALUES (?, 'cutover_complete', ?, ?, NOW())`,
      [tenant.id, `Migration ${migrationId} cutover completed`, req.user?.id || null]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/platform/schools/:id/migrations/:migrationId/rollback
 */
export const rollbackTenantMigration = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    assertControlPlaneEnabled();
    const schoolId = parseInt(req.params.id, 10);
    const migrationId = parseInt(req.params.migrationId, 10);
    if (isNaN(schoolId) || isNaN(migrationId)) throw createError('Invalid ID', 400);

    const db = getDatabase();
    const tenant = await getTenantBySchoolId(schoolId);

    await db.execute(
      `UPDATE tenant_migrations
       SET migration_status = 'rollback_complete', completed_at = NOW(), updated_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      [migrationId, tenant.id]
    );
    await db.execute(
      `UPDATE tenants
       SET lifecycle_status = 'active_shared', runtime_mode = 'shared', is_readonly_freeze = 0, updated_at = NOW()
       WHERE id = ?`,
      [tenant.id]
    );
    await db.execute(
      `INSERT INTO tenant_events (tenant_id, event_type, event_message, actor_user_id, created_at)
       VALUES (?, 'rollback_complete', ?, ?, NOW())`,
      [tenant.id, `Migration ${migrationId} rolled back`, req.user?.id || null]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/platform/schools/:id/read-only-freeze
 */
export const setTenantReadOnlyFreeze = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    assertControlPlaneEnabled();
    const schoolId = parseInt(req.params.id, 10);
    if (isNaN(schoolId)) throw createError('Invalid school ID', 400);
    const { enabled } = req.body;

    const db = getDatabase();
    const tenant = await getTenantBySchoolId(schoolId);

    await db.execute(
      `UPDATE tenants SET is_readonly_freeze = ?, updated_at = NOW() WHERE id = ?`,
      [enabled ? 1 : 0, tenant.id]
    );
    await db.execute(
      `INSERT INTO tenant_events (tenant_id, event_type, event_message, event_payload, actor_user_id, created_at)
       VALUES (?, 'readonly_freeze_updated', ?, ?, ?, NOW())`,
      [tenant.id, `Read-only freeze ${enabled ? 'enabled' : 'disabled'}`, JSON.stringify({ enabled: !!enabled }), req.user?.id || null]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
