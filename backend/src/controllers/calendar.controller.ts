import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// ========== Calendar Events ==========

export const getCalendarEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;
    const userRole = (req as AuthRequest).user?.role;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    let query = `
      SELECT ce.*, u.name as user_name, r.name as user_role_name
      FROM calendar_events ce
      INNER JOIN users u ON ce.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE (
        ce.event_type = 'public' OR
        (ce.event_type = 'private' AND ce.user_id = ?) OR
        (ce.event_type = 'role' AND ce.role_name = ? AND ce.role_name IS NOT NULL) OR
        (ce.event_type = 'protected' AND r.name IN ('superadmin', 'admin', 'teacher', 'staff'))
      )
    `;
    const params: any[] = [userId, userRole || ''];

    if (start_date && end_date) {
      query += ' AND ce.event_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY ce.event_date ASC, ce.created_at ASC';

    const [events] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

export const getCalendarEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;
    const userRole = (req as AuthRequest).user?.role;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const [events] = await db.execute(
      `SELECT ce.*, u.name as user_name, r.name as user_role_name
       FROM calendar_events ce
       INNER JOIN users u ON ce.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE ce.id = ? AND (
         ce.event_type = 'public' OR
         (ce.event_type = 'private' AND ce.user_id = ?) OR
         (ce.event_type = 'role' AND ce.role_name = ? AND ce.role_name IS NOT NULL) OR
         (ce.event_type = 'protected' AND r.name IN ('superadmin', 'admin', 'teacher', 'staff'))
       )`,
      [id, userId, userRole || '']
    ) as any[];

    if (events.length === 0) {
      throw createError('Calendar event not found', 404);
    }

    res.json({
      success: true,
      data: events[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createCalendarEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, event_date, event_color, event_type, role_name } = req.body;
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    if (!title || !event_date) {
      throw createError('Event title and date are required', 400);
    }

    const [result] = await db.execute(
      `INSERT INTO calendar_events 
       (user_id, title, description, event_date, event_color, event_type, role_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title.trim(),
        description?.trim() || null,
        event_date,
        event_color || '#3B82F6',
        event_type || 'private',
        event_type === 'role' ? role_name : null,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Calendar event created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCalendarEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, event_date, event_color, event_type, role_name } = req.body;
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    // Check if event exists and user owns it
    const [existing] = await db.execute(
      'SELECT * FROM calendar_events WHERE id = ? AND user_id = ?',
      [id, userId]
    ) as any[];

    if (existing.length === 0) {
      throw createError('Calendar event not found or you do not have permission to edit it', 404);
    }

    await db.execute(
      `UPDATE calendar_events SET
       title = ?, description = ?, event_date = ?, event_color = ?, event_type = ?, role_name = ?
       WHERE id = ? AND user_id = ?`,
      [
        title?.trim() || existing[0].title,
        description?.trim() || existing[0].description,
        event_date || existing[0].event_date,
        event_color || existing[0].event_color,
        event_type || existing[0].event_type,
        event_type === 'role' ? role_name : null,
        id,
        userId,
      ]
    );

    res.json({
      success: true,
      message: 'Calendar event updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCalendarEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    // Check if event exists and user owns it
    const [existing] = await db.execute(
      'SELECT * FROM calendar_events WHERE id = ? AND user_id = ?',
      [id, userId]
    ) as any[];

    if (existing.length === 0) {
      throw createError('Calendar event not found or you do not have permission to delete it', 404);
    }

    await db.execute('DELETE FROM calendar_events WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({
      success: true,
      message: 'Calendar event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Todo Tasks ==========

export const getTodoTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start_date, end_date, is_completed } = req.query;
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    let query = 'SELECT * FROM todo_tasks WHERE user_id = ?';
    const params: any[] = [userId];

    if (start_date && end_date) {
      query += ' AND task_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (is_completed !== undefined) {
      query += ' AND is_completed = ?';
      const isCompleted = typeof is_completed === 'string' 
        ? (is_completed === 'true' || is_completed === '1')
        : Boolean(is_completed);
      params.push(isCompleted);
    }

    query += ' ORDER BY task_date ASC, created_at ASC';

    const [tasks] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getTodoTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const [tasks] = await db.execute(
      'SELECT * FROM todo_tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    ) as any[];

    if (tasks.length === 0) {
      throw createError('Todo task not found', 404);
    }

    res.json({
      success: true,
      data: tasks[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createTodoTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, task_date } = req.body;
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    if (!title || !task_date) {
      throw createError('Task title and date are required', 400);
    }

    const [result] = await db.execute(
      'INSERT INTO todo_tasks (user_id, title, task_date) VALUES (?, ?, ?)',
      [userId, title.trim(), task_date]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Todo task created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTodoTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, task_date, is_completed } = req.body;
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    // Check if task exists and user owns it
    const [existing] = await db.execute(
      'SELECT * FROM todo_tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    ) as any[];

    if (existing.length === 0) {
      throw createError('Todo task not found or you do not have permission to edit it', 404);
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (task_date !== undefined) updateData.task_date = task_date;
    if (is_completed !== undefined) {
      updateData.is_completed = is_completed === 'true' || is_completed === true;
      updateData.completed_at = updateData.is_completed ? new Date() : null;
    }

    const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(updateData);
    updateValues.push(id, userId);

    await db.execute(
      `UPDATE todo_tasks SET ${updateFields} WHERE id = ? AND user_id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Todo task updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTodoTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    // Check if task exists and user owns it
    const [existing] = await db.execute(
      'SELECT * FROM todo_tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    ) as any[];

    if (existing.length === 0) {
      throw createError('Todo task not found or you do not have permission to delete it', 404);
    }

    await db.execute('DELETE FROM todo_tasks WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({
      success: true,
      message: 'Todo task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

