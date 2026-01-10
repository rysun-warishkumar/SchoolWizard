import express from 'express';
import {
  getDepartments,
  createDepartment,
  getDesignations,
  createDesignation,
  getLeaveTypes,
  createLeaveType,
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  disableStaff,
  enableStaff,
  getStaffAttendance,
  submitStaffAttendance,
  getStaffAttendanceReport,
  getLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  getPayroll,
  getPayrollById,
  generatePayroll,
  updatePayroll,
  revertPayrollStatus,
  getMyStaffProfile,
  getMyClasses,
  getMyStudents,
  getMyTimetable,
  bulkImportStaff,
} from '../controllers/hr.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Departments
router.get('/departments', checkPermission('hr', 'view'), getDepartments);
router.post('/departments', checkPermission('hr', 'add'), createDepartment);

// Designations
router.get('/designations', checkPermission('hr', 'view'), getDesignations);
router.post('/designations', checkPermission('hr', 'add'), createDesignation);

// Leave Types
router.get('/leave-types', checkPermission('hr', 'view'), getLeaveTypes);
router.post('/leave-types', checkPermission('hr', 'add'), createLeaveType);

// Staff
router.get('/staff', checkPermission('hr', 'view'), getStaff);
router.get('/staff/my-profile', getMyStaffProfile); // Staff can view their own - no permission check
router.get('/staff/my-classes', getMyClasses); // Staff can view their own - no permission check
router.get('/staff/my-students', getMyStudents); // Staff can view their own - no permission check
router.get('/staff/my-timetable', getMyTimetable); // Staff can view their own - no permission check
router.post('/staff/bulk-import', checkPermission('hr', 'add'), bulkImportStaff); // Bulk import - must be before /staff/:id
router.get('/staff/:id', checkPermission('hr', 'view'), getStaffById);
router.post('/staff', checkPermission('hr', 'add'), createStaff);
router.put('/staff/:id', checkPermission('hr', 'edit'), updateStaff);
router.delete('/staff/:id', checkPermission('hr', 'delete'), deleteStaff);
router.patch('/staff/:id/disable', checkPermission('hr', 'edit'), disableStaff);
router.patch('/staff/:id/enable', checkPermission('hr', 'edit'), enableStaff);

// Staff Attendance
router.get('/staff-attendance', checkPermission('hr', 'view'), getStaffAttendance);
router.post('/staff-attendance', checkPermission('hr', 'add'), submitStaffAttendance);
router.get('/staff-attendance/report', checkPermission('hr', 'view'), getStaffAttendanceReport);

// Leave Requests
router.get('/leave-requests', checkPermission('hr', 'view'), getLeaveRequests);
router.get('/leave-requests/:id', checkPermission('hr', 'view'), getLeaveRequestById);
router.post('/leave-requests', createLeaveRequest); // Staff can create their own - no permission check
router.put('/leave-requests/:id', checkPermission('hr', 'edit'), updateLeaveRequest);
router.delete('/leave-requests/:id', checkPermission('hr', 'delete'), deleteLeaveRequest);

// Payroll
router.get('/payroll', checkPermission('hr', 'view'), getPayroll);
router.get('/payroll/:id', checkPermission('hr', 'view'), getPayrollById);
router.post('/payroll', checkPermission('hr', 'add'), generatePayroll);
router.put('/payroll/:id', checkPermission('hr', 'edit'), updatePayroll);
router.patch('/payroll/:id/revert', checkPermission('hr', 'edit'), revertPayrollStatus);

export default router;

