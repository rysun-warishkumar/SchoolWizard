import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';

const TRIAL_DAYS = 30;

/**
 * Slugify school name for unique URL-friendly slug.
 * Ensures uniqueness by appending -2, -3, ... if slug exists.
 */
async function getUniqueSlug(db: any, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 0;
  let [rows] = await db.execute('SELECT id FROM schools WHERE slug = ?', [slug]) as any[];
  while (rows.length > 0) {
    counter += 1;
    slug = counter === 1 ? `${baseSlug}-2` : `${baseSlug}-${counter + 1}`;
    [rows] = await db.execute('SELECT id FROM schools WHERE slug = ?', [slug]) as any[];
  }
  return slug;
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'school';
}

/**
 * POST /api/v1/public/schools/register
 * Public school registration. Creates school (trial 30 days) + admin user.
 */
export const registerSchool = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { schoolName, adminName, email, password } = req.body;

    if (!schoolName || typeof schoolName !== 'string' || !schoolName.trim()) {
      throw createError('School name is required', 400);
    }
    if (!adminName || typeof adminName !== 'string' || adminName.trim().length < 2) {
      throw createError('Admin name must be at least 2 characters', 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw createError('Valid email is required', 400);
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw createError('Password must be at least 6 characters', 400);
    }

    const db = getDatabase();

    // Check if schools table exists (Phase 1 migration)
    const [tables] = await db.execute(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'schools'`
    ) as any[];
    if (!tables || tables.length === 0) {
      throw createError('School registration is not available. Please contact support.', 503);
    }

    // Email unique globally
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.trim()]
    ) as any[];
    if (existingUsers.length > 0) {
      throw createError('An account with this email already exists. Please sign in or use a different email.', 400);
    }

    const baseSlug = slugify(schoolName.trim());
    const slug = await getUniqueSlug(db, baseSlug);

    const trialStartsAt = new Date();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    await db.execute(
      `INSERT INTO schools (name, slug, status, trial_starts_at, trial_ends_at, created_at, updated_at)
       VALUES (?, ?, 'trial', ?, ?, NOW(), NOW())`,
      [schoolName.trim(), slug, trialStartsAt, trialEndsAt]
    );

    const [insertSchool] = await db.execute('SELECT LAST_INSERT_ID() as id') as any[];
    const schoolId = insertSchool[0].id;

    const [adminRoles] = await db.execute(
      "SELECT id FROM roles WHERE name = 'admin' LIMIT 1"
    ) as any[];
    const adminRoleId = adminRoles.length > 0 ? adminRoles[0].id : 2;

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      `INSERT INTO users (email, password, name, role_id, school_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [email.trim(), hashedPassword, adminName.trim(), adminRoleId, schoolId]
    );

    // Optional: create default general_settings row for this school (if table has school_id)
    try {
      const [cols] = await db.execute(
        `SELECT COLUMN_NAME FROM information_schema.columns 
         WHERE table_schema = DATABASE() AND table_name = 'general_settings' AND COLUMN_NAME = 'school_id'`
      ) as any[];
      if (cols && cols.length > 0) {
        const [existing] = await db.execute(
          'SELECT id FROM general_settings WHERE school_id = ? LIMIT 1',
          [schoolId]
        ) as any[];
        if (existing.length === 0) {
          await db.execute(
            `INSERT INTO general_settings (school_id, setting_key, setting_value, setting_type, description, created_at, updated_at)
             VALUES (?, 'school_name', ?, 'text', 'School Name', NOW(), NOW())`,
            [schoolId, schoolName.trim()]
          );
        }
      }
    } catch {
      // Ignore if general_settings insert fails (e.g. different schema)
    }

    res.status(201).json({
      success: true,
      message: 'School registered successfully. You can now sign in.',
      school: {
        id: schoolId,
        name: schoolName.trim(),
        slug,
        status: 'trial',
        trialEndsAt: trialEndsAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
