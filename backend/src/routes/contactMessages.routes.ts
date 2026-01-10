import express from 'express';
import {
  getContactMessages,
  getContactMessage,
  createContactMessage,
  updateContactMessageStatus,
  deleteContactMessage,
} from '../controllers/contactMessages.controller';
import { authenticate, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// Admin routes - require authentication and admin/superadmin role
router.use(authenticate);
router.use(authorize('superadmin', 'admin'));

// Contact message routes
router.get('/', checkPermission('settings', 'view'), getContactMessages);
router.get('/:id', checkPermission('settings', 'view'), getContactMessage);
router.put('/:id/status', checkPermission('settings', 'edit'), updateContactMessageStatus);
router.delete('/:id', checkPermission('settings', 'delete'), deleteContactMessage);

export default router;
