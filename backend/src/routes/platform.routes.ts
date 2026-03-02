import express from 'express';
import { authenticate } from '../middleware/auth';
import { requirePlatformAdmin } from '../middleware/auth';
import { listSchools, getSchool, updateSchool } from '../controllers/platform.controller';

const router = express.Router();

router.use(authenticate, requirePlatformAdmin);

router.get('/schools', listSchools);
router.get('/schools/:id', getSchool);
router.patch('/schools/:id', updateSchool);

export default router;
