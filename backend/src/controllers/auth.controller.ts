import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { env } from '../config/env';

const JWT_SECRET = env.jwt.secret;
const JWT_EXPIRE = env.jwt.expire;

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body exists
    if (!req.body || typeof req.body !== 'object') {
      throw createError('Invalid request body', 400);
    }

    const { email, password } = req.body;

    if (!email || !password) {
      throw createError('Email and password are required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError('Invalid email format', 400);
    }

    const db = getDatabase();
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = 1',
      [email]
    ) as any[];

    if (users.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Login attempt failed: User not found or inactive', { email });
      }
      throw createError('Invalid credentials', 401);
    }

    const user = users[0];

    if (process.env.NODE_ENV === 'development') {
      console.log('User found:', { id: user.id, email: user.email, hasPassword: !!user.password });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Login attempt failed: Invalid password', { email });
      }
      throw createError('Invalid credentials', 401);
    }

    const [roles] = await db.execute(
      'SELECT * FROM roles WHERE id = ?',
      [user.role_id]
    ) as any[];

    const roleName = roles[0]?.name || 'user';
    const schoolId = user.school_id ?? null;
    const isPlatformAdmin = roleName === 'superadmin' && (schoolId == null);

    // Load school and enforce trial (only for school users, not platform admin)
    if (schoolId != null) {
      const [schools] = await db.execute(
        'SELECT id, name, status, trial_ends_at FROM schools WHERE id = ?',
        [schoolId]
      ) as any[];
      const school = schools[0];
      if (school) {
        const now = new Date();
        const trialEnded = school.status === 'expired' ||
          (school.status === 'trial' && school.trial_ends_at && new Date(school.trial_ends_at) < now);
        if (trialEnded) {
          throw createError('Trial expired. Please contact us to upgrade.', 401);
        }
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: roleName,
        roleId: user.role_id,
        schoolId: schoolId ?? undefined,
        isPlatformAdmin: isPlatformAdmin || undefined,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    // Load school info for response (for school users)
    let schoolInfo: { id: number; name: string; status: string; trialEndsAt: string | null } | null = null;
    if (schoolId != null) {
      const [schools] = await db.execute(
        'SELECT id, name, status, trial_ends_at FROM schools WHERE id = ?',
        [schoolId]
      ) as any[];
      const s = schools[0];
      if (s) {
        schoolInfo = {
          id: s.id,
          name: s.name,
          status: s.status,
          trialEndsAt: s.trial_ends_at ? new Date(s.trial_ends_at).toISOString() : null,
        };
      }
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleName,
        roleId: user.role_id,
        schoolId: schoolId ?? undefined,
        schoolName: schoolInfo?.name,
        schoolStatus: schoolInfo?.status,
        trialEndsAt: schoolInfo?.trialEndsAt,
        isPlatformAdmin: isPlatformAdmin || undefined,
      },
      school: schoolInfo,
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      throw createError('Email, password, and name are required', 400);
    }

    const db = getDatabase();

    // Check if user exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (existingUsers.length > 0) {
      throw createError('User already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get default role (or use provided role)
    let roleId = 2; // Default to 'user' role
    if (role) {
      const [roles] = await db.execute(
        'SELECT id FROM roles WHERE name = ?',
        [role]
      ) as any[];
      if (roles.length > 0) {
        roleId = roles[0].id;
      }
    }

    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (email, password, name, role_id, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
      [email, hashedPassword, name, roleId]
    ) as any;

    // Get the created user with role
    const [newUsers] = await db.execute(
      'SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [result.insertId]
    ) as any[];

    const newUser = newUsers[0];

    // Generate token for new user
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role_name || 'user',
        roleId: newUser.role_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role_name || 'user',
        roleId: newUser.role_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const db = getDatabase();
    const [users] = await db.execute(
      'SELECT u.*, r.name as role, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [req.user.id]
    ) as any[];

    if (users.length === 0) {
      throw createError('User not found', 404);
    }

    const user = users[0];
    const schoolId = user.school_id ?? null;
    let schoolInfo: { id: number; name: string; status: string; trialEndsAt: string | null } | null = null;
    if (schoolId != null) {
      try {
        const [schools] = await db.execute(
          'SELECT id, name, status, trial_ends_at FROM schools WHERE id = ?',
          [schoolId]
        ) as any[];
        const s = schools[0];
        if (s) {
          schoolInfo = {
            id: s.id,
            name: s.name,
            status: s.status,
            trialEndsAt: s.trial_ends_at ? new Date(s.trial_ends_at).toISOString() : null,
          };
        }
      } catch {
        // Schools table may not exist before Phase 1 migration
      }
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || user.role_name,
        roleId: user.role_id,
        schoolId: schoolId ?? undefined,
        schoolName: schoolInfo?.name,
        schoolStatus: schoolInfo?.status,
        trialEndsAt: schoolInfo?.trialEndsAt,
        isPlatformAdmin: (user.role_name === 'superadmin' && schoolId == null) || undefined,
      },
      school: schoolInfo,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError('Refresh token is required', 400);
    }

    // Verify refresh token and generate new access token
    // Implementation depends on your refresh token strategy
    throw createError('Refresh token not implemented yet', 501);
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // JWT is stateless; client token removal is the source of truth for logout.
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// Forgot / reset password handlers
// --------------------------------------------------

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const db = getDatabase();

    // find user by email
    const [users] = await db.execute(
      'SELECT id, name, school_id FROM users WHERE email = ? AND is_active = 1 LIMIT 1',
      [email]
    ) as any[];

    if (users.length === 0) {
      // send generic success to avoid enumeration
      res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
      return;
    }

    const user = users[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // store or update token
    await db.execute(
      `REPLACE INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [user.id, tokenHash, expiresAt]
    );

    // send reset email
    const frontendBase = process.env.FRONTEND_URL || '';
    const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
    await import('../utils/emailService').then(({ sendPasswordResetEmail }) =>
      sendPasswordResetEmail(email, user.name || '', resetUrl, user.school_id ?? undefined)
    );

    res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE' || error?.code === 'ER_BAD_TABLE_ERROR') {
      next(createError('Password reset setup is incomplete on server. Please run database migration 037_password_resets_table.sql.', 503));
      return;
    }
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const db = getDatabase();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // look up token
    const [rows] = await db.execute(
      'SELECT user_id, expires_at FROM password_resets WHERE token = ? LIMIT 1',
      [tokenHash]
    ) as any[];
    if (rows.length === 0) {
      throw createError('Invalid or expired reset token', 400);
    }
    const rec = rows[0];
    if (new Date(rec.expires_at) < new Date()) {
      // expired
      await db.execute('DELETE FROM password_resets WHERE token = ?', [tokenHash]);
      throw createError('Invalid or expired reset token', 400);
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, rec.user_id]);
    await db.execute('DELETE FROM password_resets WHERE token = ?', [tokenHash]);

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};


