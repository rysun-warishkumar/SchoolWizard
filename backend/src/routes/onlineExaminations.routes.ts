import express from 'express';
import {
  getQuestionBank,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getOnlineExams,
  getOnlineExamById,
  createOnlineExam,
  updateOnlineExam,
  deleteOnlineExam,
  addQuestionToExam,
  removeQuestionFromExam,
  assignStudentsToExam,
  removeStudentFromExam,
  getMyOnlineExams,
  startExamAttempt,
  saveAnswer,
  submitExam,
  terminateExam,
} from '../controllers/onlineExaminations.controller';
import {
  getMyExamResult,
  getExamResults,
  getStudentExamResult,
  publishExamResults,
} from '../controllers/onlineExaminations_results';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Student Online Exams Route (no permission check - students can access their own exams)
router.get('/my-online-exams', getMyOnlineExams);

// Student Exam Attempt Routes (no permission check - students can attempt their own exams)
router.post('/online-exams/:online_exam_id/start', startExamAttempt);
router.post('/attempts/:attempt_id/answers', saveAnswer);
router.post('/attempts/:attempt_id/submit', submitExam);
router.post('/attempts/:attempt_id/terminate', terminateExam);

// Student Result Routes (no permission check - students can view their own results)
router.get('/online-exams/:online_exam_id/my-result', getMyExamResult);

// Question Bank Routes
router.get('/question-bank', checkPermission('online-examinations', 'view'), getQuestionBank);
router.get('/question-bank/:id', checkPermission('online-examinations', 'view'), getQuestionById);
router.post('/question-bank', checkPermission('online-examinations', 'add'), createQuestion);
router.put('/question-bank/:id', checkPermission('online-examinations', 'edit'), updateQuestion);
router.delete('/question-bank/:id', checkPermission('online-examinations', 'delete'), deleteQuestion);

// Online Exams Routes
router.get('/online-exams', checkPermission('online-examinations', 'view'), getOnlineExams);
router.get('/online-exams/:id', checkPermission('online-examinations', 'view'), getOnlineExamById);
router.post('/online-exams', checkPermission('online-examinations', 'add'), createOnlineExam);
router.put('/online-exams/:id', checkPermission('online-examinations', 'edit'), updateOnlineExam);
router.delete('/online-exams/:id', checkPermission('online-examinations', 'delete'), deleteOnlineExam);

// Online Exam Questions Routes
router.post('/online-exams/:online_exam_id/questions', checkPermission('online-examinations', 'edit'), addQuestionToExam);
router.delete('/online-exams/:online_exam_id/questions/:question_id', checkPermission('online-examinations', 'edit'), removeQuestionFromExam);

// Online Exam Students Routes
router.post('/online-exams/:online_exam_id/students', checkPermission('online-examinations', 'edit'), assignStudentsToExam);
router.delete('/online-exams/:online_exam_id/students/:student_id', checkPermission('online-examinations', 'edit'), removeStudentFromExam);

// Exam Results Routes (admin/teacher)
router.get('/online-exams/:online_exam_id/results', checkPermission('online-examinations', 'view'), getExamResults);
router.get('/online-exams/:online_exam_id/results/:student_id', checkPermission('online-examinations', 'view'), getStudentExamResult);
router.put('/online-exams/:online_exam_id/publish-results', checkPermission('online-examinations', 'edit'), publishExamResults);

export default router;

