import { Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

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
      return res.json({ success: true, data: schools[0] });
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
