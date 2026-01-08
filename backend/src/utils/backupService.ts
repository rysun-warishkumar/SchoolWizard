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
    const [result] = await db.execute(
      `INSERT INTO backup_records (backup_name, file_path, file_size, backup_type, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [backupName, filePath, fileSize, backupType, options.userId || null]
    ) as any;

    // Update last backup time in settings
    await db.execute(
      'UPDATE backup_settings SET last_backup_at = NOW() WHERE id = 1'
    );

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
 * Get all backup records
 */
export const getBackupRecords = async (): Promise<any[]> => {
  const db = getDatabase();
  const [records] = await db.execute(
    `SELECT br.*, u.name as created_by_name
     FROM backup_records br
     LEFT JOIN users u ON br.created_by = u.id
     ORDER BY br.created_at DESC`
  ) as any[];

  return records;
};

/**
 * Delete backup file and record
 */
export const deleteBackup = async (id: number): Promise<void> => {
  const db = getDatabase();

  // Get backup record
  const [records] = await db.execute(
    'SELECT file_path FROM backup_records WHERE id = ?',
    [id]
  ) as any[];

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

  // Delete record
  await db.execute('DELETE FROM backup_records WHERE id = ?', [id]);
};

/**
 * Get backup settings
 */
export const getBackupSettings = async (): Promise<any> => {
  const db = getDatabase();
  const [settings] = await db.execute(
    'SELECT * FROM backup_settings WHERE id = 1'
  ) as any[];

  if (settings.length === 0) {
    // Return default settings
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
 * Update backup settings
 */
export const updateBackupSettings = async (settings: {
  auto_backup_enabled?: boolean;
  backup_frequency?: string;
  backup_time?: string;
  keep_backups?: number;
}): Promise<void> => {
  const db = getDatabase();

  const [existing] = await db.execute(
    'SELECT id FROM backup_settings WHERE id = 1'
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
      params.push(1);
      await db.execute(
        `UPDATE backup_settings SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }
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
};

/**
 * Generate or regenerate cron secret key
 */
export const generateCronSecretKey = async (): Promise<string> => {
  const db = getDatabase();
  const secretKey = crypto.randomBytes(32).toString('hex');

  const [existing] = await db.execute(
    'SELECT id FROM backup_settings WHERE id = 1'
  ) as any[];

  if (existing.length > 0) {
    await db.execute(
      'UPDATE backup_settings SET cron_secret_key = ?, updated_at = NOW() WHERE id = 1',
      [secretKey]
    );
  } else {
    await db.execute(
      `INSERT INTO backup_settings (cron_secret_key, created_at, updated_at)
       VALUES (?, NOW(), NOW())`,
      [secretKey]
    );
  }

  return secretKey;
};

/**
 * Clean up old backups based on keep_backups setting
 */
export const cleanupOldBackups = async (): Promise<void> => {
  const db = getDatabase();
  const settings = await getBackupSettings();

  if (!settings.keep_backups || settings.keep_backups <= 0) {
    return;
  }

  // Get all backups ordered by date
  const [backups] = await db.execute(
    'SELECT id, file_path FROM backup_records ORDER BY created_at DESC'
  ) as any[];

  // Keep only the most recent N backups
  if (backups.length > settings.keep_backups) {
    const backupsToDelete = backups.slice(settings.keep_backups);

    for (const backup of backupsToDelete) {
      await deleteBackup(backup.id);
    }
  }
};

