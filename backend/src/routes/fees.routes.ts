import express from 'express';
import {
  getFeesTypes,
  createFeesType,
  getFeesGroups,
  getFeesGroupById,
  createFeesGroup,
  updateFeesGroup,
  getFeesMaster,
  createFeesMaster,
  getFeesDiscounts,
  createFeesDiscount,
  getStudentFeesInvoices,
  getFeesPayments,
  createFeesPayment,
  getCarryForward,
  getStudentBalanceForCarryForward,
  createCarryForward,
  updateCarryForward,
  getFeesReminderSettings,
  updateFeesReminderSettings,
  getFeesReminderLogs,
  getFeesGroupAssignments,
  assignFeesGroup,
  removeFeesGroupAssignment,
  downloadInvoicePDF,
} from '../controllers/fees.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission, checkPermissionOrStudentOwnData } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Fees Types
router.get('/fees-types', checkPermission('fees', 'view'), getFeesTypes);
router.post('/fees-types', checkPermission('fees', 'add'), createFeesType);

// Fees Groups
router.get('/fees-groups', checkPermission('fees', 'view'), getFeesGroups);
router.get('/fees-groups/:id', checkPermission('fees', 'view'), getFeesGroupById);
router.post('/fees-groups', checkPermission('fees', 'add'), createFeesGroup);
router.put('/fees-groups/:id', checkPermission('fees', 'edit'), updateFeesGroup);

// Fees Master
router.get('/fees-master', checkPermission('fees', 'view'), getFeesMaster);
router.post('/fees-master', checkPermission('fees', 'add'), createFeesMaster);

// Fees Discounts
router.get('/fees-discounts', checkPermission('fees', 'view'), getFeesDiscounts);
router.post('/fees-discounts', checkPermission('fees', 'add'), createFeesDiscount);

// Fees Invoices - Allow students to view their own fees
// IMPORTANT: More specific routes must come before general routes
router.get('/fees-invoices/:invoice_id/download-pdf', checkPermissionOrStudentOwnData('fees', 'view'), downloadInvoicePDF);
router.get('/fees-invoices', checkPermissionOrStudentOwnData('fees', 'view'), getStudentFeesInvoices);

// Debug: Test route to verify routing works
// router.get('/test-download', (req, res) => {
//   res.json({ message: 'Test route works', params: req.params });
// });

// Fees Payments - Allow students to view their own payments
router.get('/fees-payments', checkPermissionOrStudentOwnData('fees', 'view'), getFeesPayments);
router.post('/fees-payments', checkPermission('fees', 'add'), createFeesPayment);

// Fees Carry Forward
router.get('/carry-forward', checkPermission('fees', 'view'), getCarryForward);
router.get('/carry-forward/students', checkPermission('fees', 'view'), getStudentBalanceForCarryForward);
router.post('/carry-forward', checkPermission('fees', 'add'), createCarryForward);
router.put('/carry-forward/:id', checkPermission('fees', 'edit'), updateCarryForward);

// Fees Reminder
router.get('/reminder/settings', checkPermission('fees', 'view'), getFeesReminderSettings);
router.put('/reminder/settings', checkPermission('fees', 'edit'), updateFeesReminderSettings);
router.get('/reminder/logs', checkPermission('fees', 'view'), getFeesReminderLogs);

// Fees Group Assignments
router.get('/fees-group-assignments', checkPermission('fees', 'view'), getFeesGroupAssignments);
router.post('/fees-group-assignments', checkPermission('fees', 'add'), assignFeesGroup);
router.delete('/fees-group-assignments/:id', checkPermission('fees', 'delete'), removeFeesGroupAssignment);

export default router;

