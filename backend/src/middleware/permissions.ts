import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from './errorHandler';
import { AuthRequest } from './auth';

/**
 * Permission middleware to check if user has required permission for a module
 * Usage: checkPermission('students', 'view')
 */
export const checkPermission = (moduleName: string, permissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw createError('Not authenticated', 401);
      }

      // Superadmin always has access
      if (req.user.role === 'superadmin') {
        return next();
      }

      const db = getDatabase();

      // Get user's role_id
      const [users] = await db.execute(
        'SELECT role_id FROM users WHERE id = ?',
        [req.user.id]
      ) as any[];

      if (users.length === 0) {
        throw createError('User not found', 404);
      }

      const roleId = users[0].role_id;

      // Check if user has the required permission
      const [permissions] = await db.execute(
        `SELECT rp.granted
         FROM role_permissions rp
         JOIN modules m ON rp.module_id = m.id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = ? 
         AND m.name = ? 
         AND p.name = ?
         AND m.is_active = TRUE`,
        [roleId, moduleName, permissionName]
      ) as any[];

      if (permissions.length === 0 || !permissions[0].granted) {
        throw createError(
          `Access denied. You do not have ${permissionName} permission for ${moduleName} module.`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Get all modules and permissions for the current user
 */
export const getUserPermissions = async (userId: number): Promise<Record<string, string[]>> => {
  const db = getDatabase();

  // Get user's role_id
  const [users] = await db.execute(
    'SELECT role_id FROM users WHERE id = ?',
    [userId]
  ) as any[];

  if (users.length === 0) {
    return {};
  }

  const roleId = users[0].role_id;

  // Superadmin has all permissions
  if (roleId === 1) {
    const [allModules] = await db.execute(
      'SELECT name FROM modules WHERE is_active = TRUE'
    ) as any[];

    const permissions: Record<string, string[]> = {};
    allModules.forEach((module: any) => {
      permissions[module.name] = ['view', 'add', 'edit', 'delete'];
    });

    return permissions;
  }

  // Get user's permissions
  const [permissions] = await db.execute(
    `SELECT m.name as module_name, p.name as permission_name
     FROM role_permissions rp
     JOIN modules m ON rp.module_id = m.id
     JOIN permissions p ON rp.permission_id = p.id
     WHERE rp.role_id = ? 
     AND rp.granted = TRUE
     AND m.is_active = TRUE`,
    [roleId]
  ) as any[];

  // Group permissions by module
  const modulePermissions: Record<string, string[]> = {};
  permissions.forEach((perm: any) => {
    if (!modulePermissions[perm.module_name]) {
      modulePermissions[perm.module_name] = [];
    }
    modulePermissions[perm.module_name].push(perm.permission_name);
  });

  return modulePermissions;
};

/**
 * Check if user has any permission for a module (for sidebar visibility)
 */
export const hasModuleAccess = async (userId: number, moduleName: string): Promise<boolean> => {
  const permissions = await getUserPermissions(userId);
  return !!permissions[moduleName] && permissions[moduleName].length > 0;
};

/**
 * Permission middleware that allows students to access their own fees data
 * Students can view their own fees invoices and payments without the 'fees' permission
 */
export const checkPermissionOrStudentOwnData = (moduleName: string, permissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw createError('Not authenticated', 401);
      }

      // Superadmin always has access
      if (req.user.role === 'superadmin') {
        return next();
      }

      const userRole = String(req.user.role || '').toLowerCase();

      // Allow students/parents to access fees/download-center view APIs
      // (controllers enforce ownership/content scope).
      if (
        (moduleName === 'fees' || moduleName === 'download-center') &&
        permissionName === 'view' &&
        (userRole === 'student' || userRole === 'parent')
      ) {
        return next();
      }

      // For all other cases, use the standard permission check
      const db = getDatabase();

      // Get user's role_id
      const [users] = await db.execute(
        'SELECT role_id FROM users WHERE id = ?',
        [req.user.id]
      ) as any[];

      if (users.length === 0) {
        throw createError('User not found', 404);
      }

      const roleId = users[0].role_id;

      // Check if user has the required permission
      const [permissions] = await db.execute(
        `SELECT rp.granted
         FROM role_permissions rp
         JOIN modules m ON rp.module_id = m.id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = ? 
         AND m.name = ? 
         AND p.name = ?
         AND m.is_active = TRUE`,
        [roleId, moduleName, permissionName]
      ) as any[];

      if (permissions.length === 0 || !permissions[0].granted) {
        throw createError(
          `Access denied. You do not have ${permissionName} permission for ${moduleName} module.`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Permission middleware for staff self-service flows.
 * Allows teacher/staff roles to access select HR self-service endpoints
 * while controllers enforce own-record scoping.
 */
export const checkPermissionOrStaffSelfService = (moduleName: string, permissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw createError('Not authenticated', 401);
      }

      // Superadmin always has access.
      if (req.user.role === 'superadmin') {
        return next();
      }

      const userRole = String(req.user.role || '').toLowerCase();

      // Allow staff/teacher to use HR self-service view/add flows.
      if (
        moduleName === 'hr' &&
        (permissionName === 'view' || permissionName === 'add') &&
        (userRole === 'staff' || userRole === 'teacher')
      ) {
        return next();
      }

      // Fallback to standard permission lookup.
      const db = getDatabase();
      const [users] = await db.execute(
        'SELECT role_id FROM users WHERE id = ?',
        [req.user.id]
      ) as any[];

      if (users.length === 0) {
        throw createError('User not found', 404);
      }

      const roleId = users[0].role_id;
      const [permissions] = await db.execute(
        `SELECT rp.granted
         FROM role_permissions rp
         JOIN modules m ON rp.module_id = m.id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = ? 
         AND m.name = ? 
         AND p.name = ?
         AND m.is_active = TRUE`,
        [roleId, moduleName, permissionName]
      ) as any[];

      if (permissions.length === 0 || !permissions[0].granted) {
        throw createError(
          `Access denied. You do not have ${permissionName} permission for ${moduleName} module.`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

