import express from 'express';
import { createContactMessage } from '../controllers/contactMessages.controller';

const router = express.Router();

// Public route for creating contact messages (no authentication required)
router.post('/', createContactMessage);

export default router;
