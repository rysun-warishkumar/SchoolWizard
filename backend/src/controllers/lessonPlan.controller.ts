import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/lesson-plans');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only images, PDFs, and Office documents are allowed.'));
  },
});

// ========== Subject Status ==========

export const getSubjectStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { class_id, section_id, subject_id, teacher_id, status } = req.query;
    const db = getDatabase();

    let query = `
      SELECT ss.*,
             c.name as class_name,
             s.name as section_name,
             sub.name as subject_name,
             sub.code as subject_code,
             st.first_name as teacher_first_name,
             st.last_name as teacher_last_name
      FROM subject_status ss
      INNER JOIN classes c ON ss.class_id = c.id
      INNER JOIN sections s ON ss.section_id = s.id
      INNER JOIN subjects sub ON ss.subject_id = sub.id
      LEFT JOIN staff st ON ss.teacher_id = st.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (class_id) {
      query += ' AND ss.class_id = ?';
      params.push(class_id);
    }
    if (section_id) {
      query += ' AND ss.section_id = ?';
      params.push(section_id);
    }
    if (subject_id) {
      query += ' AND ss.subject_id = ?';
      params.push(subject_id);
    }
    if (teacher_id) {
      query += ' AND ss.teacher_id = ?';
      params.push(teacher_id);
    }
    if (status) {
      query += ' AND ss.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ss.class_id, ss.section_id, ss.subject_id, ss.topic_name';

    const [statuses] = await db.execute(query, params) as any[];

    res.json({ success: true, data: statuses });
  } catch (error) {
    next(error);
  }
};

export const getSubjectStatusById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [statuses] = await db.execute(
      `SELECT ss.*,
              c.name as class_name,
              s.name as section_name,
              sub.name as subject_name,
              sub.code as subject_code,
              st.first_name as teacher_first_name,
              st.last_name as teacher_last_name
       FROM subject_status ss
       INNER JOIN classes c ON ss.class_id = c.id
       INNER JOIN sections s ON ss.section_id = s.id
       INNER JOIN subjects sub ON ss.subject_id = sub.id
       LEFT JOIN staff st ON ss.teacher_id = st.id
       WHERE ss.id = ?`,
      [id]
    ) as any[];

    if (statuses.length === 0) {
      throw createError('Subject status not found', 404);
    }

    res.json({ success: true, data: statuses[0] });
  } catch (error) {
    next(error);
  }
};

export const createSubjectStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { class_id, section_id, subject_id, teacher_id, topic_name, start_date, completion_date, status, completion_percentage, notes } = req.body;
    const db = getDatabase();

    if (!class_id || !section_id || !subject_id || !topic_name) {
      throw createError('Class, section, subject, and topic name are required', 400);
    }

    const [result] = await db.execute(
      `INSERT INTO subject_status 
       (class_id, section_id, subject_id, teacher_id, topic_name, start_date, completion_date, status, completion_percentage, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        class_id,
        section_id,
        subject_id,
        teacher_id || null,
        topic_name,
        start_date || null,
        completion_date || null,
        status || 'not_started',
        completion_percentage || 0,
        notes || null,
      ]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Subject status created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubjectStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { topic_name, start_date, completion_date, status, completion_percentage, notes, teacher_id } = req.body;
    const db = getDatabase();

    const updateFields: string[] = [];
    const params: any[] = [];

    if (topic_name !== undefined) {
      updateFields.push('topic_name = ?');
      params.push(topic_name);
    }
    if (start_date !== undefined) {
      updateFields.push('start_date = ?');
      params.push(start_date || null);
    }
    if (completion_date !== undefined) {
      updateFields.push('completion_date = ?');
      params.push(completion_date || null);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }
    if (completion_percentage !== undefined) {
      updateFields.push('completion_percentage = ?');
      params.push(completion_percentage);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes || null);
    }
    if (teacher_id !== undefined) {
      updateFields.push('teacher_id = ?');
      params.push(teacher_id || null);
    }

    if (updateFields.length === 0) {
      throw createError('No fields to update', 400);
    }

    updateFields.push('updated_at = NOW()');
    params.push(id);

    await db.execute(
      `UPDATE subject_status SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Subject status updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteSubjectStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM subject_status WHERE id = ?', [id]);

    res.json({ success: true, message: 'Subject status deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ========== Lesson Plans ==========

export const getLessonPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { class_id, section_id, subject_id, teacher_id, status, start_date, end_date } = req.query;
    const db = getDatabase();

    let query = `
      SELECT lp.*,
             c.name as class_name,
             s.name as section_name,
             sub.name as subject_name,
             sub.code as subject_code,
             st.first_name as teacher_first_name,
             st.last_name as teacher_last_name,
             (SELECT COUNT(*) FROM lesson_plan_topics lpt WHERE lpt.lesson_plan_id = lp.id) as topics_count,
             (SELECT COUNT(*) FROM lesson_plan_attachments lpa WHERE lpa.lesson_plan_id = lp.id) as attachments_count
      FROM lesson_plans lp
      INNER JOIN classes c ON lp.class_id = c.id
      INNER JOIN sections s ON lp.section_id = s.id
      INNER JOIN subjects sub ON lp.subject_id = sub.id
      LEFT JOIN staff st ON lp.teacher_id = st.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (class_id) {
      query += ' AND lp.class_id = ?';
      params.push(class_id);
    }
    if (section_id) {
      query += ' AND lp.section_id = ?';
      params.push(section_id);
    }
    if (subject_id) {
      query += ' AND lp.subject_id = ?';
      params.push(subject_id);
    }
    if (teacher_id) {
      query += ' AND lp.teacher_id = ?';
      params.push(teacher_id);
    }
    if (status) {
      query += ' AND lp.status = ?';
      params.push(status);
    }
    if (start_date && end_date) {
      query += ' AND lp.lesson_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY lp.lesson_date DESC, lp.created_at DESC';

    const [plans] = await db.execute(query, params) as any[];

    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

export const getLessonPlanById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [plans] = await db.execute(
      `SELECT lp.*,
              c.name as class_name,
              s.name as section_name,
              sub.name as subject_name,
              sub.code as subject_code,
              st.first_name as teacher_first_name,
              st.last_name as teacher_last_name
       FROM lesson_plans lp
       INNER JOIN classes c ON lp.class_id = c.id
       INNER JOIN sections s ON lp.section_id = s.id
       INNER JOIN subjects sub ON lp.subject_id = sub.id
       LEFT JOIN staff st ON lp.teacher_id = st.id
       WHERE lp.id = ?`,
      [id]
    ) as any[];

    if (plans.length === 0) {
      throw createError('Lesson plan not found', 404);
    }

    // Get topics
    const [topics] = await db.execute(
      'SELECT * FROM lesson_plan_topics WHERE lesson_plan_id = ? ORDER BY topic_order',
      [id]
    ) as any[];

    // Get attachments
    const [attachments] = await db.execute(
      'SELECT * FROM lesson_plan_attachments WHERE lesson_plan_id = ? ORDER BY uploaded_at DESC',
      [id]
    ) as any[];

    res.json({
      success: true,
      data: {
        ...plans[0],
        topics,
        attachments,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createLessonPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      class_id,
      section_id,
      subject_id,
      teacher_id,
      lesson_title,
      lesson_date,
      topic,
      learning_objectives,
      teaching_methods,
      materials_needed,
      activities,
      homework,
      assessment,
      notes,
      status,
    } = req.body;
    const db = getDatabase();

    if (!class_id || !section_id || !subject_id || !lesson_title || !lesson_date) {
      throw createError('Class, section, subject, lesson title, and lesson date are required', 400);
    }

    const [result] = await db.execute(
      `INSERT INTO lesson_plans 
       (class_id, section_id, subject_id, teacher_id, lesson_title, lesson_date, topic, learning_objectives, 
        teaching_methods, materials_needed, activities, homework, assessment, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        class_id,
        section_id,
        subject_id,
        teacher_id || null,
        lesson_title,
        lesson_date,
        topic || null,
        learning_objectives || null,
        teaching_methods || null,
        materials_needed || null,
        activities || null,
        homework || null,
        assessment || null,
        notes || null,
        status || 'draft',
      ]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Lesson plan created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLessonPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      lesson_title,
      lesson_date,
      topic,
      learning_objectives,
      teaching_methods,
      materials_needed,
      activities,
      homework,
      assessment,
      notes,
      status,
      teacher_id,
    } = req.body;
    const db = getDatabase();

    const updateFields: string[] = [];
    const params: any[] = [];

    if (lesson_title !== undefined) {
      updateFields.push('lesson_title = ?');
      params.push(lesson_title);
    }
    if (lesson_date !== undefined) {
      updateFields.push('lesson_date = ?');
      params.push(lesson_date);
    }
    if (topic !== undefined) {
      updateFields.push('topic = ?');
      params.push(topic || null);
    }
    if (learning_objectives !== undefined) {
      updateFields.push('learning_objectives = ?');
      params.push(learning_objectives || null);
    }
    if (teaching_methods !== undefined) {
      updateFields.push('teaching_methods = ?');
      params.push(teaching_methods || null);
    }
    if (materials_needed !== undefined) {
      updateFields.push('materials_needed = ?');
      params.push(materials_needed || null);
    }
    if (activities !== undefined) {
      updateFields.push('activities = ?');
      params.push(activities || null);
    }
    if (homework !== undefined) {
      updateFields.push('homework = ?');
      params.push(homework || null);
    }
    if (assessment !== undefined) {
      updateFields.push('assessment = ?');
      params.push(assessment || null);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes || null);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }
    if (teacher_id !== undefined) {
      updateFields.push('teacher_id = ?');
      params.push(teacher_id || null);
    }

    if (updateFields.length === 0) {
      throw createError('No fields to update', 400);
    }

    updateFields.push('updated_at = NOW()');
    params.push(id);

    await db.execute(`UPDATE lesson_plans SET ${updateFields.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Lesson plan updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteLessonPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM lesson_plans WHERE id = ?', [id]);

    res.json({ success: true, message: 'Lesson plan deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ========== Lesson Plan Topics ==========

export const getLessonPlanTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lesson_plan_id } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM lesson_plan_topics WHERE 1=1';
    const params: any[] = [];

    if (lesson_plan_id) {
      query += ' AND lesson_plan_id = ?';
      params.push(lesson_plan_id);
    }

    query += ' ORDER BY topic_order';

    const [topics] = await db.execute(query, params) as any[];

    res.json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
};

export const createLessonPlanTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lesson_plan_id, topic_name, topic_order, estimated_duration, status, notes } = req.body;
    const db = getDatabase();

    if (!lesson_plan_id || !topic_name) {
      throw createError('Lesson plan ID and topic name are required', 400);
    }

    const [result] = await db.execute(
      `INSERT INTO lesson_plan_topics 
       (lesson_plan_id, topic_name, topic_order, estimated_duration, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        lesson_plan_id,
        topic_name,
        topic_order || 0,
        estimated_duration || null,
        status || 'pending',
        notes || null,
      ]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLessonPlanTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { topic_name, topic_order, estimated_duration, status, notes } = req.body;
    const db = getDatabase();

    const updateFields: string[] = [];
    const params: any[] = [];

    if (topic_name !== undefined) {
      updateFields.push('topic_name = ?');
      params.push(topic_name);
    }
    if (topic_order !== undefined) {
      updateFields.push('topic_order = ?');
      params.push(topic_order);
    }
    if (estimated_duration !== undefined) {
      updateFields.push('estimated_duration = ?');
      params.push(estimated_duration || null);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes || null);
    }

    if (updateFields.length === 0) {
      throw createError('No fields to update', 400);
    }

    params.push(id);

    await db.execute(`UPDATE lesson_plan_topics SET ${updateFields.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Topic updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteLessonPlanTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM lesson_plan_topics WHERE id = ?', [id]);

    res.json({ success: true, message: 'Topic deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ========== Lesson Plan Attachments ==========

export const uploadLessonPlanAttachment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lesson_plan_id } = req.body;
    const file = req.file;

    if (!lesson_plan_id) {
      throw createError('Lesson plan ID is required', 400);
    }

    if (!file) {
      throw createError('File is required', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      `INSERT INTO lesson_plan_attachments 
       (lesson_plan_id, file_name, file_path, file_type, file_size, uploaded_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        lesson_plan_id,
        file.originalname,
        `/uploads/lesson-plans/${file.filename}`,
        file.mimetype,
        file.size,
      ]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLessonPlanAttachment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Get file path before deleting
    const [attachments] = await db.execute('SELECT file_path FROM lesson_plan_attachments WHERE id = ?', [id]) as any[];

    if (attachments.length === 0) {
      throw createError('Attachment not found', 404);
    }

    await db.execute('DELETE FROM lesson_plan_attachments WHERE id = ?', [id]);

    // TODO: Delete physical file from filesystem

    res.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

