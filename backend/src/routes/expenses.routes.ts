import express from 'express';
import {
  getExpenseHeads,
  createExpenseHead,
  getExpenses,
  createExpense,
  getRecentExpenses,
} from '../controllers/expenses.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Expense Heads
router.get('/expense-heads', checkPermission('expenses', 'view'), getExpenseHeads);
router.post('/expense-heads', checkPermission('expenses', 'add'), createExpenseHead);

// Expense Records
router.get('/expenses', checkPermission('expenses', 'view'), getExpenses);
router.get('/expenses/recent', checkPermission('expenses', 'view'), getRecentExpenses);
router.post('/expenses', checkPermission('expenses', 'add'), createExpense);

export default router;

