import express from 'express';
import {
  getInquiries, getInquiry, createInquiry, updateInquiryStatus, deleteInquiry,
  getImportantDates, createImportantDate, updateImportantDate, deleteImportantDate,
  getContactDetails, updateContactDetails,
} from '../controllers/admissionManagement.controller';
import { authenticate, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// Public route for creating inquiries (no auth required)
router.post('/inquiries', createInquiry);

// Admin routes - require authentication and admin/superadmin role
router.use(authenticate);
router.use(authorize('superadmin', 'admin'));

// Inquiry routes
router.get('/inquiries', checkPermission('students', 'view'), getInquiries);
router.get('/inquiries/:id', checkPermission('students', 'view'), getInquiry);
router.put('/inquiries/:id/status', checkPermission('students', 'edit'), updateInquiryStatus);
router.delete('/inquiries/:id', checkPermission('students', 'delete'), deleteInquiry);

// Important Dates routes
router.get('/important-dates', checkPermission('settings', 'view'), getImportantDates);
router.post('/important-dates', checkPermission('settings', 'add'), createImportantDate);
router.put('/important-dates/:id', checkPermission('settings', 'edit'), updateImportantDate);
router.delete('/important-dates/:id', checkPermission('settings', 'delete'), deleteImportantDate);

// Contact Details routes
router.get('/contact-details', checkPermission('settings', 'view'), getContactDetails);
router.put('/contact-details', checkPermission('settings', 'edit'), updateContactDetails);

export default router;

