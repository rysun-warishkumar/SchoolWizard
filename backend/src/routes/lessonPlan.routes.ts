import express from 'express';
import {
  getSubjectStatus,
  getSubjectStatusById,
  createSubjectStatus,
  updateSubjectStatus,
  deleteSubjectStatus,
  getLessonPlans,
  getLessonPlanById,
  createLessonPlan,
  updateLessonPlan,
  deleteLessonPlan,
  getLessonPlanTopics,
  createLessonPlanTopic,
  updateLessonPlanTopic,
  deleteLessonPlanTopic,
  uploadLessonPlanAttachment,
  deleteLessonPlanAttachment,
  upload,
} from '../controllers/lessonPlan.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Subject Status routes
router.get('/subject-status', checkPermission('lesson-plan', 'view'), getSubjectStatus);
router.get('/subject-status/:id', checkPermission('lesson-plan', 'view'), getSubjectStatusById);
router.post('/subject-status', checkPermission('lesson-plan', 'add'), createSubjectStatus);
router.put('/subject-status/:id', checkPermission('lesson-plan', 'edit'), updateSubjectStatus);
router.delete('/subject-status/:id', checkPermission('lesson-plan', 'delete'), deleteSubjectStatus);

// Lesson Plans routes
router.get('/lesson-plans', checkPermission('lesson-plan', 'view'), getLessonPlans);
router.get('/lesson-plans/:id', checkPermission('lesson-plan', 'view'), getLessonPlanById);
router.post('/lesson-plans', checkPermission('lesson-plan', 'add'), createLessonPlan);
router.put('/lesson-plans/:id', checkPermission('lesson-plan', 'edit'), updateLessonPlan);
router.delete('/lesson-plans/:id', checkPermission('lesson-plan', 'delete'), deleteLessonPlan);

// Lesson Plan Topics routes
router.get('/topics', checkPermission('lesson-plan', 'view'), getLessonPlanTopics);
router.post('/topics', checkPermission('lesson-plan', 'add'), createLessonPlanTopic);
router.put('/topics/:id', checkPermission('lesson-plan', 'edit'), updateLessonPlanTopic);
router.delete('/topics/:id', checkPermission('lesson-plan', 'delete'), deleteLessonPlanTopic);

// Lesson Plan Attachments routes
router.post('/attachments', checkPermission('lesson-plan', 'add'), upload.single('file'), uploadLessonPlanAttachment);
router.delete('/attachments/:id', checkPermission('lesson-plan', 'delete'), deleteLessonPlanAttachment);

export default router;

