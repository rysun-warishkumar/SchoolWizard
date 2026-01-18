import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';

// Get published exams (public access - no authentication needed)
export const getPublishedExams = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();

    const query = `
      SELECT e.id, e.name, eg.name as exam_group_name, s.name as session_name, eg.exam_type
      FROM exams e
      INNER JOIN exam_groups eg ON e.exam_group_id = eg.id
      INNER JOIN sessions s ON e.session_id = s.id
      WHERE e.is_published = 1
      ORDER BY e.created_at DESC
    `;

    const [exams] = await db.execute(query) as any[];

    res.json({
      success: true,
      data: exams || [],
    });
  } catch (error) {
    next(error);
  }
};

// Get student result (public access - requires roll number and DOB)
export const getStudentResult = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { exam_id, roll_number, date_of_birth } = req.body;

    // Validation
    if (!exam_id || !roll_number || !date_of_birth) {
      throw createError('Exam ID, roll number, and date of birth are required', 400);
    }

    const db = getDatabase();

    // Step 1: Verify exam is published
    const [exams] = await db.execute(
      'SELECT id FROM exams WHERE id = ? AND is_published = 1',
      [exam_id]
    ) as any[];

    if (!exams || exams.length === 0) {
      throw createError('Result not available', 403);
    }

    // Step 2: Find student by roll number and date of birth
    // Support both class roll number (students.roll_no) and exam roll number (exam_students.roll_number)
    const [students] = await db.execute(
      `SELECT s.id, s.first_name, s.last_name, s.admission_no, s.roll_no, s.date_of_birth,
              es.roll_number as exam_roll_number
       FROM students s
       LEFT JOIN exam_students es
         ON es.student_id = s.id
        AND es.exam_id = ?
       WHERE DATE(s.date_of_birth) = DATE(?)
         AND (s.roll_no = ? OR es.roll_number = ?)`,
      [exam_id, date_of_birth, roll_number, roll_number]
    ) as any[];

    if (!students || students.length === 0) {
      throw createError('Student not found', 404);
    }

    const student = students[0];

    // Step 3: Get exam marks for this student
    const [marks] = await db.execute(
      `SELECT 
        em.id,
        em.marks_obtained,
        es.subject_id,
        sub.name as subject_name,
        sub.code as subject_code,
        es.max_marks,
        es.passing_marks
       FROM exam_marks em
       JOIN exam_subjects es ON em.exam_subject_id = es.id
       JOIN subjects sub ON es.subject_id = sub.id
       WHERE em.exam_id = ? AND em.student_id = ?
       ORDER BY sub.name ASC`,
      [exam_id, student.id]
    ) as any[];

    if (!marks || marks.length === 0) {
      throw createError('Result not found', 404);
    }

    // Step 4: Calculate totals and percentage
    let totalMarksObtained = 0;
    let totalMaxMarks = 0;

    const subjectResults = marks.map((mark: any) => {
      const marksObtained = Number(mark.marks_obtained) || 0;
      const maxMarks = Number(mark.max_marks) || 0;
      const passingMarks = Number(mark.passing_marks) || 0;

      totalMarksObtained += marksObtained;
      totalMaxMarks += maxMarks;

      return {
        subject_id: mark.subject_id,
        subject_name: mark.subject_name,
        subject_code: mark.subject_code,
        marks_obtained: marksObtained,
        max_marks: maxMarks,
        is_pass: marksObtained >= passingMarks,
      };
    });

    const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

    // Step 5: Get grade based on percentage
    const [grades] = await db.execute(
      `SELECT grade_name, grade_point
       FROM marks_grades
       WHERE percent_from <= ? AND percent_upto >= ?
       LIMIT 1`,
      [percentage, percentage]
    ) as any[];

    const grade = grades?.[0];

    // Step 6: Determine pass/fail (assuming 40% or more is pass)
    const isPass = (totalMarksObtained / totalMaxMarks) >= 0.4;

    // Format and return response
    const result = {
      student_id: student.id,
      admission_no: student.admission_no,
      roll_no: student.roll_no,
      exam_roll_number: student.exam_roll_number,
      first_name: student.first_name,
      last_name: student.last_name,
      subjects: subjectResults,
      total_marks_obtained: totalMarksObtained,
      total_max_marks: totalMaxMarks,
      percentage: parseFloat(percentage.toFixed(2)),
      grade: grade?.grade_name || 'N/A',
      grade_point: grade?.grade_point || null,
      is_pass: isPass,
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
