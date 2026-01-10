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

// Skip authentication for public routes - check path before applying auth
router.use((req, res, next) => {
  // If this is a public route, skip authentication middleware
  if (req.path && req.path.startsWith('/public/')) {
    return next(); // Continue without authentication
  }
  // Otherwise, apply authentication
  authenticate(req, res, next);
});

// Expense Heads
router.get('/expense-heads', checkPermission('expenses', 'view'), getExpenseHeads);
router.post('/expense-heads', checkPermission('expenses', 'add'), createExpenseHead);

// Expense Records
router.get('/expenses', checkPermission('expenses', 'view'), getExpenses);
router.get('/expenses/recent', checkPermission('expenses', 'view'), getRecentExpenses);
router.post('/expenses', checkPermission('expenses', 'add'), createExpense);

export default router;

