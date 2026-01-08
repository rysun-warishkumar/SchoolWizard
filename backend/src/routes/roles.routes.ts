import express from 'express';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getModules,
  getPermissions,
  getRolePermissions,
  updateRolePermissions,
} from '../controllers/roles.controller';
import { authenticate, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication and admin access
router.use(authenticate);
router.use(authorize('superadmin', 'admin')); // Keep role-based check for roles module

router.get('/', checkPermission('roles', 'view'), getRoles);
router.get('/modules', checkPermission('roles', 'view'), getModules);
router.get('/permissions', checkPermission('roles', 'view'), getPermissions);
router.get('/:id', checkPermission('roles', 'view'), getRoleById);
router.post('/', checkPermission('roles', 'add'), createRole);
router.put('/:id', checkPermission('roles', 'edit'), updateRole);
router.delete('/:id', checkPermission('roles', 'delete'), deleteRole);
router.get('/:id/permissions', checkPermission('roles', 'view'), getRolePermissions);
router.put('/:id/permissions', checkPermission('roles', 'edit'), updateRolePermissions);

export default router;

