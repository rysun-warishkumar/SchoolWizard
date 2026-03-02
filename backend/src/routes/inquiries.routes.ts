import express from 'express';
import { createInquiry } from '../controllers/inquiries.controller';

const router = express.Router();

// Public route for marketing website Contact & Get Started forms
router.post('/inquiries', createInquiry);

export default router;
