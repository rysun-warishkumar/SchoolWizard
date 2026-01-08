import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ========== Fees Types ==========
export const getFeesTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [feesTypes] = await db.execute('SELECT * FROM fees_types ORDER BY name ASC') as any[];
    res.json({ success: true, data: feesTypes });
  } catch (error) {
    next(error);
  }
};

export const createFeesType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, code, description } = req.body;
    if (!name || name.trim() === '') {
      throw createError('Fees type name is required', 400);
    }
    if (!code || code.trim() === '') {
      throw createError('Fees code is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO fees_types (name, code, description) VALUES (?, ?, ?)',
      [name.trim(), code.trim(), description || null]
    ) as any;

    const [newFeesType] = await db.execute(
      'SELECT * FROM fees_types WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Fees type created successfully',
      data: newFeesType[0],
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Fees type with this code already exists', 400);
    }
    next(error);
  }
};

// ========== Fees Groups ==========
export const getFeesGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [feesGroups] = await db.execute('SELECT * FROM fees_groups ORDER BY name ASC') as any[];
    res.json({ success: true, data: feesGroups });
  } catch (error) {
    next(error);
  }
};

export const getFeesGroupById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [feesGroups] = await db.execute(
      'SELECT * FROM fees_groups WHERE id = ?',
      [id]
    ) as any[];

    if (feesGroups.length === 0) {
      throw createError('Fees group not found', 404);
    }

    // Get fees types in this group
    const [feesTypes] = await db.execute(
      `SELECT ft.* FROM fees_types ft
       INNER JOIN fees_group_types fgt ON ft.id = fgt.fees_type_id
       WHERE fgt.fees_group_id = ?`,
      [id]
    ) as any[];

    res.json({
      success: true,
      data: {
        ...feesGroups[0],
        fees_types: feesTypes,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createFeesGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, fees_type_ids } = req.body;
    if (!name || name.trim() === '') {
      throw createError('Fees group name is required', 400);
    }

    const db = getDatabase();

    // Create fees group
    const [result] = await db.execute(
      'INSERT INTO fees_groups (name, description) VALUES (?, ?)',
      [name.trim(), description || null]
    ) as any;

    const feesGroupId = result.insertId;

    // Add fees types to group
    if (fees_type_ids && Array.isArray(fees_type_ids) && fees_type_ids.length > 0) {
      for (const feesTypeId of fees_type_ids) {
        await db.execute(
          'INSERT INTO fees_group_types (fees_group_id, fees_type_id) VALUES (?, ?)',
          [feesGroupId, feesTypeId]
        );
      }
    }

    const [newFeesGroup] = await db.execute(
      'SELECT * FROM fees_groups WHERE id = ?',
      [feesGroupId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Fees group created successfully',
      data: newFeesGroup[0],
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Fees group with this name already exists', 400);
    }
    next(error);
  }
};

export const updateFeesGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, fees_type_ids } = req.body;

    if (!name || name.trim() === '') {
      throw createError('Fees group name is required', 400);
    }

    const db = getDatabase();

    // Update fees group
    await db.execute(
      'UPDATE fees_groups SET name = ?, description = ?, updated_at = NOW() WHERE id = ?',
      [name.trim(), description || null, id]
    );

    // Update fees types if provided
    if (fees_type_ids && Array.isArray(fees_type_ids)) {
      // Delete existing fees types
      await db.execute('DELETE FROM fees_group_types WHERE fees_group_id = ?', [id]);

      // Add new fees types
      for (const feesTypeId of fees_type_ids) {
        await db.execute(
          'INSERT INTO fees_group_types (fees_group_id, fees_type_id) VALUES (?, ?)',
          [id, feesTypeId]
        );
      }
    }

    const [updatedFeesGroup] = await db.execute(
      'SELECT * FROM fees_groups WHERE id = ?',
      [id]
    ) as any[];

    res.json({
      success: true,
      message: 'Fees group updated successfully',
      data: updatedFeesGroup[0],
    });
  } catch (error) {
    next(error);
  }
};

// ========== Fees Master ==========
export const getFeesMaster = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { session_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        fm.*,
        fg.name as fees_group_name,
        ft.name as fees_type_name,
        ft.code as fees_type_code,
        s.name as session_name
      FROM fees_master fm
      INNER JOIN fees_groups fg ON fm.fees_group_id = fg.id
      INNER JOIN fees_types ft ON fm.fees_type_id = ft.id
      INNER JOIN sessions s ON fm.session_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (session_id) {
      query += ' AND fm.session_id = ?';
      params.push(session_id);
    }

    query += ' ORDER BY fm.due_date ASC, fg.name ASC';

    const [feesMaster] = await db.execute(query, params) as any[];

    res.json({ success: true, data: feesMaster });
  } catch (error) {
    next(error);
  }
};

export const createFeesMaster = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fees_group_id, fees_type_id, session_id, amount, due_date, fine_type, fine_amount } = req.body;

    if (!fees_group_id || !fees_type_id || !session_id) {
      throw createError('Fees group, fees type, and session are required', 400);
    }
    if (!amount || amount < 0) {
      throw createError('Amount is required and must be positive', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      `INSERT INTO fees_master (fees_group_id, fees_type_id, session_id, amount, due_date, fine_type, fine_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        fees_group_id,
        fees_type_id,
        session_id,
        amount,
        due_date || null,
        fine_type || 'percentage',
        fine_amount || 0,
      ]
    ) as any;

    const [newFeesMaster] = await db.execute(
      `SELECT 
        fm.*,
        fg.name as fees_group_name,
        ft.name as fees_type_name,
        ft.code as fees_type_code
      FROM fees_master fm
      INNER JOIN fees_groups fg ON fm.fees_group_id = fg.id
      INNER JOIN fees_types ft ON fm.fees_type_id = ft.id
      WHERE fm.id = ?`,
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Fees master created successfully',
      data: newFeesMaster[0],
    });
  } catch (error) {
    next(error);
  }
};

// ========== Fees Discounts ==========
export const getFeesDiscounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [discounts] = await db.execute('SELECT * FROM fees_discounts ORDER BY name ASC') as any[];
    res.json({ success: true, data: discounts });
  } catch (error) {
    next(error);
  }
};

export const createFeesDiscount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, code, amount, discount_type, description } = req.body;

    if (!name || name.trim() === '') {
      throw createError('Discount name is required', 400);
    }
    if (!code || code.trim() === '') {
      throw createError('Discount code is required', 400);
    }
    if (!amount || amount < 0) {
      throw createError('Discount amount is required and must be positive', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      `INSERT INTO fees_discounts (name, code, amount, discount_type, description)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), code.trim(), amount, discount_type || 'fixed', description || null]
    ) as any;

    const [newDiscount] = await db.execute(
      'SELECT * FROM fees_discounts WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Fees discount created successfully',
      data: newDiscount[0],
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Discount with this code already exists', 400);
    }
    next(error);
  }
};

// ========== Fees Invoices ==========
export const getStudentFeesInvoices = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { student_id, session_id, status } = req.query;
    const db = getDatabase();

    // If user is a student, ensure they can only access their own data
    let actualStudentId = student_id;
    if (req.user?.role === 'student') {
      // Get student ID from user_id
      const [students] = await db.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      ) as any[];
      if (students.length === 0) {
        throw createError('Student profile not found', 404);
      }
      actualStudentId = students[0].id;
      // Override any student_id in query to prevent unauthorized access
    }

    let query = `
      SELECT 
        fi.*,
        fm.amount as fees_amount,
        fm.due_date as fees_due_date,
        fg.name as fees_group_name,
        ft.name as fees_type_name,
        ft.code as fees_type_code
      FROM fees_invoices fi
      INNER JOIN fees_master fm ON fi.fees_master_id = fm.id
      INNER JOIN fees_groups fg ON fm.fees_group_id = fg.id
      INNER JOIN fees_types ft ON fm.fees_type_id = ft.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (actualStudentId) {
      query += ' AND fi.student_id = ?';
      params.push(actualStudentId);
    }
    if (session_id) {
      query += ' AND fi.session_id = ?';
      params.push(session_id);
    }
    if (status) {
      query += ' AND fi.status = ?';
      params.push(status);
    }

    query += ' ORDER BY fi.due_date ASC, fi.created_at DESC';

    const [invoices] = await db.execute(query, params) as any[];

    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

// ========== Fees Payments ==========
export const getFeesPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { payment_id, student_id, date_from, date_to } = req.query;
    const db = getDatabase();

    // If user is a student, ensure they can only access their own data
    let actualStudentId = student_id;
    if (req.user?.role === 'student') {
      // Get student ID from user_id
      const [students] = await db.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      ) as any[];
      if (students.length === 0) {
        throw createError('Student profile not found', 404);
      }
      actualStudentId = students[0].id;
      // Override any student_id in query to prevent unauthorized access
    }

    let query = `
      SELECT 
        fp.*,
        s.first_name, s.last_name, s.admission_no,
        fi.invoice_no,
        fg.name as fees_group_name,
        ft.name as fees_type_name
      FROM fees_payments fp
      INNER JOIN students s ON fp.student_id = s.id
      INNER JOIN fees_invoices fi ON fp.fees_invoice_id = fi.id
      INNER JOIN fees_master fm ON fi.fees_master_id = fm.id
      INNER JOIN fees_groups fg ON fm.fees_group_id = fg.id
      INNER JOIN fees_types ft ON fm.fees_type_id = ft.id
      WHERE fp.is_reverted = 0
    `;
    const params: any[] = [];

    if (payment_id) {
      query += ' AND fp.payment_id = ?';
      params.push(payment_id);
    }
    if (actualStudentId) {
      query += ' AND fp.student_id = ?';
      params.push(actualStudentId);
    }
    if (date_from) {
      query += ' AND fp.payment_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      query += ' AND fp.payment_date <= ?';
      params.push(date_to);
    }

    query += ' ORDER BY fp.payment_date DESC, fp.created_at DESC';

    const [payments] = await db.execute(query, params) as any[];

    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

export const createFeesPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      fees_invoice_id,
      student_id,
      payment_date,
      amount,
      discount_amount,
      fine_amount,
      payment_mode,
      note,
    } = req.body;

    if (!fees_invoice_id || !student_id || !payment_date || !amount) {
      throw createError('Invoice ID, student ID, payment date, and amount are required', 400);
    }

    const db = getDatabase();
    const connection = await db.getConnection();

    try {
      // Generate payment ID
      const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Get current user (collector)
      const collectedBy = (req as any).user?.id || null;

      // Start transaction
      await connection.beginTransaction();

      // Create payment
      const [paymentResult] = await connection.execute(
        `INSERT INTO fees_payments 
         (payment_id, fees_invoice_id, student_id, payment_date, amount, discount_amount, fine_amount, payment_mode, note, collected_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentId,
          fees_invoice_id,
          student_id,
          payment_date,
          amount,
          discount_amount || 0,
          fine_amount || 0,
          payment_mode || 'cash',
          note || null,
          collectedBy,
        ]
      ) as any;

      // Update invoice
      const [invoice] = await connection.execute(
        'SELECT * FROM fees_invoices WHERE id = ?',
        [fees_invoice_id]
      ) as any[];

      if (invoice.length === 0) {
        throw createError('Invoice not found', 404);
      }

      const currentInvoice = invoice[0];
      const newPaidAmount = (currentInvoice.paid_amount || 0) + Number(amount);
      const newBalanceAmount = currentInvoice.balance_amount - Number(amount);
      const newStatus =
        newBalanceAmount <= 0
          ? 'paid'
          : newPaidAmount > 0
          ? 'partial'
          : currentInvoice.status;

      await connection.execute(
        `UPDATE fees_invoices 
         SET paid_amount = ?, balance_amount = ?, status = ?, updated_at = NOW()
         WHERE id = ?`,
        [newPaidAmount, Math.max(0, newBalanceAmount), newStatus, fees_invoice_id]
      );

      await connection.commit();

      const [newPayment] = await connection.execute(
        `SELECT fp.*, s.first_name, s.last_name, s.admission_no, fi.invoice_no
         FROM fees_payments fp
         INNER JOIN students s ON fp.student_id = s.id
         INNER JOIN fees_invoices fi ON fp.fees_invoice_id = fi.id
         WHERE fp.id = ?`,
        [paymentResult.insertId]
      ) as any[];

      res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: newPayment[0],
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    next(error);
  }
};

// ========== Fees Carry Forward ==========
export const getCarryForward = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { class_id, section_id, from_session_id, to_session_id } = req.query;
    const db = getDatabase();

    if (!from_session_id || !to_session_id) {
      throw createError('From session and To session are required', 400);
    }

    let query = `
      SELECT 
        fcf.*,
        s.id as student_id,
        s.admission_no,
        s.first_name,
        s.last_name,
        s.class_id,
        s.section_id,
        c.name as class_name,
        sec.name as section_name,
        fs_from.name as from_session_name,
        fs_to.name as to_session_name
      FROM fees_carry_forward fcf
      INNER JOIN students s ON fcf.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN sessions fs_from ON fcf.from_session_id = fs_from.id
      LEFT JOIN sessions fs_to ON fcf.to_session_id = fs_to.id
      WHERE fcf.from_session_id = ? AND fcf.to_session_id = ?
    `;
    const params: any[] = [from_session_id, to_session_id];

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(class_id);
    }
    if (section_id) {
      query += ' AND s.section_id = ?';
      params.push(section_id);
    }

    query += ' ORDER BY s.admission_no ASC';

    const [carryForward] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: carryForward,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentBalanceForCarryForward = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { class_id, section_id, from_session_id, to_session_id } = req.query;
    const db = getDatabase();

    if (!from_session_id || !to_session_id) {
      throw createError('From session and To session are required', 400);
    }

    // Get students with balance fees from previous session
    let query = `
      SELECT 
        s.id as student_id,
        s.admission_no,
        s.first_name,
        s.last_name,
        s.class_id,
        s.section_id,
        c.name as class_name,
        sec.name as section_name,
        COALESCE(SUM(fi.total_amount), 0) - COALESCE(SUM(fp.amount), 0) as balance_amount
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN fees_invoices fi ON fi.student_id = s.id AND fi.session_id = ?
      LEFT JOIN fees_payments fp ON fp.fees_invoice_id = fi.id
      WHERE s.is_active = 1 AND s.session_id = ?
    `;
    const params: any[] = [from_session_id, from_session_id];

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(class_id);
    }
    if (section_id) {
      query += ' AND s.section_id = ?';
      params.push(section_id);
    }

    query += `
      GROUP BY s.id, s.admission_no, s.first_name, s.last_name, s.class_id, s.section_id, c.name, sec.name
      HAVING balance_amount > 0
      ORDER BY s.admission_no ASC
    `;

    const [students] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

export const createCarryForward = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { student_id, from_session_id, to_session_id, amount, due_date } = req.body;

    if (!student_id || !from_session_id || !to_session_id || !amount) {
      throw createError('Student, sessions, and amount are required', 400);
    }

    const db = getDatabase();

    // Check if already exists
    const [existing] = await db.execute(
      'SELECT id FROM fees_carry_forward WHERE student_id = ? AND from_session_id = ? AND to_session_id = ?',
      [student_id, from_session_id, to_session_id]
    ) as any[];

    if (existing.length > 0) {
      throw createError('Carry forward already exists for this student and sessions', 400);
    }

    const [result] = await db.execute(
      'INSERT INTO fees_carry_forward (student_id, from_session_id, to_session_id, amount, due_date) VALUES (?, ?, ?, ?, ?)',
      [student_id, from_session_id, to_session_id, amount, due_date || null]
    ) as any;

    const [newCarryForward] = await db.execute(
      'SELECT * FROM fees_carry_forward WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Fees carry forward created successfully',
      data: newCarryForward[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateCarryForward = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, due_date } = req.body;
    const db = getDatabase();

    const updates: string[] = [];
    const params: any[] = [];

    if (amount !== undefined) {
      updates.push('amount = ?');
      params.push(amount);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      params.push(due_date);
    }

    if (updates.length === 0) {
      throw createError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.execute(
      `UPDATE fees_carry_forward SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const [updated] = await db.execute(
      'SELECT * FROM fees_carry_forward WHERE id = ?',
      [id]
    ) as any[];

    res.json({
      success: true,
      message: 'Carry forward updated successfully',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

// ========== Fees Reminder ==========
export const getFeesReminderSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [settings] = await db.execute(
      'SELECT * FROM fees_reminder_settings ORDER BY reminder_type ASC'
    ) as any[];

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFeesReminderSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reminder_type, is_active, days } = req.body;

    if (!reminder_type) {
      throw createError('Reminder type is required', 400);
    }

    const db = getDatabase();

    // Check if exists
    const [existing] = await db.execute(
      'SELECT id FROM fees_reminder_settings WHERE reminder_type = ?',
      [reminder_type]
    ) as any[];

    if (existing.length > 0) {
      // Update
      await db.execute(
        'UPDATE fees_reminder_settings SET is_active = ?, days = ?, updated_at = NOW() WHERE reminder_type = ?',
        [is_active ? 1 : 0, days || 0, reminder_type]
      );
    } else {
      // Create
      await db.execute(
        'INSERT INTO fees_reminder_settings (reminder_type, is_active, days) VALUES (?, ?, ?)',
        [reminder_type, is_active ? 1 : 0, days || 0]
      );
    }

    const [updated] = await db.execute(
      'SELECT * FROM fees_reminder_settings WHERE reminder_type = ?',
      [reminder_type]
    ) as any[];

    res.json({
      success: true,
      message: 'Reminder settings updated successfully',
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
};

export const getFeesReminderLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fees_invoice_id, reminder_type, start_date, end_date } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        frl.*,
        fi.invoice_no,
        fi.student_id,
        s.admission_no,
        s.first_name,
        s.last_name
      FROM fees_reminder_logs frl
      LEFT JOIN fees_invoices fi ON frl.fees_invoice_id = fi.id
      LEFT JOIN students s ON fi.student_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (fees_invoice_id) {
      query += ' AND frl.fees_invoice_id = ?';
      params.push(fees_invoice_id);
    }
    if (reminder_type) {
      query += ' AND frl.reminder_type = ?';
      params.push(reminder_type);
    }
    if (start_date) {
      query += ' AND DATE(frl.sent_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND DATE(frl.sent_at) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY frl.sent_at DESC LIMIT 100';

    const [logs] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// ========== Fees Group Assignments ==========
export const getFeesGroupAssignments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fees_group_id, session_id, class_id, section_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        fga.*,
        fg.name as fees_group_name,
        s.name as session_name,
        c.name as class_name,
        sec.name as section_name,
        st.admission_no,
        st.first_name as student_first_name,
        st.last_name as student_last_name
      FROM fees_group_assignments fga
      INNER JOIN fees_groups fg ON fga.fees_group_id = fg.id
      INNER JOIN sessions s ON fga.session_id = s.id
      LEFT JOIN classes c ON fga.class_id = c.id
      LEFT JOIN sections sec ON fga.section_id = sec.id
      LEFT JOIN students st ON fga.student_id = st.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (fees_group_id) {
      query += ' AND fga.fees_group_id = ?';
      params.push(Number(fees_group_id));
    }
    if (session_id) {
      query += ' AND fga.session_id = ?';
      params.push(Number(session_id));
    }
    if (class_id) {
      query += ' AND fga.class_id = ?';
      params.push(Number(class_id));
    }
    if (section_id) {
      query += ' AND fga.section_id = ?';
      params.push(Number(section_id));
    }

    query += ' ORDER BY fga.assigned_at DESC';

    const [assignments] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error: any) {
    console.error('Error in getFeesGroupAssignments:', error);
    next(error);
  }
};

export const assignFeesGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fees_group_id, session_id, class_id, section_id, student_ids } = req.body;

    if (!fees_group_id || !session_id) {
      throw createError('Fees group and session are required', 400);
    }

    // Either class-section OR student_ids should be provided
    if ((!class_id || !section_id) && (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0)) {
      throw createError('Either class-section or student IDs are required', 400);
    }

    if ((class_id && section_id) && student_ids && student_ids.length > 0) {
      throw createError('Cannot assign to both class-section and individual students at the same time', 400);
    }

    const db = getDatabase();
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      let studentsToAssign: any[] = [];

      if (class_id && section_id) {
        // Get all students in the class-section
        const [students] = await connection.execute(
          'SELECT id FROM students WHERE class_id = ? AND section_id = ? AND session_id = ? AND is_active = 1',
          [class_id, section_id, session_id]
        ) as any[];
        studentsToAssign = students;

        // Check if assignment already exists for this class-section
        const [existing] = await connection.execute(
          'SELECT id FROM fees_group_assignments WHERE fees_group_id = ? AND session_id = ? AND class_id = ? AND section_id = ?',
          [fees_group_id, session_id, class_id, section_id]
        ) as any[];

        if (existing.length > 0) {
          throw createError('Fees group already assigned to this class-section', 400);
        }

        // Create assignment for class-section
        await connection.execute(
          'INSERT INTO fees_group_assignments (fees_group_id, session_id, class_id, section_id) VALUES (?, ?, ?, ?)',
          [fees_group_id, session_id, class_id, section_id]
        );
      } else if (student_ids && student_ids.length > 0) {
        // Get students data
        const placeholders = student_ids.map(() => '?').join(',');
        const [students] = await connection.execute(
          `SELECT id FROM students WHERE id IN (${placeholders}) AND session_id = ? AND is_active = 1`,
          [...student_ids, session_id]
        ) as any[];
        studentsToAssign = students;

        // Create assignments for individual students
        for (const studentId of student_ids) {
          // Check if already assigned
          const [existing] = await connection.execute(
            'SELECT id FROM fees_group_assignments WHERE fees_group_id = ? AND session_id = ? AND student_id = ?',
            [fees_group_id, session_id, studentId]
          ) as any[];

          if (existing.length === 0) {
            await connection.execute(
              'INSERT INTO fees_group_assignments (fees_group_id, session_id, student_id) VALUES (?, ?, ?)',
              [fees_group_id, session_id, studentId]
            );
          }
        }
      }

      // Get all fees master entries for this fees group and session
      const [feesMasters] = await connection.execute(
        'SELECT * FROM fees_master WHERE fees_group_id = ? AND session_id = ?',
        [fees_group_id, session_id]
      ) as any[];

      if (feesMasters.length === 0) {
        throw createError('No fees master entries found for this fees group and session', 400);
      }

      // Generate invoices for each student and each fees master entry
      let invoicesCreated = 0;
      for (const student of studentsToAssign) {
        for (const feesMaster of feesMasters) {
          // Check if invoice already exists
          const [existingInvoice] = await connection.execute(
            'SELECT id FROM fees_invoices WHERE student_id = ? AND fees_master_id = ? AND session_id = ?',
            [student.id, feesMaster.id, session_id]
          ) as any[];

          if (existingInvoice.length === 0) {
            // Generate unique invoice number
            const invoiceNo = `INV-${session_id}-${feesMaster.id}-${student.id}-${Date.now()}`;

            // Get discount amount if student has discount assigned
            let discountAmount = 0;
            const [discountAssignments] = await connection.execute(
              `SELECT fd.amount, fd.discount_type 
               FROM fees_discount_assignments fda
               INNER JOIN fees_discounts fd ON fda.fees_discount_id = fd.id
               WHERE fda.student_id = ?`,
              [student.id]
            ) as any[];

            if (discountAssignments.length > 0) {
              const discount = discountAssignments[0];
              if (discount.discount_type === 'percentage') {
                discountAmount = (feesMaster.amount * discount.amount) / 100;
              } else {
                discountAmount = discount.amount;
              }
            }

            const amount = feesMaster.amount;
            const balanceAmount = amount - discountAmount;

            // Create invoice
            await connection.execute(
              `INSERT INTO fees_invoices 
               (invoice_no, student_id, fees_master_id, session_id, amount, discount_amount, balance_amount, due_date, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
              [
                invoiceNo,
                student.id,
                feesMaster.id,
                session_id,
                amount,
                discountAmount,
                balanceAmount,
                feesMaster.due_date || null,
              ]
            );
            invoicesCreated++;
          }
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: `Fees group assigned successfully. ${invoicesCreated} invoice(s) generated.`,
        data: {
          students_assigned: studentsToAssign.length,
          invoices_created: invoicesCreated,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error in assignFeesGroup:', error);
    next(error);
  }
};

export const removeFeesGroupAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Get assignment details
    const [assignments] = await db.execute(
      'SELECT * FROM fees_group_assignments WHERE id = ?',
      [id]
    ) as any[];

    if (assignments.length === 0) {
      throw createError('Assignment not found', 404);
    }

    const assignment = assignments[0];

    // Delete assignment
    await db.execute('DELETE FROM fees_group_assignments WHERE id = ?', [id]);

    // Note: Invoices are not deleted automatically (they remain for audit purposes)
    // If you want to delete invoices, uncomment the following:
    // if (assignment.student_id) {
    //   // Delete invoices for this student and fees group
    //   await db.execute(
    //     `DELETE fi FROM fees_invoices fi
    //      INNER JOIN fees_master fm ON fi.fees_master_id = fm.id
    //      WHERE fi.student_id = ? AND fm.fees_group_id = ? AND fi.session_id = ?`,
    //     [assignment.student_id, assignment.fees_group_id, assignment.session_id]
    //   );
    // } else if (assignment.class_id && assignment.section_id) {
    //   // Delete invoices for all students in this class-section
    //   await db.execute(
    //     `DELETE fi FROM fees_invoices fi
    //      INNER JOIN fees_master fm ON fi.fees_master_id = fm.id
    //      INNER JOIN students s ON fi.student_id = s.id
    //      WHERE s.class_id = ? AND s.section_id = ? AND fm.fees_group_id = ? AND fi.session_id = ?`,
    //     [assignment.class_id, assignment.section_id, assignment.fees_group_id, assignment.session_id]
    //   );
    // }

    res.json({
      success: true,
      message: 'Fees group assignment removed successfully',
    });
  } catch (error: any) {
    console.error('Error in removeFeesGroupAssignment:', error);
    next(error);
  }
};

// ========== Download Invoice PDF ==========
export const downloadInvoicePDF = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { invoice_id } = req.params;
    if (!invoice_id) {
      throw createError('Invoice ID is required', 400);
    }
    const invoiceId = Number(invoice_id);
    if (isNaN(invoiceId)) {
      throw createError('Invalid invoice ID', 400);
    }
    const db = getDatabase();

    // If user is a student, ensure they can only access their own invoices
    let actualStudentId: number | null = null;
    if (req.user?.role === 'student') {
      const [students] = await db.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      ) as any[];
      if (students.length === 0) {
        throw createError('Student profile not found', 404);
      }
      actualStudentId = students[0].id;
    }

    // Fetch invoice with related data
    let invoiceQuery = `
      SELECT 
        fi.*,
        fm.amount as fees_amount,
        fm.due_date as fees_due_date,
        fg.name as fees_group_name,
        ft.name as fees_type_name,
        ft.code as fees_type_code,
        s.first_name,
        s.last_name,
        s.admission_no,
        s.father_name,
        s.mother_name,
        s.student_mobile,
        s.date_of_birth,
        c.name as class_name,
        sec.name as section_name,
        sess.name as session_name
      FROM fees_invoices fi
      INNER JOIN fees_master fm ON fi.fees_master_id = fm.id
      INNER JOIN fees_groups fg ON fm.fees_group_id = fg.id
      INNER JOIN fees_types ft ON fm.fees_type_id = ft.id
      INNER JOIN students s ON fi.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN sessions sess ON fi.session_id = sess.id
      WHERE fi.id = ?
    `;
    const invoiceParams: any[] = [invoiceId];

    if (actualStudentId) {
      invoiceQuery += ' AND fi.student_id = ?';
      invoiceParams.push(actualStudentId);
    }

    const [invoices] = await db.execute(invoiceQuery, invoiceParams) as any[];

    if (invoices.length === 0) {
      throw createError('Invoice not found', 404);
    }

    const invoice = invoices[0];

    // Fetch school settings
    const [settings] = await db.execute(
      'SELECT setting_key, setting_value, setting_type FROM general_settings'
    ) as any[];

    const settingsObj: any = {};
    settings.forEach((setting: any) => {
      if (setting.setting_type === 'boolean') {
        settingsObj[setting.setting_key] = setting.setting_value === '1' || setting.setting_value === 'true';
      } else if (setting.setting_type === 'number') {
        settingsObj[setting.setting_key] = Number(setting.setting_value);
      } else {
        settingsObj[setting.setting_key] = setting.setting_value;
      }
    });

    const schoolName = settingsObj.school_name || 'SchoolWizard';
    const schoolAddress = settingsObj.address || '';
    const schoolPhone = settingsObj.phone || '';
    const schoolEmail = settingsObj.email || '';
    const currencySymbol = settingsObj.currency_symbol || '₹';
    const printLogo = settingsObj.print_logo || settingsObj.admin_logo || '';
    
    // Get logo path
    let logoPath: string | null = null;
    if (printLogo) {
      // Remove leading slash if present and construct full path
      const logoRelativePath = printLogo.startsWith('/') ? printLogo.slice(1) : printLogo;
      const fullLogoPath = path.join(__dirname, '../../', logoRelativePath);
      if (fs.existsSync(fullLogoPath)) {
        logoPath = fullLogoPath;
        
      } else {
        console.log('Logo not found at:', fullLogoPath, 'Original path:', printLogo);
      }
    } else {
      console.log('No logo configured in settings');
    }

    // Generate filename: MonthName_Year_FeeType
    const dueDate = invoice.due_date ? new Date(invoice.due_date) : new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[dueDate.getMonth()];
    const year = dueDate.getFullYear();
    const feeType = (invoice.fees_type_name || 'Fee').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${monthName}_${year}_${feeType}.pdf`;

    // Dynamically import PDFDocument for ES module compatibility
    const PDFDocument = (await import('pdfkit')).default;
    
    // Create PDF with minimal margins for maximum space
    // A4 size: 595.28 x 841.89 points (width x height)
    const doc = new PDFDocument({ 
      margin: 30, 
      size: 'A4',
      autoFirstPage: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // ========== PROFESSIONAL INVOICE TEMPLATE ==========
    let yPos = 30;
    const leftMargin = 30;
    const rightMargin = 565;
    const pageWidth = 535;
    
    // ========== HEADER SECTION ==========
    // Left side - School Information
    let headerLeftY = yPos;
    
    // Logo (if available)
    if (logoPath) {
      try {
        doc.image(logoPath, leftMargin, headerLeftY, { width: 50, height: 50 });
        headerLeftY += 55;
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    }
    
    // School Name
    doc.fontSize(18).font('Helvetica-Bold');
    doc.fillColor('black');
    doc.text(schoolName, leftMargin, headerLeftY);
    headerLeftY += 15;
    
    // School Address
    if (schoolAddress) {
      doc.fontSize(9).font('Helvetica');
      doc.text(schoolAddress, leftMargin, headerLeftY);
      headerLeftY += 10;
    }
    
    // Phone and Email
    if (schoolPhone || schoolEmail) {
      const contactInfo = [schoolPhone, schoolEmail].filter(Boolean).join(' | ');
      doc.fontSize(8).font('Helvetica');
      doc.text(contactInfo, leftMargin, headerLeftY);
    }
    
    // Right side - Invoice Title and Details
    doc.fontSize(24).font('Helvetica-Bold');
    doc.text('INVOICE', rightMargin - 150, yPos, { width: 150, align: 'right' });
    yPos += 20;
    
    doc.fontSize(9).font('Helvetica');
    doc.text(`INVOICE #${invoice.invoice_no}`, rightMargin - 150, yPos, { width: 150, align: 'right' });
    yPos += 12;
    
    // Format date more compactly
    const invoiceDate = new Date(invoice.created_at);
    const monthAbbr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const formattedDate = `${monthAbbr[invoiceDate.getMonth()]} ${invoiceDate.getDate()}, ${invoiceDate.getFullYear()}`;
    doc.text(`DATE: ${formattedDate}`, rightMargin - 150, yPos, { width: 150, align: 'right' });
    
    yPos = Math.max(headerLeftY, yPos + 10) + 15;
    
    // ========== TO: AND SHIP TO: SECTIONS ==========
    const toSectionY = yPos;
    
    // TO: Section (Student Details) - Left
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('TO:', leftMargin, toSectionY);
    let toY = toSectionY + 12;
    doc.fontSize(9).font('Helvetica');
    doc.text(`${invoice.first_name} ${invoice.last_name || ''}`.trim(), leftMargin, toY);
    toY += 10;
    doc.text(`Admission No: ${invoice.admission_no || '-'}`, leftMargin, toY);
    toY += 10;
    doc.text(`Class: ${invoice.class_name || '-'}${invoice.section_name ? ` - ${invoice.section_name}` : ''}`, leftMargin, toY);
    toY += 10;
    doc.text(`Session: ${invoice.session_name || '-'}`, leftMargin, toY);
    toY += 10;
    if (invoice.father_name) {
      doc.text(`Father: ${invoice.father_name}`, leftMargin, toY);
      toY += 10;
    }
    if (invoice.mother_name) {
      doc.text(`Mother: ${invoice.mother_name}`, leftMargin, toY);
      toY += 10;
    }
    
    // SHIP TO: Section (Parent/Guardian Details) - Right
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('SHIP TO:', rightMargin - 200, toSectionY, { width: 200, align: 'right' });
    let shipToY = toSectionY + 12;
    doc.fontSize(9).font('Helvetica');
    if (invoice.father_name) {
      doc.text(invoice.father_name, rightMargin - 200, shipToY, { width: 200, align: 'right' });
      shipToY += 10;
    }
    if (invoice.mother_name) {
      doc.text(invoice.mother_name, rightMargin - 200, shipToY, { width: 200, align: 'right' });
      shipToY += 10;
    }
    if (invoice.student_mobile) {
      doc.text(`Phone: ${invoice.student_mobile}`, rightMargin - 200, shipToY, { width: 200, align: 'right' });
    }
    
    yPos = Math.max(toY, shipToY) + 15;
    
    // ========== COMMENTS SECTION ==========
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('COMMENTS OR SPECIAL INSTRUCTIONS:', leftMargin, yPos);
    yPos += 12;
    doc.fontSize(8).font('Helvetica');
    doc.text(`Fee Type: ${invoice.fees_type_name || '-'} | Fee Group: ${invoice.fees_group_name || '-'}`, leftMargin, yPos);
    yPos += 15;
    
    // ========== DETAIL TABLE ==========
    const detailTableY = yPos;
    const detailTableHeight = 25;
    // Adjusted column widths for better spacing
    const col1Width = 100; // FEE GROUP
    const col2Width = 90;  // FEE TYPE
    const col3Width = 80;  // SESSION
    const col4Width = 90;  // DUE DATE
    const col5Width = 80;  // STATUS
    const col6Width = 95;  // PAYMENT MODE
    
    // Draw detail table border
    doc.rect(leftMargin, detailTableY, pageWidth, detailTableHeight).stroke();
    
    // Vertical separators
    let currentX = leftMargin;
    doc.moveTo(currentX += col1Width, detailTableY).lineTo(currentX, detailTableY + detailTableHeight).lineWidth(0.5).stroke();
    doc.moveTo(currentX += col2Width, detailTableY).lineTo(currentX, detailTableY + detailTableHeight).lineWidth(0.5).stroke();
    doc.moveTo(currentX += col3Width, detailTableY).lineTo(currentX, detailTableY + detailTableHeight).lineWidth(0.5).stroke();
    doc.moveTo(currentX += col4Width, detailTableY).lineTo(currentX, detailTableY + detailTableHeight).lineWidth(0.5).stroke();
    doc.moveTo(currentX += col5Width, detailTableY).lineTo(currentX, detailTableY + detailTableHeight).lineWidth(0.5).stroke();
    
    // Detail table headers
    doc.rect(leftMargin, detailTableY, pageWidth, detailTableHeight / 2).fill('#f0f0f0');
    doc.fontSize(8).font('Helvetica-Bold');
    doc.fillColor('black');
    currentX = leftMargin + 5;
    doc.text('FEE GROUP', currentX, detailTableY + 8, { width: col1Width - 10 });
    currentX += col1Width;
    doc.text('FEE TYPE', currentX, detailTableY + 8, { width: col2Width - 10 });
    currentX += col2Width;
    doc.text('SESSION', currentX, detailTableY + 8, { width: col3Width - 10 });
    currentX += col3Width;
    doc.text('DUE DATE', currentX, detailTableY + 8, { width: col4Width - 10 });
    currentX += col4Width;
    doc.text('STATUS', currentX, detailTableY + 8, { width: col5Width - 10 });
    currentX += col5Width;
    doc.text('PAYMENT MODE', currentX, detailTableY + 8, { width: col6Width - 10 });
    
    // Detail table separator
    doc.moveTo(leftMargin, detailTableY + detailTableHeight / 2).lineTo(leftMargin + pageWidth, detailTableY + detailTableHeight / 2).lineWidth(1).stroke();
    
    // Detail table data
    doc.fontSize(8).font('Helvetica');
    doc.fillColor('black');
    currentX = leftMargin + 5;
    doc.text(invoice.fees_group_name || '-', currentX, detailTableY + 18, { width: col1Width - 10 });
    currentX += col1Width;
    doc.text(invoice.fees_type_name || '-', currentX, detailTableY + 18, { width: col2Width - 10 });
    currentX += col2Width;
    doc.text(invoice.session_name || '-', currentX, detailTableY + 18, { width: col3Width - 10 });
    currentX += col3Width;
    doc.text(invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-', currentX, detailTableY + 18, { width: col4Width - 10 });
    currentX += col4Width;
    doc.text((invoice.status || 'PENDING').toUpperCase(), currentX, detailTableY + 18, { width: col5Width - 10 });
    currentX += col5Width;
    doc.text('-', currentX, detailTableY + 18, { width: col6Width - 10 });
    
    yPos = detailTableY + detailTableHeight + 15;
    
    // ========== MAIN LINE ITEM TABLE ==========
    const tableY = yPos;
    const tableRowHeight = 20;
    const qtyWidth = 60;
    const descWidth = 280;
    const unitPriceWidth = 95;
    const totalWidth = 100;
    
    // Build line items
    const lineItems: Array<{ qty: string; desc: string; unitPrice: string; total: string }> = [];
    
    // Main fee item
    lineItems.push({
      qty: '1',
      desc: invoice.fees_type_name || 'School Fee',
      unitPrice: `${currencySymbol}${parseFloat(invoice.amount || 0).toFixed(2)}`,
      total: `${currencySymbol}${parseFloat(invoice.amount || 0).toFixed(2)}`
    });
    
    const tableHeight = 25 + (lineItems.length * tableRowHeight); // Header + rows
    
    // Draw table border
    doc.rect(leftMargin, tableY, pageWidth, tableHeight).stroke();
    
    // Table header
    doc.rect(leftMargin, tableY, pageWidth, 25).fill('#f0f0f0');
    doc.fontSize(9).font('Helvetica-Bold');
    doc.fillColor('black');
    doc.text('QUANTITY', leftMargin + 5, tableY + 8);
    doc.text('DESCRIPTION', leftMargin + 5 + qtyWidth, tableY + 8);
    doc.text('UNIT PRICE', leftMargin + 5 + qtyWidth + descWidth, tableY + 8);
    doc.text('TOTAL', leftMargin + 5 + qtyWidth + descWidth + unitPriceWidth, tableY + 8);
    
    // Header separator
    doc.moveTo(leftMargin, tableY + 25).lineTo(leftMargin + pageWidth, tableY + 25).lineWidth(1).stroke();
    
    // Table rows
    let rowY = tableY + 25;
    doc.fontSize(9).font('Helvetica');
    
    for (const item of lineItems) {
      // Vertical separators
      doc.moveTo(leftMargin + qtyWidth, rowY).lineTo(leftMargin + qtyWidth, rowY + tableRowHeight).lineWidth(0.5).stroke();
      doc.moveTo(leftMargin + qtyWidth + descWidth, rowY).lineTo(leftMargin + qtyWidth + descWidth, rowY + tableRowHeight).lineWidth(0.5).stroke();
      doc.moveTo(leftMargin + qtyWidth + descWidth + unitPriceWidth, rowY).lineTo(leftMargin + qtyWidth + descWidth + unitPriceWidth, rowY + tableRowHeight).lineWidth(0.5).stroke();
      
      // Row content
      doc.fillColor('black');
      doc.text(item.qty, leftMargin + 5, rowY + 7);
      doc.text(item.desc, leftMargin + 5 + qtyWidth, rowY + 7);
      doc.text(item.unitPrice, leftMargin + 5 + qtyWidth + descWidth, rowY + 7, { width: unitPriceWidth - 10, align: 'right' });
      doc.text(item.total, leftMargin + 5 + qtyWidth + descWidth + unitPriceWidth, rowY + 7, { width: totalWidth - 10, align: 'right' });
      
      // Row separator
      doc.moveTo(leftMargin, rowY + tableRowHeight).lineTo(leftMargin + pageWidth, rowY + tableRowHeight).lineWidth(0.5).stroke();
      rowY += tableRowHeight;
    }
    
    // ========== SUMMARY SECTION (Right side) ==========
    const summaryX = leftMargin + qtyWidth + descWidth + unitPriceWidth + 10;
    const summaryY = tableY;
    const summaryWidth = totalWidth - 10;
    const summaryBoxHeight = 18;
    
    let summaryYPos = summaryY + tableHeight + 10;
    
    // SUBTOTAL
    doc.rect(summaryX, summaryYPos, summaryWidth, summaryBoxHeight).stroke();
    doc.fontSize(8).font('Helvetica');
    doc.fillColor('black');
    doc.text('SUBTOTAL', summaryX + 5, summaryYPos + 6);
    doc.text(`${currencySymbol}${parseFloat(invoice.amount || 0).toFixed(2)}`, summaryX + 5, summaryYPos + 6, { width: summaryWidth - 10, align: 'right' });
    summaryYPos += summaryBoxHeight;
    
    // DISCOUNT (if any)
    if (parseFloat(invoice.discount_amount || 0) > 0) {
      doc.rect(summaryX, summaryYPos, summaryWidth, summaryBoxHeight).stroke();
      doc.text('DISCOUNT', summaryX + 5, summaryYPos + 6);
      doc.text(`-${currencySymbol}${parseFloat(invoice.discount_amount || 0).toFixed(2)}`, summaryX + 5, summaryYPos + 6, { width: summaryWidth - 10, align: 'right' });
      summaryYPos += summaryBoxHeight;
    }
    
    // FINE (if any)
    if (parseFloat(invoice.fine_amount || 0) > 0) {
      doc.rect(summaryX, summaryYPos, summaryWidth, summaryBoxHeight).stroke();
      doc.text('FINE', summaryX + 5, summaryYPos + 6);
      doc.text(`${currencySymbol}${parseFloat(invoice.fine_amount || 0).toFixed(2)}`, summaryX + 5, summaryYPos + 6, { width: summaryWidth - 10, align: 'right' });
      summaryYPos += summaryBoxHeight;
    }
    
    // PAID AMOUNT (if any)
    if (parseFloat(invoice.paid_amount || 0) > 0) {
      doc.rect(summaryX, summaryYPos, summaryWidth, summaryBoxHeight).stroke();
      doc.text('PAID', summaryX + 5, summaryYPos + 6);
      doc.text(`${currencySymbol}${parseFloat(invoice.paid_amount || 0).toFixed(2)}`, summaryX + 5, summaryYPos + 6, { width: summaryWidth - 10, align: 'right' });
      summaryYPos += summaryBoxHeight;
    }
    
    // TOTAL DUE (Balance Amount) - Fixed overlapping
    summaryYPos += 3;
    const totalDueHeight = summaryBoxHeight + 3;
    doc.rect(summaryX, summaryYPos, summaryWidth, totalDueHeight).stroke();
    doc.fontSize(9).font('Helvetica-Bold');
    doc.fillColor('black');
    // Label on left
    doc.text('TOTAL DUE', summaryX + 5, summaryYPos + 7);
    // Amount on right, same line
    doc.text(`${currencySymbol}${parseFloat(invoice.balance_amount || 0).toFixed(2)}`, summaryX + 5, summaryYPos + 7, { width: summaryWidth - 10, align: 'right' });
    
    yPos = Math.max(rowY, summaryYPos + summaryBoxHeight + 5) + 15;
    
    // ========== FOOTER SECTION ==========
    const footerY = yPos;
    const footerHeight = 50;
    
    // Footer box
    doc.rect(leftMargin, footerY, pageWidth, footerHeight).stroke();
    
    doc.fontSize(8).font('Helvetica');
    let footerTextY = footerY + 8;
    doc.text(`Make all checks payable to ${schoolName}`, leftMargin + 5, footerTextY);
    footerTextY += 10;
    doc.text('Payment is due within 30 days.', leftMargin + 5, footerTextY);
    footerTextY += 10;
    
    const contactPerson = schoolPhone || schoolEmail ? `If you have any questions concerning this invoice, contact ${schoolName}` : '';
    if (contactPerson) {
      doc.text(contactPerson, leftMargin + 5, footerTextY);
      footerTextY += 10;
      if (schoolPhone || schoolEmail) {
        const contactDetails = [schoolPhone, schoolEmail].filter(Boolean).join(', ');
        doc.text(contactDetails, leftMargin + 5, footerTextY);
        footerTextY += 10;
      }
    }
    
    doc.text('Thank you for your business!', leftMargin + 5, footerTextY);
    
    // Finalize PDF
    doc.end();
  } catch (error: any) {
    console.error('Error in downloadInvoicePDF:', error);
    next(error);
  }
};

