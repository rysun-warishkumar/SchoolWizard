import express from 'express';
import {
  // Classes
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  // Sections
  getSections,
  createSection,
  updateSection,
  deleteSection,
  // Subjects
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  // Subject Groups
  getSubjectGroups,
  createSubjectGroup,
  updateSubjectGroup,
  deleteSubjectGroup,
  // Class Teachers
  getClassTeachers,
  assignClassTeacher,
  removeClassTeacher,
  // Timetable
  getTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  getTeacherTimetable,
} from '../controllers/academics.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Classes
router.get('/classes', checkPermission('academics', 'view'), getClasses);
router.post('/classes', checkPermission('academics', 'add'), createClass);
router.put('/classes/:id', checkPermission('academics', 'edit'), updateClass);
router.delete('/classes/:id', checkPermission('academics', 'delete'), deleteClass);

// Sections
router.get('/sections', checkPermission('academics', 'view'), getSections);
router.post('/sections', checkPermission('academics', 'add'), createSection);
router.put('/sections/:id', checkPermission('academics', 'edit'), updateSection);
router.delete('/sections/:id', checkPermission('academics', 'delete'), deleteSection);

// Subjects
router.get('/subjects', checkPermission('academics', 'view'), getSubjects);
router.post('/subjects', checkPermission('academics', 'add'), createSubject);
router.put('/subjects/:id', checkPermission('academics', 'edit'), updateSubject);
router.delete('/subjects/:id', checkPermission('academics', 'delete'), deleteSubject);

// Subject Groups
router.get('/subject-groups', checkPermission('academics', 'view'), getSubjectGroups);
router.post('/subject-groups', checkPermission('academics', 'add'), createSubjectGroup);
router.put('/subject-groups/:id', checkPermission('academics', 'edit'), updateSubjectGroup);
router.delete('/subject-groups/:id', checkPermission('academics', 'delete'), deleteSubjectGroup);

// Class Teachers
router.get('/class-teachers', checkPermission('academics', 'view'), getClassTeachers);
router.post('/class-teachers', checkPermission('academics', 'add'), assignClassTeacher);
router.delete('/class-teachers/:id', checkPermission('academics', 'delete'), removeClassTeacher);

// Timetable
router.get('/timetable', checkPermission('academics', 'view'), getTimetable);
router.post('/timetable', checkPermission('academics', 'add'), createTimetableEntry);
router.put('/timetable/:id', checkPermission('academics', 'edit'), updateTimetableEntry);
router.delete('/timetable/:id', checkPermission('academics', 'delete'), deleteTimetableEntry);
router.get('/teacher-timetable', checkPermission('academics', 'view'), getTeacherTimetable);

export default router;

