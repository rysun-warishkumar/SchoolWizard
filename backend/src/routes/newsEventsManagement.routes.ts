import express from 'express';
import {
  getNewsArticles,
  getNewsArticle,
  createNewsArticle,
  updateNewsArticle,
  deleteNewsArticle,
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  newsEventsUpload,
} from '../controllers/newsEventsManagement.controller';
import { authenticate, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// News routes
router.get('/news', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'view'), getNewsArticles);
router.get('/news/:id', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'view'), getNewsArticle);
router.post('/news', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'add'), newsEventsUpload.single('featured_image'), createNewsArticle);
router.put('/news/:id', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'edit'), newsEventsUpload.single('featured_image'), updateNewsArticle);
router.delete('/news/:id', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'delete'), deleteNewsArticle);

// Events routes
router.get('/events', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'view'), getEvents);
router.get('/events/:id', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'view'), getEvent);
router.post('/events', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'add'), newsEventsUpload.single('featured_image'), createEvent);
router.put('/events/:id', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'edit'), newsEventsUpload.single('featured_image'), updateEvent);
router.delete('/events/:id', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'delete'), deleteEvent);

export default router;

