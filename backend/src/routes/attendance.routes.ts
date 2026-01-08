import express from 'express';
import {
  getStudentAttendance,
  getMyStudentAttendance,
  submitStudentAttendance,
  getAttendanceByDate,
  getStudentLeaveRequests,
  getStudentLeaveRequestById,
  createStudentLeaveRequest,
  updateStudentLeaveRequest,
  deleteStudentLeaveRequest,
} from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Student Attendance
router.get('/student-attendance', checkPermission('attendance', 'view'), getStudentAttendance);
router.get('/my-attendance', getMyStudentAttendance); // For student panel - no permission check
router.post('/student-attendance', checkPermission('attendance', 'add'), submitStudentAttendance);

// Attendance By Date
router.get('/attendance-by-date', checkPermission('attendance', 'view'), getAttendanceByDate);

// Student Leave Requests
router.get('/student-leave-requests', checkPermission('attendance', 'view'), getStudentLeaveRequests);
router.get('/student-leave-requests/:id', checkPermission('attendance', 'view'), getStudentLeaveRequestById);
router.post('/student-leave-requests', createStudentLeaveRequest); // Students can create their own - no permission check
router.put('/student-leave-requests/:id', checkPermission('attendance', 'edit'), updateStudentLeaveRequest);
router.delete('/student-leave-requests/:id', checkPermission('attendance', 'delete'), deleteStudentLeaveRequest);

export default router;

