import express from 'express';
import {
  getImportantDates,
  getContactDetails,
  createInquiry,
} from '../controllers/admissionManagement.controller';

const router = express.Router();

// Public routes - no authentication required
router.get('/important-dates', getImportantDates);
router.get('/contact-details', getContactDetails);
router.post('/inquiries', createInquiry); // Public route for submitting admission inquiries

export default router;

