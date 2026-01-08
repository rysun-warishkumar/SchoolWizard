import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';

// Helper function to convert string boolean to boolean
const parseBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value === 'true' || value === '1' || value === 'on';
  }
  return false;
};

// ========== Admission Inquiries ==========

export const getInquiries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { status } = req.query;
    
    let query = 'SELECT * FROM admission_inquiries ORDER BY created_at DESC';
    const params: any[] = [];
    
    if (status) {
      query = 'SELECT * FROM admission_inquiries WHERE status = ? ORDER BY created_at DESC';
      params.push(status);
    }
    
    const [inquiries] = await db.execute(query, params);
    res.json({ success: true, data: Array.isArray(inquiries) ? inquiries : [] });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

export const getInquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const [inquiries] = await db.execute('SELECT * FROM admission_inquiries WHERE id = ?', [id]);
    
    if (!inquiries || (Array.isArray(inquiries) && inquiries.length === 0)) {
      return next(createError(404, 'Inquiry not found'));
    }
    
    res.json({ success: true, data: Array.isArray(inquiries) ? inquiries[0] : inquiries });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

export const createInquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { student_name, parent_name, email, phone, grade, previous_school, address, message } = req.body;
    
    if (!student_name || !parent_name || !email || !phone || !grade || !address) {
      return next(createError(400, 'Required fields are missing'));
    }
    
    const [result] = await db.execute(
      'INSERT INTO admission_inquiries (student_name, parent_name, email, phone, grade, previous_school, address, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student_name, parent_name, email, phone, grade, previous_school || null, address, message || null]
    );
    
    const insertResult = result as any;
    const [inquiry] = await db.execute('SELECT * FROM admission_inquiries WHERE id = ?', [insertResult.insertId]);
    
    res.status(201).json({ success: true, message: 'Inquiry submitted successfully', data: Array.isArray(inquiry) ? inquiry[0] : inquiry });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

export const updateInquiryStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!status || !['pending', 'contacted', 'approved', 'rejected'].includes(status)) {
      return next(createError(400, 'Invalid status'));
    }
    
    await db.execute(
      'UPDATE admission_inquiries SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, notes || null, id]
    );
    
    const [updated] = await db.execute('SELECT * FROM admission_inquiries WHERE id = ?', [id]);
    res.json({ success: true, message: 'Inquiry status updated successfully', data: Array.isArray(updated) ? updated[0] : updated });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

export const deleteInquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    await db.execute('DELETE FROM admission_inquiries WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

// ========== Important Dates ==========

export const getImportantDates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const [dates] = await db.execute(
      'SELECT * FROM admission_important_dates ORDER BY sort_order ASC, created_at ASC'
    );
    
    res.json({ success: true, data: Array.isArray(dates) ? dates : [] });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

export const createImportantDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { title, date_value, description, sort_order, is_active } = req.body;
    
    if (!title || !date_value) {
      return next(createError(400, 'Title and date are required'));
    }
    
    const [result] = await db.execute(
      'INSERT INTO admission_important_dates (title, date_value, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [title, date_value, description || null, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true]
    );
    
    const insertResult = result as any;
    const [date] = await db.execute('SELECT * FROM admission_important_dates WHERE id = ?', [insertResult.insertId]);
    
    res.status(201).json({ success: true, message: 'Important date created successfully', data: Array.isArray(date) ? date[0] : date });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

export const updateImportantDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { title, date_value, description, sort_order, is_active } = req.body;
    
    await db.execute(
      'UPDATE admission_important_dates SET title = ?, date_value = ?, description = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, date_value, description || null, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true, id]
    );
    
    const [updated] = await db.execute('SELECT * FROM admission_important_dates WHERE id = ?', [id]);
    res.json({ success: true, message: 'Important date updated successfully', data: Array.isArray(updated) ? updated[0] : updated });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

export const deleteImportantDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    await db.execute('DELETE FROM admission_important_dates WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Important date deleted successfully' });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

// ========== Contact Details ==========

export const getContactDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const [details] = await db.execute('SELECT * FROM admission_contact_details LIMIT 1');
    
    if (!details || (Array.isArray(details) && details.length === 0)) {
      return res.json({
        success: true,
        data: {
          call_us_numbers: '[]',
          email_us_addresses: '[]',
          visit_us_address: '',
          office_hours: '',
          important_dates_visible: true,
          contact_details_visible: true,
        },
      });
    }
    
    const detail = Array.isArray(details) ? details[0] : details;
    res.json({ success: true, data: detail });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

export const updateContactDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { call_us_numbers, email_us_addresses, visit_us_address, office_hours, important_dates_visible, contact_details_visible } = req.body;
    
    const [existing] = await db.execute('SELECT id FROM admission_contact_details LIMIT 1');
    const exists = Array.isArray(existing) && existing.length > 0;
    
    const callNumbers = call_us_numbers ? (typeof call_us_numbers === 'string' ? call_us_numbers : JSON.stringify(call_us_numbers)) : null;
    const emailAddresses = email_us_addresses ? (typeof email_us_addresses === 'string' ? email_us_addresses : JSON.stringify(email_us_addresses)) : null;
    
    if (exists) {
      const existingId = (Array.isArray(existing) ? existing[0] : existing) as any;
      await db.execute(
        'UPDATE admission_contact_details SET call_us_numbers = ?, email_us_addresses = ?, visit_us_address = ?, office_hours = ?, important_dates_visible = ?, contact_details_visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [
          callNumbers,
          emailAddresses,
          visit_us_address || null,
          office_hours || null,
          parseBoolean(important_dates_visible) !== undefined ? parseBoolean(important_dates_visible) : true,
          parseBoolean(contact_details_visible) !== undefined ? parseBoolean(contact_details_visible) : true,
          existingId.id,
        ]
      );
    } else {
      await db.execute(
        'INSERT INTO admission_contact_details (call_us_numbers, email_us_addresses, visit_us_address, office_hours, important_dates_visible, contact_details_visible) VALUES (?, ?, ?, ?, ?, ?)',
        [
          callNumbers,
          emailAddresses,
          visit_us_address || null,
          office_hours || null,
          parseBoolean(important_dates_visible) !== undefined ? parseBoolean(important_dates_visible) : true,
          parseBoolean(contact_details_visible) !== undefined ? parseBoolean(contact_details_visible) : true,
        ]
      );
    }
    
    const [updated] = await db.execute('SELECT * FROM admission_contact_details LIMIT 1');
    res.json({ success: true, message: 'Contact details updated successfully', data: Array.isArray(updated) ? updated[0] : updated });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

