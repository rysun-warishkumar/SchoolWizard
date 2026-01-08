import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

router.get('/stats', checkPermission('dashboard', 'view'), getDashboardStats);

export default router;

