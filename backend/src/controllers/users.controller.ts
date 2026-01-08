import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { resetParentPassword } from '../services/parentUserService';

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const db = getDatabase();

    let query = `
      SELECT u.id, u.email, u.name, u.role_id, u.is_active, u.last_login, u.created_at,
             r.name as role, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role) {
      query += ' AND r.name = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY u.created_at DESC';

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [users] = await db.execute(query, params) as any[];

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (role) {
      countQuery += ' AND r.name = ?';
      countParams.push(role);
    }

    if (search) {
      countQuery += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await db.execute(countQuery, countParams) as any[];
    const total = countResult[0].total;

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [users] = await db.execute(
      `SELECT u.*, r.name as role, r.name as role_name, r.description as role_description
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [id]
    ) as any[];

    if (users.length === 0) {
      throw createError('User not found', 404);
    }

    const user = users[0];
    // Remove password from response
    delete user.password;

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, role_id } = req.body;

    if (!email || !password || !name || !role_id) {
      throw createError('Email, password, name, and role_id are required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError('Invalid email format', 400);
    }

    const db = getDatabase();

    // Check if user exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (existingUsers.length > 0) {
      throw createError('User with this email already exists', 400);
    }

    // Verify role exists
    const [roles] = await db.execute(
      'SELECT id FROM roles WHERE id = ?',
      [role_id]
    ) as any[];

    if (roles.length === 0) {
      throw createError('Invalid role', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (email, password, name, role_id, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
      [email, hashedPassword, name, role_id]
    ) as any;

    // Get created user
    const [newUsers] = await db.execute(
      `SELECT u.*, r.name as role, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [result.insertId]
    ) as any[];

    const newUser = newUsers[0];
    delete newUser.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, name, role_id, is_active } = req.body;
    const db = getDatabase();

    // Check if user exists
    const [users] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    ) as any[];

    if (users.length === 0) {
      throw createError('User not found', 404);
    }

    // Users can only update their own profile unless they're admin
    if (req.user?.id !== id && req.user?.role !== 'superadmin' && req.user?.role !== 'admin') {
      throw createError('Not authorized to update this user', 403);
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw createError('Invalid email format', 400);
      }
      updates.push('email = ?');
      params.push(email);
    }

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }

    if (role_id && (req.user?.role === 'superadmin' || req.user?.role === 'admin')) {
      // Verify role exists
      const [roles] = await db.execute(
        'SELECT id FROM roles WHERE id = ?',
        [role_id]
      ) as any[];

      if (roles.length === 0) {
        throw createError('Invalid role', 400);
      }
      updates.push('role_id = ?');
      params.push(role_id);
    }

    if (is_active !== undefined && (req.user?.role === 'superadmin' || req.user?.role === 'admin')) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      throw createError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated user
    const [updatedUsers] = await db.execute(
      `SELECT u.*, r.name as role, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [id]
    ) as any[];

    const updatedUser = updatedUsers[0];
    delete updatedUser.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if user exists
    const [users] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    ) as any[];

    if (users.length === 0) {
      throw createError('User not found', 404);
    }

    // Prevent deleting superadmin
    if (users[0].role_id === 1) {
      throw createError('Cannot delete superadmin user', 403);
    }

    await db.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if user exists
    const [users] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    ) as any[];

    if (users.length === 0) {
      throw createError('User not found', 404);
    }

    // Prevent disabling superadmin
    if (users[0].role_id === 1) {
      throw createError('Cannot disable superadmin user', 403);
    }

    const newStatus = users[0].is_active ? 0 : 1;

    await db.execute(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );

    res.json({
      success: true,
      message: `User ${newStatus ? 'enabled' : 'disabled'} successfully`,
      data: {
        id,
        is_active: newStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all parent users with their associated children
 */
export const getParentUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const db = getDatabase();

    let query = `
      SELECT u.id, u.email, u.name, u.is_active, u.last_login, u.created_at,
             COUNT(DISTINCT s.id) as children_count,
             GROUP_CONCAT(DISTINCT CONCAT(s.first_name, ' ', IFNULL(s.last_name, ''), ' (', s.admission_no, ')') SEPARATOR ', ') as children_names
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN students s ON (s.father_email = u.email OR s.mother_email = u.email OR s.guardian_email = u.email)
      WHERE r.name = 'parent'
    `;
    const params: any[] = [];

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' GROUP BY u.id ORDER BY u.created_at DESC';

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [parents] = await db.execute(query, params) as any[];

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'parent'
    `;
    const countParams: any[] = [];

    if (search) {
      countQuery += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await db.execute(countQuery, countParams) as any[];
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: parents,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset parent password
 */
export const resetParentUserPassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { send_email = true } = req.body;

    const result = await resetParentPassword(Number(id), send_email);

    res.json({
      success: true,
      message: send_email
        ? 'Password reset successfully. New password has been sent to parent email.'
        : 'Password reset successfully.',
      data: {
        email: result.email,
        password: result.password,
      },
    });
  } catch (error) {
    next(error);
  }
};

