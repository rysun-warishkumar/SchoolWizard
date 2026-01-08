import express from 'express';
import {
  getStudentListReport,
  getStudentAttendanceReport,
  getStudentExamResultsReport,
  getStudentFeesReport,
  getStaffListReport,
  getStaffPayrollReport,
  getStaffLeaveReport,
  getFeesCollectionReport,
  getIncomeReport,
  getExpenseReport,
  getFinancialSummaryReport,
  getLibraryBookIssueReport,
  getTransportReport,
  getInventoryReport,
  getAdmissionEnquiryReport,
} from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Student Reports
router.get('/students/list', checkPermission('reports', 'view'), getStudentListReport);
router.get('/students/attendance', checkPermission('reports', 'view'), getStudentAttendanceReport);
router.get('/students/exam-results', checkPermission('reports', 'view'), getStudentExamResultsReport);
router.get('/students/fees', checkPermission('reports', 'view'), getStudentFeesReport);

// Staff Reports
router.get('/staff/list', checkPermission('reports', 'view'), getStaffListReport);
router.get('/staff/payroll', checkPermission('reports', 'view'), getStaffPayrollReport);
router.get('/staff/leaves', checkPermission('reports', 'view'), getStaffLeaveReport);

// Financial Reports
router.get('/financial/fees-collection', checkPermission('reports', 'view'), getFeesCollectionReport);
router.get('/financial/income', checkPermission('reports', 'view'), getIncomeReport);
router.get('/financial/expenses', checkPermission('reports', 'view'), getExpenseReport);
router.get('/financial/summary', checkPermission('reports', 'view'), getFinancialSummaryReport);

// Library Reports
router.get('/library/book-issues', checkPermission('reports', 'view'), getLibraryBookIssueReport);

// Transport Reports
router.get('/transport', checkPermission('reports', 'view'), getTransportReport);

// Inventory Reports
router.get('/inventory', checkPermission('reports', 'view'), getInventoryReport);

// Front Office Reports
router.get('/front-office/admission-enquiry', checkPermission('reports', 'view'), getAdmissionEnquiryReport);

export default router;

