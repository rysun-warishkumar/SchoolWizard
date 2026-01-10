import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';

// ========== Contact Messages ==========

export const getContactMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { status } = req.query;
    
    let query = 'SELECT * FROM contact_messages ORDER BY created_at DESC';
    const params: any[] = [];
    
    if (status) {
      query = 'SELECT * FROM contact_messages WHERE status = ? ORDER BY created_at DESC';
      params.push(status);
    }
    
    const [messages] = await db.execute(query, params);
    res.json({ success: true, data: Array.isArray(messages) ? messages : [] });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const getContactMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const [messages] = await db.execute('SELECT * FROM contact_messages WHERE id = ?', [String(id)]);
    
    if (!messages || (Array.isArray(messages) && messages.length === 0)) {
      return next(createError('Contact message not found', 404));
    }
    
    res.json({ success: true, data: Array.isArray(messages) ? messages[0] : messages });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const createContactMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { name, email, phone, subject, message } = req.body;
    
    if (!name || !email || !message) {
      return next(createError('Name, email, and message are required', 400));
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(createError('Invalid email format', 400));
    }
    
    const [result] = await db.execute(
      'INSERT INTO contact_messages (name, email, phone, subject, message, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, subject || null, message, 'new']
    );
    
    const insertResult = result as any;
    const [newMessage] = await db.execute('SELECT * FROM contact_messages WHERE id = ?', [String(insertResult.insertId)]);
    
    res.status(201).json({ 
      success: true, 
      message: 'Thank you for contacting us! We will get back to you soon.', 
      data: Array.isArray(newMessage) ? newMessage[0] : newMessage 
    });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const updateContactMessageStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!status || !['new', 'read', 'replied', 'archived'].includes(status)) {
      return next(createError('Invalid status', 400));
    }
    
    const updateFields: string[] = ['status = ?'];
    const params: any[] = [status];
    
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes || null);
    }
    
    if (status === 'replied') {
      updateFields.push('replied_at = CURRENT_TIMESTAMP');
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    await db.execute(
      `UPDATE contact_messages SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    const [updated] = await db.execute('SELECT * FROM contact_messages WHERE id = ?', [id]);
    res.json({ 
      success: true, 
      message: 'Contact message status updated successfully', 
      data: Array.isArray(updated) ? updated[0] : updated 
    });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const deleteContactMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const [messages] = await db.execute('SELECT * FROM contact_messages WHERE id = ?', [id]);
    
    if (!messages || (Array.isArray(messages) && messages.length === 0)) {
      return next(createError('Contact message not found', 404));
    }
    
    await db.execute('DELETE FROM contact_messages WHERE id = ?', [id]);
    res.json({ success: true, message: 'Contact message deleted successfully' });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};
