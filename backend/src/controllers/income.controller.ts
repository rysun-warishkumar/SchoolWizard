import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// ========== Income Heads ==========
export const getIncomeHeads = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [incomeHeads] = await db.execute(
      'SELECT * FROM income_heads ORDER BY name ASC'
    ) as any[];
    res.json({ success: true, data: incomeHeads });
  } catch (error) {
    next(error);
  }
};

export const createIncomeHead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim() === '') {
      throw createError('Income head name is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO income_heads (name, description) VALUES (?, ?)',
      [name.trim(), description || null]
    ) as any;

    const [newIncomeHead] = await db.execute(
      'SELECT * FROM income_heads WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Income head created successfully',
      data: newIncomeHead[0],
    });
  } catch (error) {
    next(error);
  }
};

// ========== Income Records ==========
export const getIncome = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date_from, date_to, search, page = 1, limit = 20 } = req.query;
    const db = getDatabase();

    let query = `
      SELECT i.*, ih.name as income_head_name
      FROM income i
      INNER JOIN income_heads ih ON i.income_head_id = ih.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date_from) {
      query += ' AND i.date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      query += ' AND i.date <= ?';
      params.push(date_to);
    }
    if (search) {
      query += ' AND (i.name LIKE ? OR i.invoice_number LIKE ? OR i.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY i.date DESC, i.created_at DESC';

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [income] = await db.execute(query, params) as any[];

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM income WHERE 1=1';
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
      data: income,
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

export const createIncome = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { income_head_id, name, invoice_number, date, amount, document_path, description } =
      req.body;

    if (!income_head_id || !name || !date || !amount) {
      throw createError('Income head, name, date, and amount are required', 400);
    }
    if (amount < 0) {
      throw createError('Amount must be positive', 400);
    }

    const db = getDatabase();
    const createdBy = req.user?.id || null;

    const [result] = await db.execute(
      `INSERT INTO income (income_head_id, name, invoice_number, date, amount, document_path, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        income_head_id,
        name.trim(),
        invoice_number || null,
        date,
        amount,
        document_path || null,
        description || null,
        createdBy,
      ]
    ) as any;

    const [newIncome] = await db.execute(
      `SELECT i.*, ih.name as income_head_name
       FROM income i
       INNER JOIN income_heads ih ON i.income_head_id = ih.id
       WHERE i.id = ?`,
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Income recorded successfully',
      data: newIncome[0],
    });
  } catch (error) {
    next(error);
  }
};

// Get recent income (for sidebar display)
export const getRecentIncome = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    const db = getDatabase();

    const [income] = await db.execute(
      `SELECT i.*, ih.name as income_head_name
       FROM income i
       INNER JOIN income_heads ih ON i.income_head_id = ih.id
       ORDER BY i.created_at DESC
       LIMIT ?`,
      [Number(limit)]
    ) as any[];

    res.json({ success: true, data: income });
  } catch (error) {
    next(error);
  }
};

