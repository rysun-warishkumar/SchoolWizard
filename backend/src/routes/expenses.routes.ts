import express from 'express';
import {
  getExpenseHeads,
  createExpenseHead,
  getExpenses,
  createExpense,
  getRecentExpenses,
} from '../controllers/expenses.controller';
import { authenticate, requireSchool } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();
const requireTenantContext = [authenticate, requireSchool];

// Expense Heads
router.get('/expense-heads', requireTenantContext, checkPermission('expenses', 'view'), getExpenseHeads);
router.post('/expense-heads', requireTenantContext, checkPermission('expenses', 'add'), createExpenseHead);

// Expense Records
router.get('/expenses', requireTenantContext, checkPermission('expenses', 'view'), getExpenses);
router.get('/expenses/recent', requireTenantContext, checkPermission('expenses', 'view'), getRecentExpenses);
router.post('/expenses', requireTenantContext, checkPermission('expenses', 'add'), createExpense);

export default router;

