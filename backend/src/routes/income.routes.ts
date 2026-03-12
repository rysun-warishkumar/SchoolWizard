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
const requireTenantContext = [authenticate, requireSchool];

// Income Heads
router.get('/income-heads', requireTenantContext, checkPermission('income', 'view'), getIncomeHeads);
router.post('/income-heads', requireTenantContext, checkPermission('income', 'add'), createIncomeHead);

// Income Records
router.get('/income', requireTenantContext, checkPermission('income', 'view'), getIncome);
router.get('/income/recent', requireTenantContext, checkPermission('income', 'view'), getRecentIncome);
router.post('/income', requireTenantContext, checkPermission('income', 'add'), createIncome);

export default router;

