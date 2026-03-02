import express from 'express';
import {
  getIncomeHeads,
  createIncomeHead,
  getIncome,
  createIncome,
  getRecentIncome,
} from '../controllers/income.controller';
import { authenticate, requireSchool } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use((req, res, next) => {
  if (req.path && req.path.startsWith('/public/')) return next();
  authenticate(req, res, (err?: any) => {
    if (err) return next(err);
    requireSchool(req, res, next);
  });
});

// Income Heads
router.get('/income-heads', checkPermission('income', 'view'), getIncomeHeads);
router.post('/income-heads', checkPermission('income', 'add'), createIncomeHead);

// Income Records
router.get('/income', checkPermission('income', 'view'), getIncome);
router.get('/income/recent', checkPermission('income', 'view'), getRecentIncome);
router.post('/income', checkPermission('income', 'add'), createIncome);

export default router;

