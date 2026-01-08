import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// ========== Question Bank ==========

export const getQuestionBank = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { subject_id } = req.query;

    let query = `
      SELECT qb.*, s.name as subject_name, s.code as subject_code
      FROM question_bank qb
      INNER JOIN subjects s ON qb.subject_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subject_id) {
      query += ' AND qb.subject_id = ?';
      params.push(subject_id);
    }

    query += ' ORDER BY qb.created_at DESC';

    const [questions] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [questions] = await db.execute(
      `SELECT qb.*, s.name as subject_name, s.code as subject_code
       FROM question_bank qb
       INNER JOIN subjects s ON qb.subject_id = s.id
       WHERE qb.id = ?`,
      [id]
    ) as any[];

    if (questions.length === 0) {
      throw createError('Question not found', 404);
    }

    res.json({
      success: true,
      data: questions[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject_id, question, option_a, option_b, option_c, option_d, option_e, correct_answer, marks } = req.body;

    if (!subject_id || !question || !correct_answer) {
      throw createError('Subject, question, and correct answer are required', 400);
    }

    const db = getDatabase();

    await db.execute(
      `INSERT INTO question_bank (subject_id, question, option_a, option_b, option_c, option_d, option_e, correct_answer, marks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subject_id,
        question.trim(),
        option_a?.trim() || null,
        option_b?.trim() || null,
        option_c?.trim() || null,
        option_d?.trim() || null,
        option_e?.trim() || null,
        correct_answer.toUpperCase(),
        marks || 1.00,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      next(createError('Question already exists', 409));
    } else {
      next(error);
    }
  }
};

export const updateQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { subject_id, question, option_a, option_b, option_c, option_d, option_e, correct_answer, marks } = req.body;

    if (!subject_id || !question || !correct_answer) {
      throw createError('Subject, question, and correct answer are required', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      `UPDATE question_bank
       SET subject_id = ?, question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, option_e = ?, correct_answer = ?, marks = ?
       WHERE id = ?`,
      [
        subject_id,
        question.trim(),
        option_a?.trim() || null,
        option_b?.trim() || null,
        option_c?.trim() || null,
        option_d?.trim() || null,
        option_e?.trim() || null,
        correct_answer.toUpperCase(),
        marks || 1.00,
        id,
      ]
    ) as any[];

    if (result.affectedRows === 0) {
      throw createError('Question not found', 404);
    }

    res.json({
      success: true,
      message: 'Question updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [result] = await db.execute('DELETE FROM question_bank WHERE id = ?', [id]) as any[];

    if (result.affectedRows === 0) {
      throw createError('Question not found', 404);
    }

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Online Exams ==========

export const getOnlineExams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { session_id, subject_id, class_id, is_published } = req.query;

    let query = `
      SELECT oe.*,
             s.name as subject_name, s.code as subject_code,
             sess.name as session_name,
             c.name as class_name,
             sec.name as section_name,
             u.name as created_by_name
      FROM online_exams oe
      INNER JOIN subjects s ON oe.subject_id = s.id
      INNER JOIN sessions sess ON oe.session_id = sess.id
      LEFT JOIN classes c ON oe.class_id = c.id
      LEFT JOIN sections sec ON oe.section_id = sec.id
      LEFT JOIN users u ON oe.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (session_id) {
      query += ' AND oe.session_id = ?';
      params.push(session_id);
    }
    if (subject_id) {
      query += ' AND oe.subject_id = ?';
      params.push(subject_id);
    }
    if (class_id) {
      query += ' AND oe.class_id = ?';
      params.push(class_id);
    }
    if (is_published !== undefined) {
      query += ' AND oe.is_published = ?';
      params.push(is_published === 'true' ? 1 : 0);
    }

    query += ' ORDER BY oe.created_at DESC';

    const [exams] = await db.execute(query, params) as any[];

    // Format dates for frontend
    const formattedExams = exams.map((exam: any) => {
      if (exam.exam_date) {
        // MySQL DATE type returns as string 'YYYY-MM-DD', handle it directly
        if (exam.exam_date instanceof Date) {
          // If it's a Date object, format it as YYYY-MM-DD without timezone conversion
          const year = exam.exam_date.getFullYear();
          const month = String(exam.exam_date.getMonth() + 1).padStart(2, '0');
          const day = String(exam.exam_date.getDate()).padStart(2, '0');
          exam.exam_date = `${year}-${month}-${day}`;
        } else {
          // If it's a string, just get the date part (YYYY-MM-DD)
          exam.exam_date = String(exam.exam_date).split('T')[0].split(' ')[0];
        }
      }
      if (exam.exam_time_from) {
        exam.exam_time_from = exam.exam_time_from instanceof Date
          ? exam.exam_time_from.toTimeString().slice(0, 5)
          : String(exam.exam_time_from).split('T').pop()?.split('.')[0]?.slice(0, 5) || String(exam.exam_time_from);
      }
      if (exam.exam_time_to) {
        exam.exam_time_to = exam.exam_time_to instanceof Date
          ? exam.exam_time_to.toTimeString().slice(0, 5)
          : String(exam.exam_time_to).split('T').pop()?.split('.')[0]?.slice(0, 5) || String(exam.exam_time_to);
      }
      return exam;
    });

    res.json({
      success: true,
      data: formattedExams,
    });
  } catch (error) {
    next(error);
  }
};

export const getOnlineExamById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [exams] = await db.execute(
      `SELECT oe.*,
              s.name as subject_name, s.code as subject_code,
              sess.name as session_name,
              c.name as class_name,
              sec.name as section_name
       FROM online_exams oe
       INNER JOIN subjects s ON oe.subject_id = s.id
       INNER JOIN sessions sess ON oe.session_id = sess.id
       LEFT JOIN classes c ON oe.class_id = c.id
       LEFT JOIN sections sec ON oe.section_id = sec.id
       WHERE oe.id = ?`,
      [id]
    ) as any[];

    if (exams.length === 0) {
      throw createError('Online exam not found', 404);
    }

    const exam = exams[0];

    // Format dates for frontend (convert MySQL date/datetime to ISO string)
    if (exam.exam_date) {
      // Handle both Date objects and string dates from MySQL
      if (exam.exam_date instanceof Date) {
        // Format as YYYY-MM-DD without timezone conversion
        const year = exam.exam_date.getFullYear();
        const month = String(exam.exam_date.getMonth() + 1).padStart(2, '0');
        const day = String(exam.exam_date.getDate()).padStart(2, '0');
        exam.exam_date = `${year}-${month}-${day}`;
      } else {
        // MySQL returns dates as strings in format 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'
        const dateStr = String(exam.exam_date);
        exam.exam_date = dateStr.split('T')[0].split(' ')[0]; // Get just the date part
      }
    }
    if (exam.exam_time_from) {
      if (exam.exam_time_from instanceof Date) {
        exam.exam_time_from = exam.exam_time_from.toTimeString().slice(0, 5);
      } else {
        // MySQL returns time as string in format 'HH:MM:SS' or 'HH:MM'
        const timeStr = String(exam.exam_time_from);
        const timePart = timeStr.split('T').pop()?.split('.')[0] || timeStr;
        exam.exam_time_from = timePart.slice(0, 5); // Get HH:MM format
      }
    }
    if (exam.exam_time_to) {
      if (exam.exam_time_to instanceof Date) {
        exam.exam_time_to = exam.exam_time_to.toTimeString().slice(0, 5);
      } else {
        // MySQL returns time as string in format 'HH:MM:SS' or 'HH:MM'
        const timeStr = String(exam.exam_time_to);
        const timePart = timeStr.split('T').pop()?.split('.')[0] || timeStr;
        exam.exam_time_to = timePart.slice(0, 5); // Get HH:MM format
      }
    }

    // Get questions
    const [questions] = await db.execute(
      `SELECT oeq.*, qb.question, qb.option_a, qb.option_b, qb.option_c, qb.option_d, qb.option_e, qb.correct_answer
       FROM online_exam_questions oeq
       INNER JOIN question_bank qb ON oeq.question_id = qb.id
       WHERE oeq.online_exam_id = ?
       ORDER BY oeq.display_order ASC, oeq.id ASC`,
      [id]
    ) as any[];

    // Get assigned students
    const [students] = await db.execute(
      `SELECT oes.*, st.admission_no, st.first_name, st.last_name, st.roll_no
       FROM online_exam_students oes
       INNER JOIN students st ON oes.student_id = st.id
       WHERE oes.online_exam_id = ?
       ORDER BY st.admission_no ASC`,
      [id]
    ) as any[];

    res.json({
      success: true,
      data: {
        ...exam,
        questions: questions,
        students: students,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createOnlineExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      subject_id,
      session_id,
      class_id,
      section_id,
      exam_date,
      exam_time_from,
      exam_time_to,
      duration_minutes,
      total_marks,
      passing_marks,
      instructions,
      is_published,
    } = req.body;

    if (!name || !subject_id || !session_id) {
      throw createError('Name, subject, and session are required', 400);
    }

    const db = getDatabase();
    const userId = (req as any).user?.id;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Insert exam
      const [result] = await connection.execute(
        `INSERT INTO online_exams
         (name, subject_id, session_id, class_id, section_id, exam_date, exam_time_from, exam_time_to,
          duration_minutes, total_marks, passing_marks, instructions, is_published, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name.trim(),
          subject_id,
          session_id,
          class_id || null,
          section_id || null,
          exam_date ? (exam_date.trim() || null) : null,
          exam_time_from ? (exam_time_from.trim() || null) : null,
          exam_time_to ? (exam_time_to.trim() || null) : null,
          duration_minutes || 60,
          total_marks || 0,
          passing_marks || 0,
          instructions || null,
          is_published ? 1 : 0,
          userId || null,
        ]
      ) as any[];

      const examId = result.insertId;

      // Auto-assign students if class_id and section_id are provided
      if (class_id && section_id && session_id) {
        // Get all active students from the specified class, section, and session
        const [students] = await connection.execute(
          `SELECT id FROM students 
           WHERE class_id = ? AND section_id = ? AND session_id = ? AND is_active = 1`,
          [class_id, section_id, session_id]
        ) as any[];

        // Assign all students to the exam
        if (students.length > 0) {
          const studentIds = students.map((s: any) => s.id);
          const placeholders = studentIds.map(() => '(?, ?)').join(', ');
          const values = studentIds.flatMap((studentId: number) => [examId, studentId]);
          
          await connection.execute(
            `INSERT INTO online_exam_students (online_exam_id, student_id) VALUES ${placeholders}`,
            values
          );
        }
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Online exam created successfully',
        data: { id: examId },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
};

export const updateOnlineExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      subject_id,
      session_id,
      class_id,
      section_id,
      exam_date,
      exam_time_from,
      exam_time_to,
      duration_minutes,
      total_marks,
      passing_marks,
      instructions,
      is_published,
      is_active,
    } = req.body;

    if (!name || !subject_id || !session_id) {
      throw createError('Name, subject, and session are required', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      `UPDATE online_exams
       SET name = ?, subject_id = ?, session_id = ?, class_id = ?, section_id = ?,
           exam_date = ?, exam_time_from = ?, exam_time_to = ?, duration_minutes = ?,
           total_marks = ?, passing_marks = ?, instructions = ?, is_published = ?, is_active = ?
       WHERE id = ?`,
      [
        name.trim(),
        subject_id,
        session_id,
        class_id || null,
        section_id || null,
        exam_date ? (exam_date.trim() || null) : null,
        exam_time_from ? (exam_time_from.trim() || null) : null,
        exam_time_to ? (exam_time_to.trim() || null) : null,
        duration_minutes || 60,
        total_marks || 0,
        passing_marks || 0,
        instructions || null,
        is_published ? 1 : 0,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        id,
      ]
    ) as any[];

    if (result.affectedRows === 0) {
      throw createError('Online exam not found', 404);
    }

    // Fetch and return the updated exam to ensure correct date formatting
    const [updatedExams] = await db.execute(
      `SELECT oe.*,
              s.name as subject_name, s.code as subject_code,
              sess.name as session_name,
              c.name as class_name,
              sec.name as section_name
       FROM online_exams oe
       INNER JOIN subjects s ON oe.subject_id = s.id
       INNER JOIN sessions sess ON oe.session_id = sess.id
       LEFT JOIN classes c ON oe.class_id = c.id
       LEFT JOIN sections sec ON oe.section_id = sec.id
       WHERE oe.id = ?`,
      [id]
    ) as any[];

    if (updatedExams.length === 0) {
      throw createError('Failed to fetch updated exam', 500);
    }

    const updatedExam = updatedExams[0];

    // Format dates for frontend
    if (updatedExam.exam_date) {
      if (updatedExam.exam_date instanceof Date) {
        // Format as YYYY-MM-DD without timezone conversion
        const year = updatedExam.exam_date.getFullYear();
        const month = String(updatedExam.exam_date.getMonth() + 1).padStart(2, '0');
        const day = String(updatedExam.exam_date.getDate()).padStart(2, '0');
        updatedExam.exam_date = `${year}-${month}-${day}`;
      } else {
        const dateStr = String(updatedExam.exam_date);
        updatedExam.exam_date = dateStr.split('T')[0].split(' ')[0];
      }
    }
    if (updatedExam.exam_time_from) {
      if (updatedExam.exam_time_from instanceof Date) {
        updatedExam.exam_time_from = updatedExam.exam_time_from.toTimeString().slice(0, 5);
      } else {
        const timeStr = String(updatedExam.exam_time_from);
        const timePart = timeStr.split('T').pop()?.split('.')[0] || timeStr;
        updatedExam.exam_time_from = timePart.slice(0, 5);
      }
    }
    if (updatedExam.exam_time_to) {
      if (updatedExam.exam_time_to instanceof Date) {
        updatedExam.exam_time_to = updatedExam.exam_time_to.toTimeString().slice(0, 5);
      } else {
        const timeStr = String(updatedExam.exam_time_to);
        const timePart = timeStr.split('T').pop()?.split('.')[0] || timeStr;
        updatedExam.exam_time_to = timePart.slice(0, 5);
      }
    }

    res.json({
      success: true,
      message: 'Online exam updated successfully',
      data: updatedExam,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOnlineExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [result] = await db.execute('DELETE FROM online_exams WHERE id = ?', [id]) as any[];

    if (result.affectedRows === 0) {
      throw createError('Online exam not found', 404);
    }

    res.json({
      success: true,
      message: 'Online exam deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Online Exam Questions ==========

export const addQuestionToExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { online_exam_id } = req.params;
    const { question_id, marks, display_order } = req.body;

    if (!online_exam_id || !question_id) {
      throw createError('Exam ID and question ID are required', 400);
    }

    const db = getDatabase();

    // Get the marks from the question if not provided
    let questionMarks = marks;
    if (!questionMarks) {
      const [questionData] = await db.execute(
        'SELECT marks FROM question_bank WHERE id = ?',
        [question_id]
      ) as any[];
      
      if (questionData.length > 0) {
        questionMarks = questionData[0].marks || 1.00;
      } else {
        questionMarks = 1.00;
      }
    }

    // Get the next display order if not provided
    let nextDisplayOrder = display_order;
    if (nextDisplayOrder === undefined || nextDisplayOrder === null) {
      const [maxOrder] = await db.execute(
        'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM online_exam_questions WHERE online_exam_id = ?',
        [online_exam_id]
      ) as any[];
      nextDisplayOrder = maxOrder[0]?.next_order || 1;
    }

    await db.execute(
      `INSERT INTO online_exam_questions (online_exam_id, question_id, marks, display_order)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE marks = ?, display_order = ?`,
      [
        online_exam_id,
        question_id,
        questionMarks,
        nextDisplayOrder,
        questionMarks,
        nextDisplayOrder,
      ]
    );

    // Update total marks
    const [totalMarks] = await db.execute(
      `SELECT SUM(marks) as total FROM online_exam_questions WHERE online_exam_id = ?`,
      [online_exam_id]
    ) as any[];

    await db.execute('UPDATE online_exams SET total_marks = ? WHERE id = ?', [
      totalMarks[0].total || 0,
      online_exam_id,
    ]);

    res.json({
      success: true,
      message: 'Question added to exam successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const removeQuestionFromExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { online_exam_id, question_id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM online_exam_questions WHERE online_exam_id = ? AND question_id = ?', [
      online_exam_id,
      question_id,
    ]);

    // Update total marks
    const [totalMarks] = await db.execute(
      `SELECT SUM(marks) as total FROM online_exam_questions WHERE online_exam_id = ?`,
      [online_exam_id]
    ) as any[];

    await db.execute('UPDATE online_exams SET total_marks = ? WHERE id = ?', [
      totalMarks[0].total || 0,
      online_exam_id,
    ]);

    res.json({
      success: true,
      message: 'Question removed from exam successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Online Exam Students ==========

export const assignStudentsToExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { online_exam_id, student_ids } = req.body;

    if (!online_exam_id || !Array.isArray(student_ids) || student_ids.length === 0) {
      throw createError('Exam ID and student IDs array are required', 400);
    }

    const db = getDatabase();

    // Remove existing assignments
    await db.execute('DELETE FROM online_exam_students WHERE online_exam_id = ?', [online_exam_id]);

    // Insert new assignments
    const values = student_ids.map((student_id: number) => [online_exam_id, student_id]);
    if (values.length > 0) {
      const placeholders = values.map(() => '(?, ?)').join(', ');
      const flatValues = values.flat();
      await db.execute(
        `INSERT INTO online_exam_students (online_exam_id, student_id) VALUES ${placeholders}`,
        flatValues
      );
    }

    res.json({
      success: true,
      message: 'Students assigned to exam successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const removeStudentFromExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { online_exam_id, student_id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM online_exam_students WHERE online_exam_id = ? AND student_id = ?', [
      online_exam_id,
      student_id,
    ]);

    res.json({
      success: true,
      message: 'Student removed from exam successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Student Online Exams ==========

// Get online exams assigned to the current student
export const getMyOnlineExams = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const db = getDatabase();

    // Find student by user_id
    const [students] = await db.execute(
      `SELECT id, class_id, section_id, session_id FROM students WHERE user_id = ? AND is_active = 1`,
      [req.user.id]
    ) as any[];

    if (students.length === 0) {
      throw createError('Student profile not found', 404);
    }

    const student = students[0];
    
    // Validate student has required data
    if (!student.class_id || !student.section_id || !student.session_id) {
      res.json({
        success: true,
        data: [],
        message: 'Student profile is incomplete. Please contact administrator.',
      });
      return;
    }

    // Get online exams assigned to this student - use explicit columns to avoid field errors
    const query = `
      SELECT DISTINCT oe.id, oe.name, oe.subject_id, oe.class_id, oe.section_id, oe.session_id,
             oe.exam_date, oe.exam_time_from, oe.exam_time_to, oe.duration_minutes,
             oe.total_marks, oe.passing_marks, oe.instructions, oe.is_published, oe.is_active,
             oe.created_at, oe.updated_at, oe.created_by,
             s.name as subject_name, s.code as subject_code,
             sess.name as session_name,
             c.name as class_name,
             sec.name as section_name,
             (SELECT COUNT(*) FROM online_exam_attempts oea 
              WHERE oea.online_exam_id = oe.id 
              AND oea.student_id = ? 
              AND oea.status = 'in_progress') as has_in_progress_attempt,
             (SELECT COUNT(*) FROM online_exam_attempts oea 
              WHERE oea.online_exam_id = oe.id 
              AND oea.student_id = ? 
              AND oea.status = 'submitted') as has_submitted_attempt
      FROM online_exams oe
      INNER JOIN online_exam_students oes ON oe.id = oes.online_exam_id
      INNER JOIN subjects s ON oe.subject_id = s.id
      INNER JOIN sessions sess ON oe.session_id = sess.id
      LEFT JOIN classes c ON oe.class_id = c.id
      LEFT JOIN sections sec ON oe.section_id = sec.id
      WHERE oes.student_id = ?
        AND oe.is_published = 1
        AND oe.is_active = 1
        AND (oe.class_id IS NULL OR oe.class_id = ?)
        AND (oe.section_id IS NULL OR oe.section_id = ?)
        AND oe.session_id = ?
      ORDER BY oe.exam_date ASC, oe.exam_time_from ASC
    `;

    const [exams] = await db.execute(query, [
      student.id,
      student.id,
      student.id,
      student.class_id,
      student.section_id,
      student.session_id,
    ]) as any[];

    // Format dates for frontend
    const formattedExams = exams.map((exam: any) => {
      if (exam.exam_date) {
        // MySQL DATE type returns as string 'YYYY-MM-DD', handle it directly
        if (exam.exam_date instanceof Date) {
          // If it's a Date object, format it as YYYY-MM-DD without timezone conversion
          const year = exam.exam_date.getFullYear();
          const month = String(exam.exam_date.getMonth() + 1).padStart(2, '0');
          const day = String(exam.exam_date.getDate()).padStart(2, '0');
          exam.exam_date = `${year}-${month}-${day}`;
        } else {
          // If it's a string, just get the date part (YYYY-MM-DD)
          exam.exam_date = String(exam.exam_date).split('T')[0].split(' ')[0];
        }
      }
      if (exam.exam_time_from) {
        exam.exam_time_from = exam.exam_time_from instanceof Date
          ? exam.exam_time_from.toTimeString().slice(0, 5)
          : String(exam.exam_time_from).split('T').pop()?.split('.')[0]?.slice(0, 5) || String(exam.exam_time_from);
      }
      if (exam.exam_time_to) {
        exam.exam_time_to = exam.exam_time_to instanceof Date
          ? exam.exam_time_to.toTimeString().slice(0, 5)
          : String(exam.exam_time_to).split('T').pop()?.split('.')[0]?.slice(0, 5) || String(exam.exam_time_to);
      }
      return exam;
    });

    res.json({
      success: true,
      data: formattedExams,
    });
  } catch (error) {
    next(error);
  }
};

// Start an exam attempt
export const startExamAttempt = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { online_exam_id } = req.params;
    const db = getDatabase();

    // Find student by user_id
    const [students] = await db.execute(
      `SELECT id FROM students WHERE user_id = ? AND is_active = 1`,
      [req.user.id]
    ) as any[];

    if (students.length === 0) {
      throw createError('Student profile not found', 404);
    }

    const student = students[0];

    // Check if exam exists and is accessible
    const [exams] = await db.execute(
      `SELECT oe.*, s.name as subject_name
       FROM online_exams oe
       INNER JOIN online_exam_students oes ON oe.id = oes.online_exam_id
       INNER JOIN subjects s ON oe.subject_id = s.id
       WHERE oe.id = ? AND oes.student_id = ? AND oe.is_published = 1 AND oe.is_active = 1`,
      [online_exam_id, student.id]
    ) as any[];

    if (exams.length === 0) {
      throw createError('Exam not found or not accessible', 404);
    }

    const exam = exams[0];

    // Check if exam is within time window (only if all time fields are set)
    // If time constraints are not set, allow starting the exam
    const now = new Date();
    if (exam.exam_date && exam.exam_time_from && exam.exam_time_to) {
      try {
        // Parse exam date - get YYYY-MM-DD format
        let examDateStr: string;
        if (exam.exam_date instanceof Date) {
          const year = exam.exam_date.getFullYear();
          const month = String(exam.exam_date.getMonth() + 1).padStart(2, '0');
          const day = String(exam.exam_date.getDate()).padStart(2, '0');
          examDateStr = `${year}-${month}-${day}`;
        } else {
          examDateStr = String(exam.exam_date).split('T')[0].split(' ')[0];
        }
        
        // Parse time strings - ensure HH:MM:SS format
        let timeFromStr = String(exam.exam_time_from).split('T').pop()?.split('.')[0] || String(exam.exam_time_from);
        let timeToStr = String(exam.exam_time_to).split('T').pop()?.split('.')[0] || String(exam.exam_time_to);
        
        // Ensure time format is HH:MM:SS (add seconds if missing)
        if (timeFromStr.length === 5) timeFromStr += ':00';
        if (timeToStr.length === 5) timeToStr += ':00';
        
        // Create date objects using local time (not UTC) to avoid timezone issues
        // Parse date and time components separately
        const [year, month, day] = examDateStr.split('-').map(Number);
        const [fromHours, fromMinutes, fromSeconds = 0] = timeFromStr.split(':').map(Number);
        const [toHours, toMinutes, toSeconds = 0] = timeToStr.split(':').map(Number);
        
        const examTimeFrom = new Date(year, month - 1, day, fromHours, fromMinutes, fromSeconds);
        const examTimeTo = new Date(year, month - 1, day, toHours, toMinutes, toSeconds);
        
        // Only validate if dates are valid
        if (!isNaN(examTimeFrom.getTime()) && !isNaN(examTimeTo.getTime())) {
          // For development/testing: Allow a 30-minute grace period after exam end time
          // In production, you may want to reduce this to 5-10 minutes
          const gracePeriod = 30 * 60 * 1000; // 30 minutes in milliseconds
          
          if (now < examTimeFrom) {
            const startTimeStr = examTimeFrom.toLocaleString('en-US', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            });
            throw createError(`Exam has not started yet. Exam starts at ${startTimeStr}`, 400);
          }
          // Only check expiry if exam end time + grace period has passed
          if (now > new Date(examTimeTo.getTime() + gracePeriod)) {
            const endTimeStr = examTimeTo.toLocaleString('en-US', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            });
            throw createError(`Exam time has expired. Exam ended at ${endTimeStr}`, 400);
          }
        }
      } catch (error: any) {
        // If it's our custom error, re-throw it
        if (error.message && (error.message.includes('not started') || error.message.includes('expired'))) {
          throw error;
        }
        // If date parsing fails, allow the exam to start (time constraints might be invalid)
        console.warn('Error parsing exam time constraints:', error);
      }
    }
    // If no time constraints are set, allow starting the exam

    // Check if student has already attempted this exam (any status except in_progress)
    const [previousAttempts] = await db.execute(
      `SELECT id, status, submitted_at FROM online_exam_attempts 
       WHERE online_exam_id = ? AND student_id = ? AND status != 'in_progress'
       ORDER BY submitted_at DESC LIMIT 1`,
      [online_exam_id, student.id]
    ) as any[];

    if (previousAttempts.length > 0) {
      throw createError('You have already attempted this exam and cannot retake it.', 403);
    }

    // Check if there's an existing in-progress attempt
    const [existingAttempts] = await db.execute(
      `SELECT id, started_at FROM online_exam_attempts 
       WHERE online_exam_id = ? AND student_id = ? AND status = 'in_progress'
       ORDER BY started_at DESC LIMIT 1`,
      [online_exam_id, student.id]
    ) as any[];

    let attemptId: number;
    let startedAt: Date;

    if (existingAttempts.length > 0) {
      // Resume existing attempt
      attemptId = existingAttempts[0].id;
      startedAt = new Date(existingAttempts[0].started_at);
    } else {
      // Create new attempt
      const [result] = await db.execute(
        `INSERT INTO online_exam_attempts (online_exam_id, student_id, started_at, status)
         VALUES (?, ?, NOW(), 'in_progress')`,
        [online_exam_id, student.id]
      ) as any;
      attemptId = result.insertId;
      startedAt = new Date();
    }

    // Get questions for this exam
    const [questions] = await db.execute(
      `SELECT oeq.*, qb.question, qb.option_a, qb.option_b, qb.option_c, qb.option_d, qb.option_e, qb.correct_answer
       FROM online_exam_questions oeq
       INNER JOIN question_bank qb ON oeq.question_id = qb.id
       WHERE oeq.online_exam_id = ?
       ORDER BY oeq.display_order ASC, oeq.id ASC`,
      [online_exam_id]
    ) as any[];

    // Get existing answers
    const [answers] = await db.execute(
      `SELECT question_id, selected_answer FROM online_exam_answers WHERE attempt_id = ?`,
      [attemptId]
    ) as any[];

    const answersMap = new Map(answers.map((a: any) => [a.question_id, a.selected_answer]));

    // Calculate remaining time
    const examStartTime = new Date(startedAt);
    const examEndTime = new Date(examStartTime.getTime() + exam.duration_minutes * 60 * 1000);
    const remainingSeconds = Math.max(0, Math.floor((examEndTime.getTime() - now.getTime()) / 1000));

    res.json({
      success: true,
      data: {
        attempt_id: attemptId,
        exam: {
          id: exam.id,
          name: exam.name,
          subject_name: exam.subject_name,
          duration_minutes: exam.duration_minutes,
          total_marks: exam.total_marks,
          instructions: exam.instructions,
        },
        questions: questions.map((q: any) => ({
          id: q.question_id,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          option_e: q.option_e,
          marks: q.marks,
          display_order: q.display_order,
          selected_answer: answersMap.get(q.question_id) || '',
        })),
        started_at: startedAt,
        remaining_seconds: remainingSeconds,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Save answer
export const saveAnswer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { attempt_id } = req.params;
    const { question_id, selected_answer } = req.body;

    if (!question_id || selected_answer === undefined || selected_answer === null) {
      throw createError('Question ID and selected answer are required', 400);
    }

    const db = getDatabase();

    // Verify attempt belongs to student
    const [students] = await db.execute(
      `SELECT id FROM students WHERE user_id = ? AND is_active = 1`,
      [req.user.id]
    ) as any[];

    if (students.length === 0) {
      throw createError('Student profile not found', 404);
    }

    const student = students[0];

    const [attempts] = await db.execute(
      `SELECT id, status FROM online_exam_attempts WHERE id = ? AND student_id = ?`,
      [attempt_id, student.id]
    ) as any[];

    if (attempts.length === 0) {
      throw createError('Attempt not found', 404);
    }

    if (attempts[0].status !== 'in_progress') {
      throw createError('Exam attempt is not in progress', 400);
    }

    // Get question details to check correct answer
    const [questions] = await db.execute(
      `SELECT correct_answer, marks FROM question_bank WHERE id = ?`,
      [question_id]
    ) as any[];

    if (questions.length === 0) {
      throw createError('Question not found', 404);
    }

    const question = questions[0];
    const isCorrect = question.correct_answer === selected_answer;
    const marksObtained = isCorrect ? question.marks : 0;

    // Save or update answer (allow empty string for clearing answer)
    await db.execute(
      `INSERT INTO online_exam_answers (attempt_id, question_id, selected_answer, is_correct, marks_obtained)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       selected_answer = VALUES(selected_answer),
       is_correct = VALUES(is_correct),
       marks_obtained = VALUES(marks_obtained),
       updated_at = NOW()`,
      [attempt_id, question_id, selected_answer || '', isCorrect ? 1 : 0, marksObtained]
    );

    res.json({
      success: true,
      message: 'Answer saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Submit exam
export const submitExam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { attempt_id } = req.params;
    const db = getDatabase();

    // Verify attempt belongs to student
    const [students] = await db.execute(
      `SELECT id FROM students WHERE user_id = ? AND is_active = 1`,
      [req.user.id]
    ) as any[];

    if (students.length === 0) {
      throw createError('Student profile not found', 404);
    }

    const student = students[0];

    const [attempts] = await db.execute(
      `SELECT id, online_exam_id, started_at, status FROM online_exam_attempts WHERE id = ? AND student_id = ?`,
      [attempt_id, student.id]
    ) as any[];

    if (attempts.length === 0) {
      throw createError('Attempt not found', 404);
    }

    const attempt = attempts[0];

    if (attempt.status !== 'in_progress') {
      throw createError('Exam has already been submitted', 400);
    }

    // Calculate total marks and obtained marks
    const [answers] = await db.execute(
      `SELECT SUM(marks_obtained) as obtained_marks FROM online_exam_answers WHERE attempt_id = ?`,
      [attempt_id]
    ) as any[];

    const obtainedMarks = answers[0]?.obtained_marks || 0;

    // Get exam total marks
    const [exams] = await db.execute(
      `SELECT total_marks FROM online_exams WHERE id = ?`,
      [attempt.online_exam_id]
    ) as any[];

    const totalMarks = exams[0]?.total_marks || 0;
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

    // Calculate time taken
    const startedAt = new Date(attempt.started_at);
    const submittedAt = new Date();
    const timeTakenMinutes = Math.floor((submittedAt.getTime() - startedAt.getTime()) / (1000 * 60));

    // Update attempt
    await db.execute(
      `UPDATE online_exam_attempts 
       SET submitted_at = NOW(), 
           time_taken_minutes = ?,
           total_marks = ?,
           obtained_marks = ?,
           percentage = ?,
           status = 'submitted'
       WHERE id = ?`,
      [timeTakenMinutes, totalMarks, obtainedMarks, percentage, attempt_id]
    );

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        obtained_marks: obtainedMarks,
        total_marks: totalMarks,
        percentage: percentage.toFixed(2),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Terminate exam (due to window switch or other violations)
export const terminateExam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { attempt_id } = req.params;
    const db = getDatabase();

    // Verify attempt belongs to student
    const [students] = await db.execute(
      `SELECT id FROM students WHERE user_id = ? AND is_active = 1`,
      [req.user.id]
    ) as any[];

    if (students.length === 0) {
      throw createError('Student profile not found', 404);
    }

    const student = students[0];

    const [attempts] = await db.execute(
      `SELECT id, status FROM online_exam_attempts WHERE id = ? AND student_id = ?`,
      [attempt_id, student.id]
    ) as any[];

    if (attempts.length === 0) {
      throw createError('Attempt not found', 404);
    }

    if (attempts[0].status !== 'in_progress') {
      throw createError('Exam is not in progress', 400);
    }

    // Calculate marks before terminating
    const [answers] = await db.execute(
      `SELECT SUM(marks_obtained) as obtained_marks FROM online_exam_answers WHERE attempt_id = ?`,
      [attempt_id]
    ) as any[];

    const obtainedMarks = answers[0]?.obtained_marks || 0;

    const [exams] = await db.execute(
      `SELECT total_marks FROM online_exams WHERE id = (SELECT online_exam_id FROM online_exam_attempts WHERE id = ?)`,
      [attempt_id]
    ) as any[];

    const totalMarks = exams[0]?.total_marks || 0;
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

    // Update attempt status to submitted (terminated)
    await db.execute(
      `UPDATE online_exam_attempts 
       SET submitted_at = NOW(), 
           total_marks = ?,
           obtained_marks = ?,
           percentage = ?,
           status = 'submitted'
       WHERE id = ?`,
      [totalMarks, obtainedMarks, percentage, attempt_id]
    );

    res.json({
      success: true,
      message: 'Exam terminated successfully',
    });
  } catch (error) {
    next(error);
  }
};

