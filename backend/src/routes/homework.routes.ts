import express from 'express';
import {
  getHomework,
  getHomeworkById,
  createHomework,
  updateHomework,
  deleteHomework,
  evaluateHomework,
  updateHomeworkEvaluation,
  upload,
} from '../controllers/homework.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Homework Routes
router.get('/', checkPermission('homework', 'view'), getHomework);
router.get('/:id', checkPermission('homework', 'view'), getHomeworkById);
router.post('/', checkPermission('homework', 'add'), upload.single('attachment'), createHomework);
router.put('/:id', checkPermission('homework', 'edit'), updateHomework);
router.delete('/:id', checkPermission('homework', 'delete'), deleteHomework);

// Homework Evaluation Routes
router.post('/:homework_id/evaluate', checkPermission('homework', 'edit'), evaluateHomework);
router.put('/evaluations/:id', checkPermission('homework', 'edit'), updateHomeworkEvaluation);

export default router;

