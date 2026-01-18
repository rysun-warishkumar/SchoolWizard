import express from 'express';
import {
  getPublishedExams,
  getStudentResult,
} from '../controllers/publicExaminations.controller';

const router = express.Router();

// No authentication required for these routes - they are public
// Get published exams list
router.get('/published-exams', getPublishedExams);

// Get student result (requires roll number and DOB verification)
router.post('/student-result', getStudentResult);

export default router;
