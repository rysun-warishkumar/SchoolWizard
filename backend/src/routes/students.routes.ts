import express from 'express';
import {
  getStudents,
  getStudentById,
  getMyStudentProfile,
  getMyChildren,
  createStudent,
  updateStudent,
  deleteStudent,
  disableStudent,
  getStudentCategories,
  createStudentCategory,
  getStudentHouses,
  createStudentHouse,
  getDisableReasons,
  createDisableReason,
  getOnlineAdmissions,
  approveOnlineAdmission,
  rejectOnlineAdmission,
  getStudentsForPromotion,
  promoteStudents,
  uploadStudentPhoto,
  bulkImportStudents,
} from '../controllers/students.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Student Categories
router.get('/categories', checkPermission('students', 'view'), getStudentCategories);
router.post('/categories', checkPermission('students', 'add'), createStudentCategory);

// Student Houses
router.get('/houses', checkPermission('students', 'view'), getStudentHouses);
router.post('/houses', checkPermission('students', 'add'), createStudentHouse);

// Disable Reasons
router.get('/disable-reasons', checkPermission('students', 'view'), getDisableReasons);
router.post('/disable-reasons', checkPermission('students', 'add'), createDisableReason);

// Students
router.get('/', checkPermission('students', 'view'), getStudents);
router.get('/my-profile', getMyStudentProfile); // Student/Parent access - no permission check
router.get('/my-children', getMyChildren); // Parent access - no permission check

// Online Admissions
router.get('/online-admissions', checkPermission('students', 'view'), getOnlineAdmissions);
router.post('/online-admissions/:id/approve', checkPermission('students', 'edit'), approveOnlineAdmission);
router.post('/online-admissions/:id/reject', checkPermission('students', 'edit'), rejectOnlineAdmission);

// Promote Students
router.get('/promote', checkPermission('students', 'view'), getStudentsForPromotion);
router.post('/promote', checkPermission('students', 'edit'), promoteStudents);

// Bulk Import Students - MUST be before /:id route
router.post('/bulk-import', checkPermission('students', 'add'), bulkImportStudents);

// Parameterized routes - MUST be last to avoid matching specific routes
router.get('/:id', checkPermission('students', 'view'), getStudentById);
router.post('/', checkPermission('students', 'add'), uploadStudentPhoto.single('photo'), createStudent);
router.put('/:id', checkPermission('students', 'edit'), uploadStudentPhoto.single('photo'), updateStudent);
router.delete('/:id', checkPermission('students', 'delete'), deleteStudent);
router.patch('/:id/disable', checkPermission('students', 'edit'), disableStudent);

export default router;

