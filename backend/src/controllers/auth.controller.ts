import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
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
      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Login attempt failed: User not found or inactive', { email });
      }
      throw createError('Invalid credentials', 401);
    }

    const user = users[0];
    
    // Log for debugging (without password)
    if (process.env.NODE_ENV === 'development') {
      console.log('User found:', { id: user.id, email: user.email, hasPassword: !!user.password });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Login attempt failed: Invalid password', { email });
      }
      throw createError('Invalid credentials', 401);
    }

    // Get user role
    const [roles] = await db.execute(
      'SELECT * FROM roles WHERE id = ?',
      [user.role_id]
    ) as any[];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: roles[0]?.name || 'user',
        roleId: user.role_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roles[0]?.name || 'user',
        roleId: user.role_id,
      },
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

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || user.role_name,
        roleId: user.role_id,
      },
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

