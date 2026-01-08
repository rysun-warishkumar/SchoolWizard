import express from 'express';
import {
  getCalendarEvents, getCalendarEventById,
  createCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
  getTodoTasks, getTodoTaskById,
  createTodoTask, updateTodoTask, deleteTodoTask,
} from '../controllers/calendar.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Calendar Events Routes
router.get('/events', checkPermission('calendar', 'view'), getCalendarEvents);
router.get('/events/:id', checkPermission('calendar', 'view'), getCalendarEventById);
router.post('/events', checkPermission('calendar', 'add'), createCalendarEvent);
router.put('/events/:id', checkPermission('calendar', 'edit'), updateCalendarEvent);
router.delete('/events/:id', checkPermission('calendar', 'delete'), deleteCalendarEvent);

// Todo Tasks Routes
router.get('/tasks', checkPermission('calendar', 'view'), getTodoTasks);
router.get('/tasks/:id', checkPermission('calendar', 'view'), getTodoTaskById);
router.post('/tasks', checkPermission('calendar', 'add'), createTodoTask);
router.put('/tasks/:id', checkPermission('calendar', 'edit'), updateTodoTask);
router.delete('/tasks/:id', checkPermission('calendar', 'delete'), deleteTodoTask);

export default router;

