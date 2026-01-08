import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/homework');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for homework attachments
    cb(null, true);
  },
});

// ========== Homework ==========

export const getHomework = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { class_id, section_id, subject_id, session_id, student_id } = req.query;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role_name;

    let query = `
      SELECT h.*,
             c.name as class_name,
             s.name as section_name,
             sub.name as subject_name, sub.code as subject_code,
             sg.name as subject_group_name,
             u.name as created_by_name,
             (SELECT MAX(he.evaluation_date) 
              FROM homework_evaluations he 
              WHERE he.homework_id = h.id 
              AND he.is_completed = 1) as evaluation_date
      FROM homework h
      INNER JOIN classes c ON h.class_id = c.id
      INNER JOIN sections s ON h.section_id = s.id
      INNER JOIN subjects sub ON h.subject_id = sub.id
      LEFT JOIN subject_groups sg ON h.subject_group_id = sg.id
      LEFT JOIN users u ON h.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (class_id) {
      query += ' AND h.class_id = ?';
      params.push(class_id);
    }
    if (section_id) {
      query += ' AND h.section_id = ?';
      params.push(section_id);
    }
    if (subject_id) {
      query += ' AND h.subject_id = ?';
      params.push(subject_id);
    }
    if (session_id) {
      // Filter by session through class
      query += ' AND c.session_id = ?';
      params.push(session_id);
    }

    query += ' ORDER BY h.homework_date DESC, h.created_at DESC';

    const [homework] = await db.execute(query, params) as any[];

    // Get evaluations for each homework
    // For students, only get their own evaluation
    // For others (admin/teacher), get all evaluations
    const homeworkWithEvaluations = await Promise.all(
      (homework || []).map(async (hw: any) => {
        let evaluationQuery = `
          SELECT he.id, he.homework_id, he.student_id, he.is_completed, 
                 he.evaluation_date, he.remarks, he.marks, he.evaluated_by,
                 he.created_at, he.updated_at,
                 st.admission_no, st.first_name, st.last_name, st.roll_no,
                 ev.name as evaluated_by_name
          FROM homework_evaluations he
          INNER JOIN students st ON he.student_id = st.id
          LEFT JOIN users ev ON he.evaluated_by = ev.id
          WHERE he.homework_id = ?
        `;
        const evaluationParams: any[] = [hw.id];

        // If student role, filter by student_id
        if (userRole === 'student' && userId) {
          // Get student_id from students table using user_id
          const [studentUser] = await db.execute(
            'SELECT id FROM students WHERE user_id = ?',
            [userId]
          ) as any[];
          
          if (studentUser.length > 0) {
            evaluationQuery += ' AND he.student_id = ?';
            evaluationParams.push(studentUser[0].id);
          } else {
            // If student not found, return empty evaluations but still return the homework
            return {
              ...hw,
              evaluations: [],
            };
          }
        } else if (student_id) {
          // If student_id is provided in query (for parent view)
          evaluationQuery += ' AND he.student_id = ?';
          evaluationParams.push(student_id);
        }

        evaluationQuery += ' ORDER BY st.admission_no ASC';

        let evaluations: any[] = [];
        try {
          const [evaluationResults] = await db.execute(evaluationQuery, evaluationParams) as any[];
          evaluations = Array.isArray(evaluationResults) ? evaluationResults : [];
        } catch (error) {
          console.error('Error fetching evaluations for homework', hw.id, error);
          evaluations = [];
        }

        // Always return evaluations field, even if empty
        const result = {
          ...hw,
          evaluations: evaluations,
        };
        
        return result;
      })
    );

    // Ensure all homework items have evaluations field
    const finalData = homeworkWithEvaluations.map((hw: any) => ({
      ...hw,
      evaluations: hw.evaluations || [],
    }));

    res.json({
      success: true,
      data: finalData,
    });
  } catch (error) {
    next(error);
  }
};

export const getHomeworkById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [homework] = await db.execute(
      `SELECT h.*,
              c.name as class_name,
              s.name as section_name,
              sub.name as subject_name, sub.code as subject_code,
              sg.name as subject_group_name,
              u.name as created_by_name
       FROM homework h
       INNER JOIN classes c ON h.class_id = c.id
       INNER JOIN sections s ON h.section_id = s.id
       INNER JOIN subjects sub ON h.subject_id = sub.id
       LEFT JOIN subject_groups sg ON h.subject_group_id = sg.id
       LEFT JOIN users u ON h.created_by = u.id
       WHERE h.id = ?`,
      [id]
    ) as any[];

    if (homework.length === 0) {
      throw createError('Homework not found', 404);
    }

    // Get evaluations
    const [evaluations] = await db.execute(
      `SELECT he.*,
              st.admission_no, st.first_name, st.last_name, st.roll_no,
              ev.name as evaluated_by_name
       FROM homework_evaluations he
       INNER JOIN students st ON he.student_id = st.id
       LEFT JOIN users ev ON he.evaluated_by = ev.id
       WHERE he.homework_id = ?
       ORDER BY st.admission_no ASC`,
      [id]
    ) as any[];

    res.json({
      success: true,
      data: {
        ...homework[0],
        evaluations: evaluations,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createHomework = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      class_id,
      section_id,
      subject_group_id,
      subject_id,
      homework_date,
      submission_date,
      title,
      description,
      attachment_url,
    } = req.body;

    if (!class_id || !section_id || !subject_id || !homework_date || !submission_date || !title) {
      throw createError('Class, section, subject, homework date, submission date, and title are required', 400);
    }

    const db = getDatabase();
    const userId = (req as any).user?.id;

    // Handle file upload if present
    let finalAttachmentUrl = attachment_url || null;
    const file = (req as any).file;
    if (file) {
      finalAttachmentUrl = `/uploads/homework/${file.filename}`;
    }

    await db.execute(
      `INSERT INTO homework
       (class_id, section_id, subject_group_id, subject_id, homework_date, submission_date, title, description, attachment_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        class_id,
        section_id,
        subject_group_id || null,
        subject_id,
        homework_date,
        submission_date,
        title.trim(),
        description?.trim() || null,
        finalAttachmentUrl,
        userId || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Homework created successfully',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      next(createError('Homework already exists', 409));
    } else {
      next(error);
    }
  }
};

export const updateHomework = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      class_id,
      section_id,
      subject_group_id,
      subject_id,
      homework_date,
      submission_date,
      title,
      description,
      attachment_url,
    } = req.body;

    if (!class_id || !section_id || !subject_id || !homework_date || !submission_date || !title) {
      throw createError('Class, section, subject, homework date, submission date, and title are required', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      `UPDATE homework
       SET class_id = ?, section_id = ?, subject_group_id = ?, subject_id = ?,
           homework_date = ?, submission_date = ?, title = ?, description = ?, attachment_url = ?
       WHERE id = ?`,
      [
        class_id,
        section_id,
        subject_group_id || null,
        subject_id,
        homework_date,
        submission_date,
        title.trim(),
        description?.trim() || null,
        attachment_url || null,
        id,
      ]
    ) as any[];

    if (result.affectedRows === 0) {
      throw createError('Homework not found', 404);
    }

    res.json({
      success: true,
      message: 'Homework updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHomework = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [result] = await db.execute('DELETE FROM homework WHERE id = ?', [id]) as any[];

    if (result.affectedRows === 0) {
      throw createError('Homework not found', 404);
    }

    res.json({
      success: true,
      message: 'Homework deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Homework Evaluations ==========

export const evaluateHomework = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { homework_id, student_ids, evaluation_date, student_remarks, student_statuses, marks } = req.body;

    if (!homework_id || !Array.isArray(student_ids) || student_ids.length === 0) {
      throw createError('Homework ID and student IDs array are required', 400);
    }

    const db = getDatabase();
    const userId = (req as any).user?.id;

    // Delete existing evaluations for this homework
    await db.execute('DELETE FROM homework_evaluations WHERE homework_id = ?', [homework_id]);

    // Insert new evaluations with per-student remarks and status
    if (student_ids.length > 0) {
      const values = student_ids.map((student_id: number) => {
        // Get remarks for this specific student
        let remarks = null;
        if (student_remarks) {
          if (typeof student_remarks === 'object' && !Array.isArray(student_remarks)) {
            const remarkValue = student_remarks[student_id];
            remarks = remarkValue && remarkValue.trim() ? remarkValue.trim() : null;
          } else if (Array.isArray(student_remarks)) {
            const studentRemark = student_remarks.find((r: any) => r.student_id === student_id);
            remarks = studentRemark?.remarks && studentRemark.remarks.trim() ? studentRemark.remarks.trim() : null;
          } else if (typeof student_remarks === 'string' && student_remarks.trim()) {
            remarks = student_remarks.trim();
          }
        }

        // Get status for this specific student
        let status = 'completed'; // Default
        if (student_statuses && typeof student_statuses === 'object' && !Array.isArray(student_statuses)) {
          status = student_statuses[student_id] || 'completed';
        }

        // Map status to is_completed: 'completed' = 1, others = 0
        const is_completed = status === 'completed' ? 1 : 0;

        // Include status in remarks if not completed (for display purposes)
        // This helps us retrieve the status later even if we don't have a separate status column
        let finalRemarks = remarks;
        if (status !== 'completed') {
          const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
          if (remarks && remarks.trim()) {
            finalRemarks = `[Status: ${statusLabel}] ${remarks}`;
          } else {
            finalRemarks = `Status: ${statusLabel}`;
          }
        }

        return [
          homework_id,
          student_id,
          is_completed,
          evaluation_date || new Date().toISOString().split('T')[0],
          finalRemarks || null,
          marks || null,
          userId || null,
        ];
      });

      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
      const flatValues = values.flat();

      await db.execute(
        `INSERT INTO homework_evaluations
         (homework_id, student_id, is_completed, evaluation_date, remarks, marks, evaluated_by)
         VALUES ${placeholders}`,
        flatValues
      );
    }

    res.json({
      success: true,
      message: 'Homework evaluated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateHomeworkEvaluation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_completed, evaluation_date, remarks, marks } = req.body;

    const db = getDatabase();
    const userId = (req as any).user?.id;

    const [result] = await db.execute(
      `UPDATE homework_evaluations
       SET is_completed = ?, evaluation_date = ?, remarks = ?, marks = ?, evaluated_by = ?
       WHERE id = ?`,
      [
        is_completed ? 1 : 0,
        evaluation_date || null,
        remarks || null,
        marks || null,
        userId || null,
        id,
      ]
    ) as any[];

    if (result.affectedRows === 0) {
      throw createError('Homework evaluation not found', 404);
    }

    res.json({
      success: true,
      message: 'Homework evaluation updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

