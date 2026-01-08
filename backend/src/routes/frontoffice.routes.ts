import express from 'express';
import {
  // Setup
  getPurposes,
  createPurpose,
  getComplainTypes,
  createComplainType,
  getSources,
  createSource,
  getReferences,
  createReference,
  // Admission Enquiry
  getAdmissionEnquiries,
  createAdmissionEnquiry,
  updateAdmissionEnquiry,
  deleteAdmissionEnquiry,
  addEnquiryFollowUp,
  // Visitor Book
  getVisitors,
  createVisitor,
  updateVisitor,
  // Phone Call Log
  getPhoneCallLogs,
  createPhoneCallLog,
  // Postal Dispatch
  getPostalDispatch,
  createPostalDispatch,
  // Postal Receive
  getPostalReceive,
  createPostalReceive,
  // Complain
  getComplains,
  createComplain,
  updateComplain,
} from '../controllers/frontoffice.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Setup
router.get('/purposes', checkPermission('front-office', 'view'), getPurposes);
router.post('/purposes', checkPermission('front-office', 'add'), createPurpose);
router.get('/complain-types', checkPermission('front-office', 'view'), getComplainTypes);
router.post('/complain-types', checkPermission('front-office', 'add'), createComplainType);
router.get('/sources', checkPermission('front-office', 'view'), getSources);
router.post('/sources', checkPermission('front-office', 'add'), createSource);
router.get('/references', checkPermission('front-office', 'view'), getReferences);
router.post('/references', checkPermission('front-office', 'add'), createReference);

// Admission Enquiry
router.get('/admission-enquiries', checkPermission('front-office', 'view'), getAdmissionEnquiries);
router.post('/admission-enquiries', checkPermission('front-office', 'add'), createAdmissionEnquiry);
router.put('/admission-enquiries/:id', checkPermission('front-office', 'edit'), updateAdmissionEnquiry);
router.delete('/admission-enquiries/:id', checkPermission('front-office', 'delete'), deleteAdmissionEnquiry);
router.post('/admission-enquiries/:id/follow-up', checkPermission('front-office', 'edit'), addEnquiryFollowUp);

// Visitor Book
router.get('/visitors', checkPermission('front-office', 'view'), getVisitors);
router.post('/visitors', checkPermission('front-office', 'add'), createVisitor);
router.put('/visitors/:id', checkPermission('front-office', 'edit'), updateVisitor);

// Phone Call Log
router.get('/phone-call-logs', checkPermission('front-office', 'view'), getPhoneCallLogs);
router.post('/phone-call-logs', checkPermission('front-office', 'add'), createPhoneCallLog);

// Postal Dispatch
router.get('/postal-dispatch', checkPermission('front-office', 'view'), getPostalDispatch);
router.post('/postal-dispatch', checkPermission('front-office', 'add'), createPostalDispatch);

// Postal Receive
router.get('/postal-receive', checkPermission('front-office', 'view'), getPostalReceive);
router.post('/postal-receive', checkPermission('front-office', 'add'), createPostalReceive);

// Complain
router.get('/complains', checkPermission('front-office', 'view'), getComplains);
router.post('/complains', checkPermission('front-office', 'add'), createComplain);
router.put('/complains/:id', checkPermission('front-office', 'edit'), updateComplain);

export default router;

