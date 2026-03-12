import express from 'express';
import {
  getImportantDates,
  getContactDetails,
  createInquiry,
} from '../controllers/admissionManagement.controller';
import { resolvePublicSchoolContext } from '../middleware/publicSchoolContext';

const router = express.Router();

// Public routes - no authentication required
router.get('/important-dates', resolvePublicSchoolContext, getImportantDates);
router.get('/contact-details', resolvePublicSchoolContext, getContactDetails);
router.post('/inquiries', resolvePublicSchoolContext, createInquiry); // Public route for submitting admission inquiries

export default router;

