import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// ========== Expense Heads ==========
export const getExpenseHeads = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [expenseHeads] = await db.execute(
      'SELECT * FROM expense_heads ORDER BY name ASC'
    ) as any[];
    res.json({ success: true, data: expenseHeads });
  } catch (error) {
    next(error);
  }
};

export const createExpenseHead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim() === '') {
      throw createError('Expense head name is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO expense_heads (name, description) VALUES (?, ?)',
      [name.trim(), description || null]
    ) as any;

    const [newExpenseHead] = await db.execute(
      'SELECT * FROM expense_heads WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Expense head created successfully',
      data: newExpenseHead[0],
    });
  } catch (error) {
    next(error);
  }
};

// ========== Expense Records ==========
export const getExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date_from, date_to, search, page = 1, limit = 20 } = req.query;
    const db = getDatabase();

    let query = `
      SELECT e.*, eh.name as expense_head_name
      FROM expenses e
      INNER JOIN expense_heads eh ON e.expense_head_id = eh.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date_from) {
      query += ' AND e.date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      query += ' AND e.date <= ?';
      params.push(date_to);
    }
    if (search) {
      query += ' AND (e.name LIKE ? OR e.invoice_number LIKE ? OR e.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY e.date DESC, e.created_at DESC';

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [expenses] = await db.execute(query, params) as any[];

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM expenses WHERE 1=1';
    const countParams: any[] = [];

    if (date_from) {
      countQuery += ' AND date >= ?';
      countParams.push(date_from);
    }
    if (date_to) {
      countQuery += ' AND date <= ?';
      countParams.push(date_to);
    }
    if (search) {
      countQuery += ' AND (name LIKE ? OR invoice_number LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await db.execute(countQuery, countParams) as any[];

    res.json({
      success: true,
      data: expenses,
      pagination: {
        total: countResult[0].total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(countResult[0].total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { expense_head_id, name, invoice_number, date, amount, document_path, description } =
      req.body;

    if (!expense_head_id || !name || !date || !amount) {
      throw createError('Expense head, name, date, and amount are required', 400);
    }
    if (amount < 0) {
      throw createError('Amount must be positive', 400);
    }

    const db = getDatabase();
    const createdBy = req.user?.id || null;

    const [result] = await db.execute(
      `INSERT INTO expenses (expense_head_id, name, invoice_number, date, amount, document_path, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense_head_id,
        name.trim(),
        invoice_number || null,
        date,
        amount,
        document_path || null,
        description || null,
        createdBy,
      ]
    ) as any;

    const [newExpense] = await db.execute(
      `SELECT e.*, eh.name as expense_head_name
       FROM expenses e
       INNER JOIN expense_heads eh ON e.expense_head_id = eh.id
       WHERE e.id = ?`,
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: newExpense[0],
    });
  } catch (error) {
    next(error);
  }
};

// Get recent expenses (for sidebar display)
export const getRecentExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    const db = getDatabase();

    const [expenses] = await db.execute(
      `SELECT e.*, eh.name as expense_head_name
       FROM expenses e
       INNER JOIN expense_heads eh ON e.expense_head_id = eh.id
       ORDER BY e.created_at DESC
       LIMIT ?`,
      [Number(limit)]
    ) as any[];

    res.json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};

