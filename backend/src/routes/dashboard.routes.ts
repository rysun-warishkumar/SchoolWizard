import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticate, requireSchool } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate, requireSchool);

router.get('/stats', checkPermission('dashboard', 'view'), getDashboardStats);

export default router;

