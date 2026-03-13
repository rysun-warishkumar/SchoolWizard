import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';

export const getRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();

    const [roles] = await db.execute(
      'SELECT * FROM roles ORDER BY id ASC'
    ) as any[];

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [roles] = await db.execute(
      'SELECT * FROM roles WHERE id = ?',
      [id]
    ) as any[];

    if (roles.length === 0) {
      throw createError('Role not found', 404);
    }

    res.json({
      success: true,
      data: roles[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw createError('Role name is required', 400);
    }

    const db = getDatabase();

    // Check if role exists
    const [existingRoles] = await db.execute(
      'SELECT id FROM roles WHERE name = ?',
      [name.toLowerCase()]
    ) as any[];

    if (existingRoles.length > 0) {
      throw createError('Role with this name already exists', 400);
    }

    const [result] = await db.execute(
      'INSERT INTO roles (name, description, created_at) VALUES (?, ?, NOW())',
      [name.toLowerCase(), description || null]
    ) as any;

    const [newRoles] = await db.execute(
      'SELECT * FROM roles WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: newRoles[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const db = getDatabase();

    // Prevent updating superadmin role
    if (id === '1') {
      throw createError('Cannot update superadmin role', 403);
    }

    // Check if role exists
    const [roles] = await db.execute(
      'SELECT * FROM roles WHERE id = ?',
      [id]
    ) as any[];

    if (roles.length === 0) {
      throw createError('Role not found', 404);
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      // Check if new name conflicts with existing role
      const [existingRoles] = await db.execute(
        'SELECT id FROM roles WHERE name = ? AND id != ?',
        [name.toLowerCase(), id]
      ) as any[];

      if (existingRoles.length > 0) {
        throw createError('Role with this name already exists', 400);
      }

      updates.push('name = ?');
      params.push(name.toLowerCase());
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (updates.length === 0) {
      throw createError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.execute(
      `UPDATE roles SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const [updatedRoles] = await db.execute(
      'SELECT * FROM roles WHERE id = ?',
      [id]
    ) as any[];

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: updatedRoles[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Prevent deleting superadmin role
    if (id === '1') {
      throw createError('Cannot delete superadmin role', 403);
    }

    // Check if role is in use
    const [users] = await db.execute(
      'SELECT COUNT(*) as count FROM users WHERE role_id = ?',
      [id]
    ) as any[];

    if (users[0].count > 0) {
      throw createError('Cannot delete role that is assigned to users', 400);
    }

    await db.execute('DELETE FROM roles WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get all modules
export const getModules = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();

    const [modules] = await db.execute(
      'SELECT * FROM modules WHERE is_active = TRUE ORDER BY display_order ASC, name ASC'
    ) as any[];

    res.json({
      success: true,
      data: modules,
    });
  } catch (error) {
    next(error);
  }
};

// Get all permissions
export const getPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();

    const [permissions] = await db.execute(
      'SELECT * FROM permissions ORDER BY id ASC'
    ) as any[];

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
};

// Get role permissions (all modules with their permissions for a role)
export const getRolePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Verify role exists
    const [roles] = await db.execute(
      'SELECT * FROM roles WHERE id = ?',
      [id]
    ) as any[];

    if (roles.length === 0) {
      throw createError('Role not found', 404);
    }

    // Get all modules
    const [modules] = await db.execute(
      'SELECT * FROM modules WHERE is_active = TRUE ORDER BY display_order ASC, name ASC'
    ) as any[];

    // Get all permissions
    const [permissions] = await db.execute(
      'SELECT * FROM permissions ORDER BY id ASC'
    ) as any[];

    // Get role permissions
    const [rolePermissions] = await db.execute(
      `SELECT module_id, permission_id, granted 
       FROM role_permissions 
       WHERE role_id = ?`,
      [id]
    ) as any[];

    // Create a map for quick lookup
    const permissionMap = new Map<string, boolean>();
    rolePermissions.forEach((rp: any) => {
      const key = `${rp.module_id}_${rp.permission_id}`;
      permissionMap.set(key, rp.granted === 1 || rp.granted === true);
    });

    // Build response structure
    const modulesWithPermissions = modules.map((module: any) => {
      const modulePermissions = permissions.map((permission: any) => {
        const key = `${module.id}_${permission.id}`;
        const granted = permissionMap.get(key) || false;
        return {
          id: permission.id,
          name: permission.name,
          display_name: permission.display_name,
          granted,
        };
      });

      return {
        id: module.id,
        name: module.name,
        display_name: module.display_name,
        description: module.description,
        icon: module.icon,
        route_path: module.route_path,
        permissions: modulePermissions,
      };
    });

    res.json({
      success: true,
      data: {
        roleId: Number(id),
        roleName: roles[0].name,
        modules: modulesWithPermissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update role permissions
export const updateRolePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { permissions } = req.body; // Array of { module_id, permission_id, granted }

    if (!permissions || !Array.isArray(permissions)) {
      throw createError('Permissions array is required', 400);
    }

    const db = getDatabase();

    // Prevent updating superadmin role permissions
    if (id === '1') {
      throw createError('Cannot modify superadmin role permissions', 403);
    }

    // Verify role exists
    const [roles] = await db.execute(
      'SELECT * FROM roles WHERE id = ?',
      [id]
    ) as any[];

    if (roles.length === 0) {
      throw createError('Role not found', 404);
    }

    const roleName = String(roles[0].name || '').toLowerCase();
    const [dashboardModules] = await db.execute(
      "SELECT id FROM modules WHERE name = 'dashboard' LIMIT 1"
    ) as any[];
    const [viewPermissions] = await db.execute(
      "SELECT id FROM permissions WHERE name = 'view' LIMIT 1"
    ) as any[];

    const dashboardModuleId = dashboardModules[0]?.id;
    const viewPermissionId = viewPermissions[0]?.id;
    const grantedPermissions = permissions
      .filter((p: any) => p.granted === true)
      .sort((a: any, b: any) => {
        if (a.module_id !== b.module_id) return a.module_id - b.module_id;
        return a.permission_id - b.permission_id;
      });

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        // Simplify lock footprint: clear role permissions, then re-insert desired set.
        await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [id]);

        for (const perm of grantedPermissions) {
          await connection.execute(
            `INSERT INTO role_permissions (role_id, module_id, permission_id, granted) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE granted = VALUES(granted)`,
            [id, perm.module_id, perm.permission_id, true]
          );
        }

        // Ensure dashboard view is always granted for non-superadmin roles.
        if (roleName !== 'superadmin' && dashboardModuleId && viewPermissionId) {
          await connection.execute(
            `INSERT INTO role_permissions (role_id, module_id, permission_id, granted) 
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE granted = VALUES(granted)`,
            [id, dashboardModuleId, viewPermissionId, true]
          );
        }

        await connection.commit();
        connection.release();

        res.json({
          success: true,
          message: 'Permissions updated successfully',
        });
        return;
      } catch (error: any) {
        await connection.rollback();
        connection.release();

        const isDeadlock = error?.code === 'ER_LOCK_DEADLOCK' || error?.errno === 1213;
        if (!isDeadlock || attempt === maxRetries) {
          throw error;
        }

        // Brief backoff before retrying deadlocked transactions.
        await new Promise((resolve) => setTimeout(resolve, 80 * attempt));
      }
    }
  } catch (error) {
    next(error);
  }
};

