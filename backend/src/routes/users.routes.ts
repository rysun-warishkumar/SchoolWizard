import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getParentUsers,
  resetParentUserPassword,
} from '../controllers/users.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/', checkPermission('users', 'view'), getUsers);

// Get user by ID
router.get('/:id', checkPermission('users', 'view'), getUserById);

// Create user (admin only)
router.post('/', checkPermission('users', 'add'), createUser);

// Update user
router.put('/:id', checkPermission('users', 'edit'), updateUser);

// Delete user (admin only)
router.delete('/:id', checkPermission('users', 'delete'), deleteUser);

// Toggle user status (admin only)
router.patch('/:id/toggle-status', checkPermission('users', 'edit'), toggleUserStatus);

// Get parent users with children (admin only)
router.get('/parents/list', checkPermission('users', 'view'), getParentUsers);

// Reset parent password (admin only)
router.post('/parents/:id/reset-password', checkPermission('users', 'edit'), resetParentUserPassword);

export default router;

