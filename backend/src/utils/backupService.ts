import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { env } from '../config/env';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Backup directory
const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

interface BackupOptions {
  userId?: number;
  backupType?: 'manual' | 'automatic';
  schoolId?: number;
}

/**
 * Create a database backup using mysqldump
 */
export const createBackup = async (options: BackupOptions = {}): Promise<{
  backupName: string;
  filePath: string;
  fileSize: number;
}> => {
  try {
    const db = getDatabase();
    const dbConfig = (db as any).config || {};

    const dbName = env.db.name;
    const dbUser = env.db.user;
    const dbPassword = env.db.password;
    const dbHost = env.db.host;
    const dbPort = env.db.port.toString();

    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
    const backupName = `backup_${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, backupName);

    // Build mysqldump command
    let mysqldumpCmd = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser}`;
    
    if (dbPassword) {
      mysqldumpCmd += ` -p${dbPassword}`;
    }

    mysqldumpCmd += ` ${dbName} > "${filePath}"`;

    // Execute mysqldump
    try {
      await execAsync(mysqldumpCmd);
    } catch (error: any) {
      // If mysqldump is not available, try alternative method using Node.js
      console.warn('mysqldump not available, using alternative method');
      await createBackupAlternative(dbName, filePath);
    }

    // Check if file was created
    if (!fs.existsSync(filePath)) {
      throw createError('Backup file was not created', 500);
    }

    // Get file size
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    if (fileSize === 0) {
      fs.unlinkSync(filePath);
      throw createError('Backup file is empty', 500);
    }

    // Save backup record to database
    const backupType = options.backupType || 'manual';
    const schoolId = options.schoolId ?? null;
    const [result] = await db.execute(
      `INSERT INTO backup_records (school_id, backup_name, file_path, file_size, backup_type, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [schoolId, backupName, filePath, fileSize, backupType, options.userId || null]
    ) as any;

    // Update last backup time in settings (per-school if schoolId provided)
    if (schoolId != null) {
      await db.execute(
        'UPDATE backup_settings SET last_backup_at = NOW() WHERE school_id = ?',
        [schoolId]
      );
    } else {
      await db.execute(
        'UPDATE backup_settings SET last_backup_at = NOW() WHERE id = 1'
      );
    }

    return {
      backupName,
      filePath,
      fileSize,
    };
  } catch (error: any) {
    console.error('Backup creation error:', error);
    throw createError(`Failed to create backup: ${error.message}`, 500);
  }
};

/**
 * Alternative backup method using Node.js (if mysqldump is not available)
 */
const createBackupAlternative = async (dbName: string, filePath: string): Promise<void> => {
  const db = getDatabase();
  
  // Get all tables
  const [tables] = await db.execute(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
    [dbName]
  ) as any[];

  let sqlContent = `-- Database Backup\n`;
  sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
  sqlContent += `-- Database: ${dbName}\n\n`;
  sqlContent += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

  // For each table, get structure and data
  for (const table of tables) {
    const tableName = table.TABLE_NAME;
    
    // Get table structure
    const [createTable] = await db.execute(
      `SHOW CREATE TABLE \`${tableName}\``
    ) as any[];
    
    if (createTable.length > 0) {
      sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlContent += `${createTable[0]['Create Table']};\n\n`;
    }

    // Get table data
    const [rows] = await db.execute(`SELECT * FROM \`${tableName}\``) as any[];
    
    if (rows.length > 0) {
      sqlContent += `INSERT INTO \`${tableName}\` VALUES\n`;
      const values = rows.map((row: any) => {
        const rowValues = Object.values(row).map((val: any) => {
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          return val;
        });
        return `(${rowValues.join(', ')})`;
      });
      sqlContent += values.join(',\n') + ';\n\n';
    }
  }

  sqlContent += `SET FOREIGN_KEY_CHECKS=1;\n`;

  // Write to file
  fs.writeFileSync(filePath, sqlContent, 'utf8');
};

/**
 * Restore database from backup file
 */
export const restoreBackup = async (filePath: string): Promise<void> => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw createError('Backup file not found', 404);
    }

    const db = getDatabase();
    const dbConfig = (db as any).config || {};

    const dbName = env.db.name;
    const dbUser = env.db.user;
    const dbPassword = env.db.password;
    const dbHost = env.db.host;
    const dbPort = env.db.port.toString();

    // Read SQL file
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute statements
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.execute(statement);
        } catch (error: any) {
          // Skip errors for DROP TABLE IF EXISTS
          if (!error.message.includes('Unknown table')) {
            console.warn('SQL execution warning:', error.message);
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Restore error:', error);
    throw createError(`Failed to restore backup: ${error.message}`, 500);
  }
};

/**
 * Get all backup records, optionally filtered by school_id
 */
export const getBackupRecords = async (schoolId?: number | null): Promise<any[]> => {
  const db = getDatabase();
  if (schoolId != null) {
    const [records] = await db.execute(
      `SELECT br.*, u.name as created_by_name
       FROM backup_records br
       LEFT JOIN users u ON br.created_by = u.id
       WHERE br.school_id = ?
       ORDER BY br.created_at DESC`,
      [schoolId]
    ) as any[];
    return records;
  }
  const [records] = await db.execute(
    `SELECT br.*, u.name as created_by_name
     FROM backup_records br
     LEFT JOIN users u ON br.created_by = u.id
     ORDER BY br.created_at DESC`
  ) as any[];
  return records;
};

/**
 * Delete backup file and record. If schoolId provided, only deletes if record belongs to that school.
 */
export const deleteBackup = async (id: number, schoolId?: number | null): Promise<void> => {
  const db = getDatabase();

  let query = 'SELECT file_path FROM backup_records WHERE id = ?';
  const queryParams: any[] = [id];
  if (schoolId != null) {
    query += ' AND school_id = ?';
    queryParams.push(schoolId);
  }
  const [records] = await db.execute(query, queryParams) as any[];

  if (records.length === 0) {
    throw createError('Backup record not found', 404);
  }

  const filePath = records[0].file_path;

  // Delete file if exists
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.warn('Failed to delete backup file:', error);
    }
  }

  const deleteParams = schoolId != null ? [schoolId, id] : [id];
  const deleteQuery = schoolId != null
    ? 'DELETE FROM backup_records WHERE school_id = ? AND id = ?'
    : 'DELETE FROM backup_records WHERE id = ?';
  await db.execute(deleteQuery, deleteParams);
};

/**
 * Get backup settings. If schoolId provided, returns settings for that school.
 */
export const getBackupSettings = async (schoolId?: number | null): Promise<any> => {
  const db = getDatabase();
  if (schoolId != null) {
    const [settings] = await db.execute(
      'SELECT * FROM backup_settings WHERE school_id = ?',
      [schoolId]
    ) as any[];
    if (settings.length === 0) {
      return {
        id: null,
        auto_backup_enabled: false,
        backup_frequency: 'daily',
        backup_time: '02:00:00',
        keep_backups: 7,
        cron_secret_key: null,
        last_backup_at: null,
      };
    }
    const setting = settings[0];
    return {
      id: setting.id,
      auto_backup_enabled: setting.auto_backup_enabled === 1,
      backup_frequency: setting.backup_frequency,
      backup_time: setting.backup_time,
      keep_backups: setting.keep_backups,
      cron_secret_key: setting.cron_secret_key,
      last_backup_at: setting.last_backup_at,
    };
  }
  const [settings] = await db.execute(
    'SELECT * FROM backup_settings WHERE id = 1'
  ) as any[];

  if (settings.length === 0) {
    return {
      id: null,
      auto_backup_enabled: false,
      backup_frequency: 'daily',
      backup_time: '02:00:00',
      keep_backups: 7,
      cron_secret_key: null,
      last_backup_at: null,
    };
  }

  const setting = settings[0];
  return {
    id: setting.id,
    auto_backup_enabled: setting.auto_backup_enabled === 1,
    backup_frequency: setting.backup_frequency,
    backup_time: setting.backup_time,
    keep_backups: setting.keep_backups,
    cron_secret_key: setting.cron_secret_key,
    last_backup_at: setting.last_backup_at,
  };
};

/**
 * Update backup settings. If schoolId provided, updates/creates row for that school.
 */
export const updateBackupSettings = async (settings: {
  auto_backup_enabled?: boolean;
  backup_frequency?: string;
  backup_time?: string;
  keep_backups?: number;
}, schoolId?: number | null): Promise<void> => {
  const db = getDatabase();

  const whereClause = schoolId != null ? 'WHERE school_id = ?' : 'WHERE id = 1';
  const whereParam = schoolId != null ? [schoolId] : [];
  const [existing] = await db.execute(
    `SELECT id FROM backup_settings ${whereClause}`,
    whereParam
  ) as any[];

  if (existing.length > 0) {
    const updates: string[] = [];
    const params: any[] = [];

    if (settings.auto_backup_enabled !== undefined) {
      updates.push('auto_backup_enabled = ?');
      params.push(settings.auto_backup_enabled ? 1 : 0);
    }
    if (settings.backup_frequency) {
      updates.push('backup_frequency = ?');
      params.push(settings.backup_frequency);
    }
    if (settings.backup_time) {
      updates.push('backup_time = ?');
      params.push(settings.backup_time);
    }
    if (settings.keep_backups !== undefined) {
      updates.push('keep_backups = ?');
      params.push(settings.keep_backups);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      params.push(...(schoolId != null ? [schoolId] : [1]));
      const updateWhere = schoolId != null ? 'WHERE school_id = ?' : 'WHERE id = ?';
      await db.execute(
        `UPDATE backup_settings SET ${updates.join(', ')} ${updateWhere}`,
        params
      );
    }
  } else {
    if (schoolId != null) {
      await db.execute(
        `INSERT INTO backup_settings 
         (school_id, auto_backup_enabled, backup_frequency, backup_time, keep_backups, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          schoolId,
          settings.auto_backup_enabled ? 1 : 0,
          settings.backup_frequency || 'daily',
          settings.backup_time || '02:00:00',
          settings.keep_backups || 7,
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO backup_settings 
         (auto_backup_enabled, backup_frequency, backup_time, keep_backups, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [
          settings.auto_backup_enabled ? 1 : 0,
          settings.backup_frequency || 'daily',
          settings.backup_time || '02:00:00',
          settings.keep_backups || 7,
        ]
      );
    }
  }
};

/**
 * Generate or regenerate cron secret key. If schoolId provided, updates/creates row for that school.
 */
export const generateCronSecretKey = async (schoolId?: number | null): Promise<string> => {
  const db = getDatabase();
  const secretKey = crypto.randomBytes(32).toString('hex');

  const whereClause = schoolId != null ? 'WHERE school_id = ?' : 'WHERE id = 1';
  const whereParam = schoolId != null ? [schoolId] : [];
  const [existing] = await db.execute(
    `SELECT id FROM backup_settings ${whereClause}`,
    whereParam
  ) as any[];

  if (existing.length > 0) {
    const updateWhere = schoolId != null ? 'WHERE school_id = ?' : 'WHERE id = 1';
    const updateParam = schoolId != null ? [secretKey, schoolId] : [secretKey];
    await db.execute(
      `UPDATE backup_settings SET cron_secret_key = ?, updated_at = NOW() ${updateWhere}`,
      updateParam
    );
  } else {
    if (schoolId != null) {
      await db.execute(
        `INSERT INTO backup_settings (school_id, cron_secret_key, created_at, updated_at)
         VALUES (?, ?, NOW(), NOW())`,
        [schoolId, secretKey]
      );
    } else {
      await db.execute(
        `INSERT INTO backup_settings (cron_secret_key, created_at, updated_at)
         VALUES (?, NOW(), NOW())`,
        [secretKey]
      );
    }
  }

  return secretKey;
};

/**
 * Clean up old backups based on keep_backups setting. If schoolId provided, only cleans that school's backups.
 */
export const cleanupOldBackups = async (schoolId?: number | null): Promise<void> => {
  const db = getDatabase();
  const settings = await getBackupSettings(schoolId);

  if (!settings.keep_backups || settings.keep_backups <= 0) {
    return;
  }

  let query = 'SELECT id, file_path FROM backup_records';
  const params: any[] = [];
  if (schoolId != null) {
    query += ' WHERE school_id = ?';
    params.push(schoolId);
  }
  query += ' ORDER BY created_at DESC';
  const [backups] = await db.execute(query, params) as any[];

  if (backups.length > settings.keep_backups) {
    const backupsToDelete = backups.slice(settings.keep_backups);
    for (const backup of backupsToDelete) {
      await deleteBackup(backup.id, schoolId ?? undefined);
    }
  }
};

