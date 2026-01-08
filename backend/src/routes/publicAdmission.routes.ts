import express from 'express';
import {
  getImportantDates,
  getContactDetails,
} from '../controllers/admissionManagement.controller';

const router = express.Router();

// Public routes - no authentication required
router.get('/important-dates', getImportantDates);
router.get('/contact-details', getContactDetails);

export default router;

