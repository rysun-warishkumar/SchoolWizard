import express from 'express';
import {
  getIncomeHeads,
  createIncomeHead,
  getIncome,
  createIncome,
  getRecentIncome,
} from '../controllers/income.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// Skip authentication for public routes - check path before applying auth
router.use((req, res, next) => {
  // If this is a public route, skip authentication middleware
  if (req.path && req.path.startsWith('/public/')) {
    return next(); // Continue without authentication
  }
  // Otherwise, apply authentication
  authenticate(req, res, next);
});

// Income Heads
router.get('/income-heads', checkPermission('income', 'view'), getIncomeHeads);
router.post('/income-heads', checkPermission('income', 'add'), createIncomeHead);

// Income Records
router.get('/income', checkPermission('income', 'view'), getIncome);
router.get('/income/recent', checkPermission('income', 'view'), getRecentIncome);
router.post('/income', checkPermission('income', 'add'), createIncome);

export default router;

