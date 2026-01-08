import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Get student's own exam result
export const getMyExamResult = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    // Get exam attempt
    const [attempts] = await db.execute(
      `SELECT oea.*, oe.name as exam_name, oe.total_marks, oe.passing_marks, oe.instructions,
              s.name as subject_name, s.code as subject_code
       FROM online_exam_attempts oea
       INNER JOIN online_exams oe ON oea.online_exam_id = oe.id
       INNER JOIN subjects s ON oe.subject_id = s.id
       WHERE oea.online_exam_id = ? AND oea.student_id = ? AND oea.status = 'submitted'
       ORDER BY oea.submitted_at DESC LIMIT 1`,
      [online_exam_id, student.id]
    ) as any[];

    if (attempts.length === 0) {
      throw createError('No submitted attempt found for this exam', 404);
    }

    const attempt = attempts[0];

    // Check if result is published (handle missing column gracefully)
    const [examCheck] = await db.execute(
      `SELECT COALESCE(is_result_published, 0) as is_result_published FROM online_exams WHERE id = ?`,
      [online_exam_id]
    ) as any[];

    if (examCheck.length === 0) {
      throw createError('Exam not found', 404);
    }

    // If column doesn't exist, COALESCE returns 0, so this check still works
    if (!examCheck[0].is_result_published) {
      throw createError('Result is not published yet', 403);
    }

    // Get all questions with student's answers
    const [questions] = await db.execute(
      `SELECT oeq.*, qb.question, qb.option_a, qb.option_b, qb.option_c, qb.option_d, qb.option_e, 
              qb.correct_answer, oea.selected_answer, oea.is_correct, oea.marks_obtained
       FROM online_exam_questions oeq
       INNER JOIN question_bank qb ON oeq.question_id = qb.id
       LEFT JOIN online_exam_answers oea ON oeq.question_id = oea.question_id AND oea.attempt_id = ?
       WHERE oeq.online_exam_id = ?
       ORDER BY oeq.display_order ASC, oeq.id ASC`,
      [attempt.id, online_exam_id]
    ) as any[];

    // Calculate statistics
    const totalQuestions = questions.length;
    const correctAnswers = questions.filter((q: any) => q.is_correct === 1).length;
    const wrongAnswers = totalQuestions - correctAnswers;
    const notAnswered = questions.filter((q: any) => !q.selected_answer).length;

    res.json({
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          exam_name: attempt.exam_name,
          subject_name: attempt.subject_name,
          subject_code: attempt.subject_code,
          started_at: attempt.started_at,
          submitted_at: attempt.submitted_at,
          time_taken_minutes: attempt.time_taken_minutes,
          total_marks: attempt.total_marks,
          obtained_marks: attempt.obtained_marks,
          percentage: attempt.percentage,
          passing_marks: attempt.passing_marks,
          is_passed: attempt.obtained_marks >= attempt.passing_marks,
        },
        statistics: {
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          wrong_answers: wrongAnswers,
          not_answered: notAnswered,
        },
        questions: questions.map((q: any) => ({
          id: q.question_id,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          option_e: q.option_e,
          correct_answer: q.correct_answer,
          selected_answer: q.selected_answer || null,
          is_correct: q.is_correct === 1,
          marks: q.marks,
          marks_obtained: q.marks_obtained || 0,
          display_order: q.display_order,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get exam results for admin/teacher (with permissions)
export const getExamResults = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { online_exam_id } = req.params;
    const { class_id, section_id } = req.query;
    const db = getDatabase();

    // Get user role
    const [users] = await db.execute(
      `SELECT r.name as role_name FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    ) as any[];

    if (users.length === 0) {
      throw createError('User not found', 404);
    }

    const userRole = users[0].role_name;

    // Check if exam exists
    const [exams] = await db.execute(
      `SELECT oe.*, s.name as subject_name, s.code as subject_code
       FROM online_exams oe
       INNER JOIN subjects s ON oe.subject_id = s.id
       WHERE oe.id = ?`,
      [online_exam_id]
    ) as any[];

    if (exams.length === 0) {
      throw createError('Exam not found', 404);
    }

    const exam = exams[0];

    // Build query based on role
    let query = `
      SELECT oea.*, 
             st.admission_no, st.first_name, st.last_name, st.roll_no,
             c.name as class_name, sec.name as section_name
      FROM online_exam_attempts oea
      INNER JOIN students st ON oea.student_id = st.id
      LEFT JOIN classes c ON st.class_id = c.id
      LEFT JOIN sections sec ON st.section_id = sec.id
      WHERE oea.online_exam_id = ? AND oea.status = 'submitted'
    `;
    const params: any[] = [online_exam_id];

    // Teacher can only view results for their assigned classes/sections
    if (userRole === 'teacher') {
      query += ` AND EXISTS (
        SELECT 1 FROM class_teachers ct
        WHERE ct.class_id = st.class_id 
        AND ct.section_id = st.section_id 
        AND ct.teacher_id = ?
      )`;
      params.push(req.user.id);
    }

    // Apply filters
    if (class_id) {
      query += ' AND st.class_id = ?';
      params.push(class_id);
    }

    if (section_id) {
      query += ' AND st.section_id = ?';
      params.push(section_id);
    }

    // Sort by score (highest to lowest)
    query += ' ORDER BY oea.obtained_marks DESC, oea.submitted_at ASC';

    const [results] = await db.execute(query, params) as any[];

    // Calculate rankings
    const resultsWithRank = results.map((result: any, index: number) => ({
      ...result,
      rank: index + 1,
    }));

    res.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          name: exam.name,
          subject_name: exam.subject_name,
          subject_code: exam.subject_code,
          total_marks: exam.total_marks,
          passing_marks: exam.passing_marks,
          is_result_published: exam.is_result_published ?? 0,
        },
        results: resultsWithRank,
        total_students: results.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get detailed result for a specific student (admin/teacher)
export const getStudentExamResult = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { online_exam_id, student_id } = req.params;
    const db = getDatabase();

    // Get user role
    const [users] = await db.execute(
      `SELECT r.name as role_name FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    ) as any[];

    if (users.length === 0) {
      throw createError('User not found', 404);
    }

    const userRole = users[0].role_name;

    // Get student info
    const [students] = await db.execute(
      `SELECT st.*, c.name as class_name, sec.name as section_name
       FROM students st
       LEFT JOIN classes c ON st.class_id = c.id
       LEFT JOIN sections sec ON st.section_id = sec.id
       WHERE st.id = ?`,
      [student_id]
    ) as any[];

    if (students.length === 0) {
      throw createError('Student not found', 404);
    }

    const student = students[0];

    // Check teacher permissions
    if (userRole === 'teacher') {
      const [teacherCheck] = await db.execute(
        `SELECT 1 FROM class_teachers 
         WHERE class_id = ? AND section_id = ? AND teacher_id = ?`,
        [student.class_id, student.section_id, req.user.id]
      ) as any[];

      if (teacherCheck.length === 0) {
        throw createError('You do not have permission to view this student\'s result', 403);
      }
    }

    // Get exam attempt
    const [attempts] = await db.execute(
      `SELECT oea.*, oe.name as exam_name, oe.total_marks, oe.passing_marks
       FROM online_exam_attempts oea
       INNER JOIN online_exams oe ON oea.online_exam_id = oe.id
       WHERE oea.online_exam_id = ? AND oea.student_id = ? AND oea.status = 'submitted'
       ORDER BY oea.submitted_at DESC LIMIT 1`,
      [online_exam_id, student_id]
    ) as any[];

    if (attempts.length === 0) {
      throw createError('No submitted attempt found for this student', 404);
    }

    const attempt = attempts[0];

    // Get all questions with student's answers
    const [questions] = await db.execute(
      `SELECT oeq.*, qb.question, qb.option_a, qb.option_b, qb.option_c, qb.option_d, qb.option_e, 
              qb.correct_answer, oea.selected_answer, oea.is_correct, oea.marks_obtained
       FROM online_exam_questions oeq
       INNER JOIN question_bank qb ON oeq.question_id = qb.id
       LEFT JOIN online_exam_answers oea ON oeq.question_id = oea.question_id AND oea.attempt_id = ?
       WHERE oeq.online_exam_id = ?
       ORDER BY oeq.display_order ASC, oeq.id ASC`,
      [attempt.id, online_exam_id]
    ) as any[];

    // Calculate statistics
    const totalQuestions = questions.length;
    const correctAnswers = questions.filter((q: any) => q.is_correct === 1).length;
    const wrongAnswers = totalQuestions - correctAnswers;
    const notAnswered = questions.filter((q: any) => !q.selected_answer).length;

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          admission_no: student.admission_no,
          first_name: student.first_name,
          last_name: student.last_name,
          roll_no: student.roll_no,
          class_name: student.class_name,
          section_name: student.section_name,
        },
        attempt: {
          id: attempt.id,
          exam_name: attempt.exam_name,
          started_at: attempt.started_at,
          submitted_at: attempt.submitted_at,
          time_taken_minutes: attempt.time_taken_minutes,
          total_marks: attempt.total_marks,
          obtained_marks: attempt.obtained_marks,
          percentage: attempt.percentage,
          passing_marks: attempt.passing_marks,
          is_passed: attempt.obtained_marks >= attempt.passing_marks,
        },
        statistics: {
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          wrong_answers: wrongAnswers,
          not_answered: notAnswered,
        },
        questions: questions.map((q: any) => ({
          id: q.question_id,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          option_e: q.option_e,
          correct_answer: q.correct_answer,
          selected_answer: q.selected_answer || null,
          is_correct: q.is_correct === 1,
          marks: q.marks,
          marks_obtained: q.marks_obtained || 0,
          display_order: q.display_order,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Publish/unpublish exam results (admin only)
export const publishExamResults = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { online_exam_id } = req.params;
    const { is_published } = req.body;
    const db = getDatabase();

    // Check if user is admin
    const [users] = await db.execute(
      `SELECT r.name as role_name FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    ) as any[];

    if (users.length === 0 || (users[0].role_name !== 'admin' && users[0].role_name !== 'superadmin')) {
      throw createError('Only administrators can publish results', 403);
    }

    // Update exam result publication status (only if column exists)
    const [columnCheck] = await db.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'online_exams' 
       AND COLUMN_NAME = 'is_result_published'`
    ) as any[];

    if (columnCheck.length > 0) {
      await db.execute(
        `UPDATE online_exams SET is_result_published = ? WHERE id = ?`,
        [is_published ? 1 : 0, online_exam_id]
      );
    }

    res.json({
      success: true,
      message: is_published ? 'Results published successfully' : 'Results unpublished successfully',
    });
  } catch (error) {
    next(error);
  }
};

