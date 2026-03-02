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

router.use((req, res, next) => {
  if (req.path && req.path.startsWith('/public/')) return next();
  authenticate(req, res, (err?: any) => {
    if (err) return next(err);
    requireSchool(req, res, next);
  });
});

// Expense Heads
router.get('/expense-heads', checkPermission('expenses', 'view'), getExpenseHeads);
router.post('/expense-heads', checkPermission('expenses', 'add'), createExpenseHead);

// Expense Records
router.get('/expenses', checkPermission('expenses', 'view'), getExpenses);
router.get('/expenses/recent', checkPermission('expenses', 'view'), getRecentExpenses);
router.post('/expenses', checkPermission('expenses', 'add'), createExpense);

export default router;

