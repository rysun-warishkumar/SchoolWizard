import express from 'express';
import {
  getAlumni,
  getAlumniById,
  createAlumni,
  updateAlumni,
  deleteAlumni,
  getAlumniEvents,
  getAlumniEventById,
  createAlumniEvent,
  updateAlumniEvent,
  deleteAlumniEvent,
  getEventRegistrations,
  registerForEvent,
  updateRegistration,
  deleteRegistration,
  upload,
  uploadEventImage,
} from '../controllers/alumni.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Alumni Records
router.get('/alumni', checkPermission('alumni', 'view'), getAlumni);
router.get('/alumni/:id', checkPermission('alumni', 'view'), getAlumniById);
router.post('/alumni', checkPermission('alumni', 'add'), upload.single('photo'), createAlumni);
router.put('/alumni/:id', checkPermission('alumni', 'edit'), upload.single('photo'), updateAlumni);
router.delete('/alumni/:id', checkPermission('alumni', 'delete'), deleteAlumni);

// Alumni Events
router.get('/events', checkPermission('alumni', 'view'), getAlumniEvents);
router.get('/events/:id', checkPermission('alumni', 'view'), getAlumniEventById);
router.post('/events', checkPermission('alumni', 'add'), uploadEventImage.single('event_image'), createAlumniEvent);
router.put('/events/:id', checkPermission('alumni', 'edit'), uploadEventImage.single('event_image'), updateAlumniEvent);
router.delete('/events/:id', checkPermission('alumni', 'delete'), deleteAlumniEvent);

// Event Registrations
router.get('/registrations', checkPermission('alumni', 'view'), getEventRegistrations);
router.post('/registrations', checkPermission('alumni', 'add'), registerForEvent);
router.put('/registrations/:id', checkPermission('alumni', 'edit'), updateRegistration);
router.delete('/registrations/:id', checkPermission('alumni', 'delete'), deleteRegistration);

export default router;

