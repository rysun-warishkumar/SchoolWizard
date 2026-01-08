import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { sendEmail } from '../utils/emailService';
import { sendSMS } from '../utils/smsService';

// ========== Notice Board ==========

export const getNotices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { message_to, search, date_from, date_to } = req.query;

    let query = `
      SELECT nb.*,
             u.name as created_by_name
      FROM notice_board nb
      LEFT JOIN users u ON nb.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (message_to) {
      query += ' AND (nb.message_to = ? OR nb.message_to = "all")';
      params.push(message_to);
    }

    if (search) {
      query += ' AND (nb.message_title LIKE ? OR nb.message LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (date_from) {
      query += ' AND nb.publish_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND nb.publish_date <= ?';
      params.push(date_to);
    }

    query += ' ORDER BY nb.publish_date DESC, nb.created_at DESC';

    const [notices] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: notices,
    });
  } catch (error) {
    next(error);
  }
};

export const getNoticeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [notices] = await db.execute(
      `SELECT nb.*,
              u.name as created_by_name
       FROM notice_board nb
       LEFT JOIN users u ON nb.created_by = u.id
       WHERE nb.id = ?`,
      [id]
    ) as any[];

    if (notices.length === 0) {
      throw createError('Notice not found', 404);
    }

    res.json({
      success: true,
      data: notices[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createNotice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message_title, message, notice_date, publish_date, message_to } = req.body;

    if (!message_title || !message || !notice_date || !publish_date || !message_to) {
      throw createError('All fields are required', 400);
    }

    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    await db.execute(
      `INSERT INTO notice_board (message_title, message, notice_date, publish_date, message_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        message_title.trim(),
        message.trim(),
        notice_date,
        publish_date,
        message_to,
        userId,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { message_title, message, notice_date, publish_date, message_to } = req.body;

    if (!message_title || !message || !notice_date || !publish_date || !message_to) {
      throw createError('All fields are required', 400);
    }

    const db = getDatabase();

    await db.execute(
      `UPDATE notice_board
       SET message_title = ?, message = ?, notice_date = ?, publish_date = ?, message_to = ?
       WHERE id = ?`,
      [
        message_title.trim(),
        message.trim(),
        notice_date,
        publish_date,
        message_to,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Notice updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM notice_board WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Notice deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Send Email ==========

export const sendEmailToRecipients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject, message, recipient_type, recipient_ids, class_id, section_id } = req.body;

    if (!subject || !message || !recipient_type) {
      throw createError('Subject, message, and recipient type are required', 400);
    }

    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    let recipientEmails: string[] = [];
    let recipientUserIds: number[] = [];

    // Get recipients based on type
    if (recipient_type === 'students') {
      const [students] = await db.execute(
        'SELECT id, email FROM students WHERE email IS NOT NULL AND email != ""'
      ) as any[];
      recipientEmails = students.map((s: any) => s.email).filter(Boolean);
      recipientUserIds = students.map((s: any) => s.id);
    } else if (recipient_type === 'guardians') {
      const [guardians] = await db.execute(
        'SELECT id, guardian_email as email FROM students WHERE guardian_email IS NOT NULL AND guardian_email != ""'
      ) as any[];
      recipientEmails = guardians.map((g: any) => g.email).filter(Boolean);
      recipientUserIds = guardians.map((g: any) => g.id);
    } else if (recipient_type === 'staff') {
      const [staff] = await db.execute(
        'SELECT id, email FROM staff WHERE email IS NOT NULL AND email != "" AND is_active = 1'
      ) as any[];
      recipientEmails = staff.map((s: any) => s.email).filter(Boolean);
      recipientUserIds = staff.map((s: any) => s.id);
    } else if (recipient_type === 'individual' && recipient_ids) {
      const ids = Array.isArray(recipient_ids) ? recipient_ids : JSON.parse(recipient_ids);
      const placeholders = ids.map(() => '?').join(',');
      const [users] = await db.execute(
        `SELECT id, email FROM users WHERE id IN (${placeholders}) AND email IS NOT NULL AND email != ""`,
        ids
      ) as any[];
      recipientEmails = users.map((u: any) => u.email).filter(Boolean);
      recipientUserIds = users.map((u: any) => u.id);
    } else if (recipient_type === 'class' && class_id && section_id) {
      const [students] = await db.execute(
        'SELECT id, email, guardian_email FROM students WHERE class_id = ? AND section_id = ?',
        [class_id, section_id]
      ) as any[];
      const studentEmails = students.map((s: any) => s.email).filter(Boolean);
      const guardianEmails = students.map((s: any) => s.guardian_email).filter(Boolean);
      recipientEmails = [...new Set([...studentEmails, ...guardianEmails])];
      recipientUserIds = students.map((s: any) => s.id);
    } else if (recipient_type === 'birthday') {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const [students] = await db.execute(
        `SELECT id, email, guardian_email FROM students 
         WHERE MONTH(date_of_birth) = ? AND DAY(date_of_birth) = ? 
         AND (email IS NOT NULL OR guardian_email IS NOT NULL)`,
        [month, day]
      ) as any[];
      const studentEmails = students.map((s: any) => s.email).filter(Boolean);
      const guardianEmails = students.map((s: any) => s.guardian_email).filter(Boolean);
      recipientEmails = [...new Set([...studentEmails, ...guardianEmails])];
      recipientUserIds = students.map((s: any) => s.id);
    }

    if (recipientEmails.length === 0) {
      throw createError('No recipients found with email addresses', 400);
    }

    // Send emails
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const email of recipientEmails) {
      try {
        await sendEmail({
          to: email,
          subject: subject,
          html: message,
        });
        successCount++;
      } catch (error: any) {
        failCount++;
        errors.push(`${email}: ${error.message}`);
      }
    }

    // Log email
    await db.execute(
      `INSERT INTO email_log (subject, message, recipient_type, recipient_ids, recipient_emails, sent_by, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subject.trim(),
        message.trim(),
        recipient_type,
        JSON.stringify(recipientUserIds),
        JSON.stringify(recipientEmails),
        userId,
        failCount === 0 ? 'sent' : (successCount > 0 ? 'sent' : 'failed'),
        errors.length > 0 ? errors.join('; ') : null,
      ]
    );

    res.json({
      success: true,
      message: `Email sent to ${successCount} recipient(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
      data: {
        success_count: successCount,
        fail_count: failCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ========== Send SMS ==========

export const sendSMSToRecipients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject, message, recipient_type, recipient_ids, class_id, section_id } = req.body;

    if (!subject || !message || !recipient_type) {
      throw createError('Subject, message, and recipient type are required', 400);
    }

    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    let recipientPhones: string[] = [];
    let recipientUserIds: number[] = [];

    // Get recipients based on type
    if (recipient_type === 'students') {
      const [students] = await db.execute(
        'SELECT id, student_mobile as phone FROM students WHERE student_mobile IS NOT NULL AND student_mobile != ""'
      ) as any[];
      recipientPhones = students.map((s: any) => s.student_mobile).filter(Boolean);
      recipientUserIds = students.map((s: any) => s.id);
    } else if (recipient_type === 'guardians') {
      const [guardians] = await db.execute(
        'SELECT id, guardian_phone as phone FROM students WHERE guardian_phone IS NOT NULL AND guardian_phone != ""'
      ) as any[];
      recipientPhones = guardians.map((g: any) => g.guardian_phone).filter(Boolean);
      recipientUserIds = guardians.map((g: any) => g.id);
    } else if (recipient_type === 'staff') {
      const [staff] = await db.execute(
        'SELECT id, phone FROM staff WHERE phone IS NOT NULL AND phone != "" AND is_active = 1'
      ) as any[];
      recipientPhones = staff.map((s: any) => s.phone).filter(Boolean);
      recipientUserIds = staff.map((s: any) => s.id);
    } else if (recipient_type === 'individual' && recipient_ids) {
      const ids = Array.isArray(recipient_ids) ? recipient_ids : JSON.parse(recipient_ids);
      const placeholders = ids.map(() => '?').join(',');
      const [users] = await db.execute(
        `SELECT id, phone FROM users WHERE id IN (${placeholders}) AND phone IS NOT NULL AND phone != ""`,
        ids
      ) as any[];
      recipientPhones = users.map((u: any) => u.phone).filter(Boolean);
      recipientUserIds = users.map((u: any) => u.id);
    } else if (recipient_type === 'class' && class_id && section_id) {
      const [students] = await db.execute(
        'SELECT id, student_mobile, guardian_phone FROM students WHERE class_id = ? AND section_id = ?',
        [class_id, section_id]
      ) as any[];
      const studentPhones = students.map((s: any) => s.student_mobile).filter(Boolean);
      const guardianPhones = students.map((s: any) => s.guardian_phone).filter(Boolean);
      recipientPhones = [...new Set([...studentPhones, ...guardianPhones])];
      recipientUserIds = students.map((s: any) => s.id);
    } else if (recipient_type === 'birthday') {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const [students] = await db.execute(
        `SELECT id, student_mobile, guardian_phone FROM students 
         WHERE MONTH(date_of_birth) = ? AND DAY(date_of_birth) = ? 
         AND (student_mobile IS NOT NULL OR guardian_phone IS NOT NULL)`,
        [month, day]
      ) as any[];
      const studentPhones = students.map((s: any) => s.student_mobile).filter(Boolean);
      const guardianPhones = students.map((s: any) => s.guardian_phone).filter(Boolean);
      recipientPhones = [...new Set([...studentPhones, ...guardianPhones])];
      recipientUserIds = students.map((s: any) => s.id);
    }

    if (recipientPhones.length === 0) {
      throw createError('No recipients found with phone numbers', 400);
    }

    // Send SMS
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const phone of recipientPhones) {
      try {
        await sendSMS(phone, message);
        successCount++;
      } catch (error: any) {
        failCount++;
        errors.push(`${phone}: ${error.message}`);
      }
    }

    // Log SMS
    await db.execute(
      `INSERT INTO sms_log (subject, message, recipient_type, recipient_ids, recipient_phones, sent_by, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subject.trim(),
        message.trim(),
        recipient_type,
        JSON.stringify(recipientUserIds),
        JSON.stringify(recipientPhones),
        userId,
        failCount === 0 ? 'sent' : (successCount > 0 ? 'sent' : 'failed'),
        errors.length > 0 ? errors.join('; ') : null,
      ]
    );

    res.json({
      success: true,
      message: `SMS sent to ${successCount} recipient(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
      data: {
        success_count: successCount,
        fail_count: failCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ========== Email Log ==========

export const getEmailLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { recipient_type, status, date_from, date_to, search } = req.query;

    let query = `
      SELECT el.*,
             u.name as sent_by_name
      FROM email_log el
      LEFT JOIN users u ON el.sent_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (recipient_type) {
      query += ' AND el.recipient_type = ?';
      params.push(recipient_type);
    }

    if (status) {
      query += ' AND el.status = ?';
      params.push(status);
    }

    if (date_from) {
      query += ' AND DATE(el.sent_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND DATE(el.sent_at) <= ?';
      params.push(date_to);
    }

    if (search) {
      query += ' AND (el.subject LIKE ? OR el.message LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY el.sent_at DESC';

    const [logs] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// ========== SMS Log ==========

export const getSMSLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { recipient_type, status, date_from, date_to, search } = req.query;

    let query = `
      SELECT sl.*,
             u.name as sent_by_name
      FROM sms_log sl
      LEFT JOIN users u ON sl.sent_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (recipient_type) {
      query += ' AND sl.recipient_type = ?';
      params.push(recipient_type);
    }

    if (status) {
      query += ' AND sl.status = ?';
      params.push(status);
    }

    if (date_from) {
      query += ' AND DATE(sl.sent_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND DATE(sl.sent_at) <= ?';
      params.push(date_to);
    }

    if (search) {
      query += ' AND (sl.subject LIKE ? OR sl.message LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY sl.sent_at DESC';

    const [logs] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

