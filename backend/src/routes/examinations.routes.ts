import express from 'express';
import {
  getMarksGrades,
  createMarksGrade,
  getExamGroups,
  getExamGroupById,
  createExamGroup,
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getExamSubjects,
  createExamSubject,
  getExamMarks,
  submitExamMarks,
  assignExamStudents,
  getExamResults,
  getAdmitCardTemplates,
  getAdmitCardTemplateById,
  createAdmitCardTemplate,
  updateAdmitCardTemplate,
  deleteAdmitCardTemplate,
  getMarksheetTemplates,
  getMarksheetTemplateById,
  createMarksheetTemplate,
  updateMarksheetTemplate,
} from '../controllers/examinations.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Marks Grades
router.get('/marks-grades', checkPermission('examinations', 'view'), getMarksGrades);
router.post('/marks-grades', checkPermission('examinations', 'add'), createMarksGrade);

// Exam Groups
router.get('/exam-groups', checkPermission('examinations', 'view'), getExamGroups);
router.get('/exam-groups/:id', checkPermission('examinations', 'view'), getExamGroupById);
router.post('/exam-groups', checkPermission('examinations', 'add'), createExamGroup);

// Exams
router.get('/exams', checkPermission('examinations', 'view'), getExams);
router.get('/exams/:id', checkPermission('examinations', 'view'), getExamById);
router.post('/exams', checkPermission('examinations', 'add'), createExam);
router.put('/exams/:id', checkPermission('examinations', 'edit'), updateExam);
router.delete('/exams/:id', checkPermission('examinations', 'delete'), deleteExam);

// Exam Subjects
router.get('/exam-subjects', checkPermission('examinations', 'view'), getExamSubjects);
router.post('/exam-subjects', checkPermission('examinations', 'add'), createExamSubject);

// Exam Marks
router.get('/exam-marks', checkPermission('examinations', 'view'), getExamMarks);
router.post('/exam-marks', checkPermission('examinations', 'add'), submitExamMarks);

// Exam Students
router.post('/exams/:id/assign-students', checkPermission('examinations', 'edit'), assignExamStudents);

// Exam Results
router.get('/exam-results', checkPermission('examinations', 'view'), getExamResults);

// Admit Card Templates
router.get('/admit-card-templates', checkPermission('examinations', 'view'), getAdmitCardTemplates);
router.get('/admit-card-templates/:id', checkPermission('examinations', 'view'), getAdmitCardTemplateById);
router.post('/admit-card-templates', checkPermission('examinations', 'add'), createAdmitCardTemplate);
router.put('/admit-card-templates/:id', checkPermission('examinations', 'edit'), updateAdmitCardTemplate);
router.delete('/admit-card-templates/:id', checkPermission('examinations', 'delete'), deleteAdmitCardTemplate);

// Marksheet Templates
router.get('/marksheet-templates', checkPermission('examinations', 'view'), getMarksheetTemplates);
router.get('/marksheet-templates/:id', checkPermission('examinations', 'view'), getMarksheetTemplateById);
router.post('/marksheet-templates', checkPermission('examinations', 'add'), createMarksheetTemplate);
router.put('/marksheet-templates/:id', checkPermission('examinations', 'edit'), updateMarksheetTemplate);

export default router;

