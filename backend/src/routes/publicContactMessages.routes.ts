import express from 'express';
import { createContactMessage } from '../controllers/contactMessages.controller';
import { resolvePublicSchoolContext } from '../middleware/publicSchoolContext';

const router = express.Router();

// Public route for creating contact messages (no authentication required)
router.post('/', resolvePublicSchoolContext, createContactMessage);

export default router;
