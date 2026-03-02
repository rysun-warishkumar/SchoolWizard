import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest, getSchoolId } from '../middleware/auth';

// ========== Marks Grades ==========
export const getMarksGrades = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { exam_type } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM marks_grades WHERE school_id = ?';
    const params: any[] = [schoolId];

    if (exam_type) {
      query += ' AND exam_type = ?';
      params.push(exam_type);
    }

    query += ' ORDER BY percent_from DESC';

    const [grades] = await db.execute(query, params) as any[];

    res.json({ success: true, data: grades });
  } catch (error) {
    next(error);
  }
};

export const createMarksGrade = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { exam_type, grade_name, percent_from, percent_upto, grade_point, description } = req.body;

    if (!exam_type || !grade_name || percent_from === undefined || percent_upto === undefined) {
      throw createError('Exam type, grade name, percent from, and percent upto are required', 400);
    }

    if (percent_from < 0 || percent_upto < 0 || percent_from > 100 || percent_upto > 100) {
      throw createError('Percent values must be between 0 and 100', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      `INSERT INTO marks_grades (school_id, exam_type, grade_name, percent_from, percent_upto, grade_point, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        exam_type,
        grade_name.trim(),
        percent_from,
        percent_upto,
        grade_point || null,
        description || null,
      ]
    ) as any;

    const [newGrade] = await db.execute('SELECT * FROM marks_grades WHERE id = ? AND school_id = ?', [
      result.insertId,
      schoolId,
    ]) as any[];

    res.status(201).json({
      success: true,
      message: 'Marks grade created successfully',
      data: newGrade[0],
    });
  } catch (error) {
    next(error);
  }
};

// ========== Exam Groups ==========
export const getExamGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const [examGroups] = await db.execute(
      'SELECT * FROM exam_groups WHERE school_id = ? ORDER BY name ASC',
      [schoolId]
    ) as any[];

    res.json({ success: true, data: examGroups });
  } catch (error) {
    next(error);
  }
};

export const getExamGroupById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    const [examGroups] = await db.execute('SELECT * FROM exam_groups WHERE id = ? AND school_id = ?', [id, schoolId]) as any[];

    if (examGroups.length === 0) {
      throw createError('Exam group not found', 404);
    }

    const [exams] = await db.execute(
      `SELECT e.*, s.name as session_name
       FROM exams e
       INNER JOIN sessions s ON e.session_id = s.id AND s.school_id = ?
       WHERE e.school_id = ? AND e.exam_group_id = ?
       ORDER BY e.created_at DESC`,
      [schoolId, schoolId, id]
    ) as any[];

    res.json({
      success: true,
      data: {
        ...examGroups[0],
        exams: exams,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createExamGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { name, exam_type, description } = req.body;

    if (!name || name.trim() === '') {
      throw createError('Exam group name is required', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      'INSERT INTO exam_groups (school_id, name, exam_type, description) VALUES (?, ?, ?, ?)',
      [schoolId, name.trim(), exam_type || 'general_purpose', description || null]
    ) as any;

    const [newExamGroup] = await db.execute('SELECT * FROM exam_groups WHERE id = ? AND school_id = ?', [
      result.insertId,
      schoolId,
    ]) as any[];

    res.status(201).json({
      success: true,
      message: 'Exam group created successfully',
      data: newExamGroup[0],
    });
  } catch (error) {
    next(error);
  }
};

// ========== Exams ==========
export const getExams = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { exam_group_id, session_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT e.*, eg.name as exam_group_name, eg.exam_type, s.name as session_name
      FROM exams e
      INNER JOIN exam_groups eg ON e.exam_group_id = eg.id AND eg.school_id = ?
      INNER JOIN sessions s ON e.session_id = s.id AND s.school_id = ?
      WHERE e.school_id = ?
    `;
    const params: any[] = [schoolId, schoolId, schoolId];

    if (exam_group_id) {
      query += ' AND e.exam_group_id = ?';
      params.push(exam_group_id);
    }
    if (session_id) {
      query += ' AND e.session_id = ?';
      params.push(session_id);
    }

    query += ' ORDER BY e.created_at DESC';

    const [exams] = await db.execute(query, params) as any[];

    res.json({ success: true, data: exams });
  } catch (error) {
    next(error);
  }
};

export const getExamById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    const [exams] = await db.execute(
      `SELECT e.*, eg.name as exam_group_name, eg.exam_type, s.name as session_name
       FROM exams e
       INNER JOIN exam_groups eg ON e.exam_group_id = eg.id AND eg.school_id = ?
       INNER JOIN sessions s ON e.session_id = s.id AND s.school_id = ?
       WHERE e.id = ? AND e.school_id = ?`,
      [schoolId, schoolId, id, schoolId]
    ) as any[];

    if (exams.length === 0) {
      throw createError('Exam not found', 404);
    }

    const [subjects] = await db.execute(
      `SELECT es.*, s.name as subject_name, s.code as subject_code
       FROM exam_subjects es
       INNER JOIN subjects s ON es.subject_id = s.id AND s.school_id = ?
       WHERE es.school_id = ? AND es.exam_id = ?
       ORDER BY es.exam_date ASC, es.exam_time_from ASC`,
      [schoolId, schoolId, id]
    ) as any[];

    const [students] = await db.execute(
      `SELECT es.*, s.admission_no, s.first_name, s.last_name, s.photo
       FROM exam_students es
       INNER JOIN students s ON es.student_id = s.id AND s.school_id = ?
       WHERE es.school_id = ? AND es.exam_id = ?
       ORDER BY s.admission_no ASC`,
      [schoolId, schoolId, id]
    ) as any[];

    res.json({
      success: true,
      data: {
        ...exams[0],
        subjects: subjects,
        students: students,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createExam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { exam_group_id, name, session_id, is_published, description } = req.body;

    if (!exam_group_id || !name || !session_id) {
      throw createError('Exam group, name, and session are required', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      `INSERT INTO exams (school_id, exam_group_id, name, session_id, is_published, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [schoolId, exam_group_id, name.trim(), session_id, is_published || 0, description || null]
    ) as any;

    const [newExam] = await db.execute(
      `SELECT e.*, eg.name as exam_group_name, s.name as session_name
       FROM exams e
       INNER JOIN exam_groups eg ON e.exam_group_id = eg.id
       INNER JOIN sessions s ON e.session_id = s.id
       WHERE e.id = ? AND e.school_id = ?`,
      [result.insertId, schoolId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: newExam[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const { name, is_published, description } = req.body;
    const db = getDatabase();

    const [existingExams] = await db.execute(
      'SELECT id FROM exams WHERE id = ? AND school_id = ?',
      [id, schoolId]
    ) as any[];

    if (existingExams.length === 0) {
      throw createError('Exam not found', 404);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (is_published !== undefined) {
      updates.push('is_published = ?');
      params.push(is_published ? 1 : 0);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description || null);
    }

    if (updates.length === 0) {
      throw createError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id, schoolId);

    await db.execute(
      `UPDATE exams SET ${updates.join(', ')} WHERE id = ? AND school_id = ?`,
      params
    );

    const [updatedExams] = await db.execute(
      `SELECT e.*, eg.name as exam_group_name, eg.exam_type, s.name as session_name
       FROM exams e
       INNER JOIN exam_groups eg ON e.exam_group_id = eg.id
       INNER JOIN sessions s ON e.session_id = s.id
       WHERE e.id = ? AND e.school_id = ?`,
      [id, schoolId]
    ) as any[];

    res.json({
      success: true,
      message: 'Exam updated successfully',
      data: updatedExams[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    const [existingExams] = await db.execute(
      'SELECT id, name FROM exams WHERE id = ? AND school_id = ?',
      [id, schoolId]
    ) as any[];

    if (existingExams.length === 0) {
      throw createError('Exam not found', 404);
    }

    await db.execute('DELETE FROM exam_marks WHERE exam_id = ? AND school_id = ?', [id, schoolId]);
    await db.execute('DELETE FROM exam_students WHERE exam_id = ? AND school_id = ?', [id, schoolId]);
    await db.execute('DELETE FROM exam_subjects WHERE exam_id = ? AND school_id = ?', [id, schoolId]);

    await db.execute('DELETE FROM exams WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: `Exam "${existingExams[0].name}" deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// ========== Exam Subjects ==========
export const getExamSubjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { exam_id } = req.query;
    const db = getDatabase();

    if (!exam_id) {
      throw createError('Exam ID is required', 400);
    }

    const [subjects] = await db.execute(
      `SELECT es.*, s.name as subject_name, s.code as subject_code
       FROM exam_subjects es
       INNER JOIN subjects s ON es.subject_id = s.id AND s.school_id = ?
       WHERE es.school_id = ? AND es.exam_id = ?
       ORDER BY es.exam_date ASC, es.exam_time_from ASC`,
      [schoolId, schoolId, exam_id]
    ) as any[];

    res.json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
};

export const createExamSubject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const {
      exam_id,
      subject_id,
      exam_date,
      exam_time_from,
      exam_time_to,
      room_number,
      credit_hours,
      max_marks,
      passing_marks,
    } = req.body;

    if (!exam_id || !subject_id || !max_marks) {
      throw createError('Exam ID, subject ID, and max marks are required', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      `INSERT INTO exam_subjects 
       (school_id, exam_id, subject_id, exam_date, exam_time_from, exam_time_to, room_number, credit_hours, max_marks, passing_marks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        exam_id,
        subject_id,
        exam_date || null,
        exam_time_from || null,
        exam_time_to || null,
        room_number || null,
        credit_hours || 0,
        max_marks,
        passing_marks || 33,
      ]
    ) as any;

    const [newSubject] = await db.execute(
      `SELECT es.*, s.name as subject_name, s.code as subject_code
       FROM exam_subjects es
       INNER JOIN subjects s ON es.subject_id = s.id
       WHERE es.id = ? AND es.school_id = ?`,
      [result.insertId, schoolId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Exam subject added successfully',
      data: newSubject[0],
    });
  } catch (error) {
    next(error);
  }
};

// ========== Exam Marks ==========
export const getExamMarks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { exam_id, exam_subject_id, student_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        em.*,
        s.admission_no,
        s.first_name,
        s.last_name,
        es.max_marks,
        es.passing_marks,
        sub.name as subject_name
      FROM exam_marks em
      INNER JOIN students s ON em.student_id = s.id AND s.school_id = ?
      INNER JOIN exam_subjects es ON em.exam_subject_id = es.id AND es.school_id = ?
      INNER JOIN subjects sub ON es.subject_id = sub.id AND sub.school_id = ?
      WHERE em.school_id = ?
    `;
    const params: any[] = [schoolId, schoolId, schoolId, schoolId];

    if (exam_id) {
      query += ' AND em.exam_id = ?';
      params.push(exam_id);
    }
    if (exam_subject_id) {
      query += ' AND em.exam_subject_id = ?';
      params.push(exam_subject_id);
    }
    if (student_id) {
      query += ' AND em.student_id = ?';
      params.push(student_id);
    }

    query += ' ORDER BY s.admission_no ASC';

    const [marks] = await db.execute(query, params) as any[];

    res.json({ success: true, data: marks });
  } catch (error) {
    next(error);
  }
};

export const submitExamMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) throw createError('School context required', 403);
    const { exam_id, exam_subject_id, marks_records } = req.body;

    if (!exam_id || !exam_subject_id || !marks_records || !Array.isArray(marks_records)) {
      throw createError('Exam ID, exam subject ID, and marks records are required', 400);
    }

    const db = getDatabase();
    const connection = await db.getConnection();
    const createdBy = req.user?.id || null;

    try {
      await connection.beginTransaction();

      const [examSubjects] = await connection.execute(
        'SELECT max_marks, passing_marks FROM exam_subjects WHERE id = ? AND school_id = ?',
        [exam_subject_id, schoolId]
      ) as any[];

      if (examSubjects.length === 0) {
        throw createError('Exam subject not found', 404);
      }

      const { max_marks, passing_marks } = examSubjects[0];

      for (const record of marks_records) {
        const { student_id, marks_obtained, note } = record;

        if (!student_id || marks_obtained === undefined) {
          continue;
        }

        if (marks_obtained < 0 || marks_obtained > max_marks) {
          throw createError(
            `Marks obtained (${marks_obtained}) must be between 0 and ${max_marks}`,
            400
          );
        }

        await connection.execute(
          `INSERT INTO exam_marks 
           (school_id, exam_id, exam_subject_id, student_id, marks_obtained, note, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           marks_obtained = VALUES(marks_obtained),
           note = VALUES(note),
           updated_at = NOW()`,
          [schoolId, exam_id, exam_subject_id, student_id, marks_obtained, note || null, createdBy]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Exam marks submitted successfully',
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

// ========== Exam Results ==========
export const getExamResults = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { exam_id, class_id, section_id, session_id } = req.query;

    if (!exam_id || !class_id || !section_id || !session_id) {
      throw createError('Exam ID, Class ID, Section ID, and Session ID are required', 400);
    }

    const db = getDatabase();

    const [exams] = await db.execute(
      `SELECT e.*, eg.exam_type
       FROM exams e
       INNER JOIN exam_groups eg ON e.exam_group_id = eg.id AND eg.school_id = ?
       WHERE e.id = ? AND e.school_id = ?`,
      [schoolId, exam_id, schoolId]
    ) as any[];

    if (exams.length === 0) {
      throw createError('Exam not found', 404);
    }

    const exam = exams[0];

    const [examSubjects] = await db.execute(
      `SELECT es.*, s.name as subject_name, s.code as subject_code,
              CAST(es.max_marks AS DECIMAL(10,2)) as max_marks,
              CAST(es.passing_marks AS DECIMAL(10,2)) as passing_marks
       FROM exam_subjects es
       INNER JOIN subjects s ON es.subject_id = s.id AND s.school_id = ?
       WHERE es.school_id = ? AND es.exam_id = ?
       ORDER BY es.exam_date ASC, es.exam_time_from ASC`,
      [schoolId, schoolId, exam_id]
    ) as any[];

    const [students] = await db.execute(
      `SELECT s.*, es.roll_number as exam_roll_number
       FROM students s
       LEFT JOIN exam_students es ON s.id = es.student_id AND es.exam_id = ? AND es.school_id = ?
       WHERE s.school_id = ? AND s.class_id = ? AND s.section_id = ? AND s.session_id = ? AND s.is_active = 1
       ORDER BY s.admission_no ASC`,
      [exam_id, schoolId, schoolId, class_id, section_id, session_id]
    ) as any[];

    const [allMarks] = await db.execute(
      `SELECT em.*, es.subject_id, 
              CAST(es.max_marks AS DECIMAL(10,2)) as max_marks, 
              CAST(es.passing_marks AS DECIMAL(10,2)) as passing_marks,
              CAST(em.marks_obtained AS DECIMAL(10,2)) as marks_obtained
       FROM exam_marks em
       INNER JOIN exam_subjects es ON em.exam_subject_id = es.id
       WHERE em.school_id = ? AND em.exam_id = ?`,
      [schoolId, exam_id]
    ) as any[];

    const [marksGrades] = await db.execute(
      `SELECT * FROM marks_grades WHERE school_id = ? AND exam_type = ? ORDER BY percent_from DESC`,
      [schoolId, exam.exam_type]
    ) as any[];

    // Calculate results for each student
    const results = students.map((student: any) => {
      const studentMarks = allMarks.filter((m: any) => m.student_id === student.id);

      // Calculate subject-wise marks
      const subjectResults = examSubjects.map((subject: any) => {
        const mark = studentMarks.find((m: any) => m.exam_subject_id === subject.id);
        
        // Explicitly parse values, handling both string and number types
        const marksObtained = parseFloat(String(mark?.marks_obtained || 0)) || 0;
        const maxMarks = parseFloat(String(subject.max_marks || 0)) || 0;
        const passingMarks = parseFloat(String(subject.passing_marks || 0)) || 0;
        
        return {
          subject_id: subject.id,
          subject_name: subject.subject_name,
          subject_code: subject.subject_code,
          marks_obtained: marksObtained,
          max_marks: maxMarks,
          passing_marks: passingMarks,
          grade: mark?.grade || null,
          grade_point: mark?.grade_point || null,
          is_pass: marksObtained >= passingMarks,
        };
      });

      // Calculate totals - explicitly sum numeric values
      let totalMarksObtained = 0;
      let totalMaxMarks = 0;
      
      for (const subject of subjectResults) {
        const obtained = parseFloat(String(subject.marks_obtained || 0)) || 0;
        const max = parseFloat(String(subject.max_marks || 0)) || 0;
        totalMarksObtained += obtained;
        totalMaxMarks += max;
      }
      
      const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

      // Determine grade based on percentage
      let grade = null;
      let gradePoint = null;
      if (marksGrades.length > 0) {
        const matchedGrade = marksGrades.find(
          (g: any) => {
            const percentFrom = parseFloat(String(g.percent_from || 0)) || 0;
            const percentUpto = parseFloat(String(g.percent_upto || 0)) || 0;
            return percentage >= percentFrom && percentage <= percentUpto;
          }
        );
        if (matchedGrade) {
          grade = matchedGrade.grade_name;
          gradePoint = matchedGrade.grade_point ? parseFloat(String(matchedGrade.grade_point)) : null;
        }
      }

      // Check if student passed (all subjects passed for general purpose, or based on percentage)
      let is_pass = false;
      if (exam.exam_type === 'general_purpose') {
        is_pass = subjectResults.every((s: any) => s.is_pass);
      } else {
        // For grading systems, check if percentage meets minimum passing criteria
        // Use the minimum passing percentage from marks grades if available, otherwise default to 33%
        let minPassingPercent = 33;
        if (marksGrades.length > 0) {
          const passingPercents = marksGrades.map((g: any) => parseFloat(String(g.percent_from || 0)) || 0);
          minPassingPercent = Math.min(...passingPercents);
        }
        is_pass = percentage >= minPassingPercent;
      }

      return {
        student_id: student.id,
        admission_no: student.admission_no,
        roll_no: student.roll_no,
        exam_roll_number: student.exam_roll_number,
        first_name: student.first_name,
        last_name: student.last_name,
        photo: student.photo,
        subjects: subjectResults,
        total_marks_obtained: Math.round(totalMarksObtained * 100) / 100, // Round to 2 decimal places
        total_max_marks: Math.round(totalMaxMarks),
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
        grade: grade,
        grade_point: gradePoint,
        is_pass: is_pass,
        rank: 0, // Will be calculated after sorting
      };
    });

    // Calculate ranks based on percentage
    results.sort((a: any, b: any) => b.percentage - a.percentage);
    results.forEach((result: any, index: number) => {
      result.rank = index + 1;
    });

    // Sort back by admission number for display
    results.sort((a: any, b: any) => a.admission_no.localeCompare(b.admission_no));

    res.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          name: exam.name,
          exam_type: exam.exam_type,
        },
        class_id: Number(class_id),
        section_id: Number(section_id),
        session_id: Number(session_id),
        results: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ========== Exam Students ==========
export const assignExamStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { exam_id, student_ids } = req.body;

    if (!exam_id || !student_ids || !Array.isArray(student_ids)) {
      throw createError('Exam ID and student IDs array are required', 400);
    }

    const db = getDatabase();
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute('DELETE FROM exam_students WHERE exam_id = ? AND school_id = ?', [exam_id, schoolId]);

      if (student_ids.length > 0) {
        const values = student_ids.map((student_id: number) => [schoolId, exam_id, student_id]);
        const placeholders = values.map(() => '(?, ?, ?)').join(', ');
        const flatValues = values.flat();

        await connection.execute(
          `INSERT INTO exam_students (school_id, exam_id, student_id) VALUES ${placeholders}`,
          flatValues
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Students assigned to exam successfully',
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

// ========== Admit Card Templates ==========
export const getAdmitCardTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const [templates] = await db.execute(
      'SELECT * FROM admit_card_templates WHERE school_id = ? ORDER BY name ASC',
      [schoolId]
    ) as any[];

    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

export const getAdmitCardTemplateById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    const [templates] = await db.execute('SELECT * FROM admit_card_templates WHERE id = ? AND school_id = ?', [id, schoolId]) as any[];

    if (templates.length === 0) {
      throw createError('Admit card template not found', 404);
    }

    res.json({ success: true, data: templates[0] });
  } catch (error) {
    next(error);
  }
};

export const createAdmitCardTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const {
      name,
      heading,
      title,
      exam_name,
      header_left_text,
      header_center_text,
      header_right_text,
      body_text,
      footer_left_text,
      footer_center_text,
      footer_right_text,
      header_height,
      footer_height,
      body_height,
      body_width,
      show_student_photo,
      photo_height,
      background_image,
    } = req.body;

    if (!name || name.trim() === '') {
      throw createError('Template name is required', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      `INSERT INTO admit_card_templates 
       (school_id, name, heading, title, exam_name, header_left_text, header_center_text, header_right_text, body_text,
        footer_left_text, footer_center_text, footer_right_text, header_height,
        footer_height, body_height, body_width, show_student_photo, photo_height, background_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        name.trim(),
        heading || null,
        title || null,
        exam_name || null,
        header_left_text || null,
        header_center_text || null,
        header_right_text || null,
        body_text || null,
        footer_left_text || null,
        footer_center_text || null,
        footer_right_text || null,
        header_height || 100,
        footer_height || 50,
        body_height || 400,
        body_width || 800,
        show_student_photo !== undefined ? (show_student_photo ? 1 : 0) : 1,
        photo_height || 100,
        background_image || null,
      ]
    ) as any;

    const [newTemplate] = await db.execute('SELECT * FROM admit_card_templates WHERE id = ? AND school_id = ?', [
      result.insertId,
      schoolId,
    ]) as any[];

    res.status(201).json({
      success: true,
      message: 'Admit card template created successfully',
      data: newTemplate[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdmitCardTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const {
      name,
      heading,
      title,
      exam_name,
      header_left_text,
      header_center_text,
      header_right_text,
      body_text,
      footer_left_text,
      footer_center_text,
      footer_right_text,
      header_height,
      footer_height,
      body_height,
      body_width,
      show_student_photo,
      photo_height,
      background_image,
    } = req.body;

    const db = getDatabase();

    await db.execute(
      `UPDATE admit_card_templates SET
       name = ?, heading = ?, title = ?, exam_name = ?, header_left_text = ?, header_center_text = ?, header_right_text = ?,
       body_text = ?, footer_left_text = ?, footer_center_text = ?, footer_right_text = ?,
       header_height = ?, footer_height = ?, body_height = ?, body_width = ?,
       show_student_photo = ?, photo_height = ?, background_image = ?
       WHERE id = ? AND school_id = ?`,
      [
        name?.trim() || null,
        heading || null,
        title || null,
        exam_name || null,
        header_left_text || null,
        header_center_text || null,
        header_right_text || null,
        body_text || null,
        footer_left_text || null,
        footer_center_text || null,
        footer_right_text || null,
        header_height || 100,
        footer_height || 50,
        body_height || 400,
        body_width || 800,
        show_student_photo !== undefined ? (show_student_photo ? 1 : 0) : 1,
        photo_height || 100,
        background_image || null,
        id,
        schoolId,
      ]
    );

    const [updatedTemplate] = await db.execute('SELECT * FROM admit_card_templates WHERE id = ? AND school_id = ?', [
      id,
      schoolId,
    ]) as any[];

    res.json({
      success: true,
      message: 'Admit card template updated successfully',
      data: updatedTemplate[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdmitCardTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    const [templates] = await db.execute('SELECT * FROM admit_card_templates WHERE id = ? AND school_id = ?', [id, schoolId]) as any[];

    if (templates.length === 0) {
      throw createError('Admit card template not found', 404);
    }

    await db.execute('DELETE FROM admit_card_templates WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Admit card template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Marksheet Templates ==========
export const getMarksheetTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const [templates] = await db.execute(
      'SELECT * FROM marksheet_templates WHERE school_id = ? ORDER BY name ASC',
      [schoolId]
    ) as any[];

    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

export const getMarksheetTemplateById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    const [templates] = await db.execute('SELECT * FROM marksheet_templates WHERE id = ? AND school_id = ?', [id, schoolId]) as any[];

    if (templates.length === 0) {
      throw createError('Marksheet template not found', 404);
    }

    res.json({ success: true, data: templates[0] });
  } catch (error) {
    next(error);
  }
};

export const createMarksheetTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const {
      name,
      header_left_text,
      header_center_text,
      header_right_text,
      body_text,
      footer_left_text,
      footer_center_text,
      footer_right_text,
      header_height,
      footer_height,
      body_height,
      body_width,
      show_student_photo,
      photo_height,
      background_image,
    } = req.body;

    if (!name || name.trim() === '') {
      throw createError('Template name is required', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      `INSERT INTO marksheet_templates 
       (school_id, name, header_left_text, header_center_text, header_right_text, body_text,
        footer_left_text, footer_center_text, footer_right_text, header_height,
        footer_height, body_height, body_width, show_student_photo, photo_height, background_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        name.trim(),
        header_left_text || null,
        header_center_text || null,
        header_right_text || null,
        body_text || null,
        footer_left_text || null,
        footer_center_text || null,
        footer_right_text || null,
        header_height || 100,
        footer_height || 50,
        body_height || 500,
        body_width || 800,
        show_student_photo !== undefined ? (show_student_photo ? 1 : 0) : 1,
        photo_height || 100,
        background_image || null,
      ]
    ) as any;

    const [newTemplate] = await db.execute('SELECT * FROM marksheet_templates WHERE id = ? AND school_id = ?', [
      result.insertId,
      schoolId,
    ]) as any[];

    res.status(201).json({
      success: true,
      message: 'Marksheet template created successfully',
      data: newTemplate[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateMarksheetTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const {
      name,
      header_left_text,
      header_center_text,
      header_right_text,
      body_text,
      footer_left_text,
      footer_center_text,
      footer_right_text,
      header_height,
      footer_height,
      body_height,
      body_width,
      show_student_photo,
      photo_height,
      background_image,
    } = req.body;

    const db = getDatabase();

    await db.execute(
      `UPDATE marksheet_templates SET
       name = ?, header_left_text = ?, header_center_text = ?, header_right_text = ?,
       body_text = ?, footer_left_text = ?, footer_center_text = ?, footer_right_text = ?,
       header_height = ?, footer_height = ?, body_height = ?, body_width = ?,
       show_student_photo = ?, photo_height = ?, background_image = ?
       WHERE id = ? AND school_id = ?`,
      [
        name?.trim() || null,
        header_left_text || null,
        header_center_text || null,
        header_right_text || null,
        body_text || null,
        footer_left_text || null,
        footer_center_text || null,
        footer_right_text || null,
        header_height || 100,
        footer_height || 50,
        body_height || 500,
        body_width || 800,
        show_student_photo !== undefined ? (show_student_photo ? 1 : 0) : 1,
        photo_height || 100,
        background_image || null,
        id,
        schoolId,
      ]
    );

    const [updatedTemplate] = await db.execute('SELECT * FROM marksheet_templates WHERE id = ? AND school_id = ?', [
      id,
      schoolId,
    ]) as any[];

    res.json({
      success: true,
      message: 'Marksheet template updated successfully',
      data: updatedTemplate[0],
    });
  } catch (error) {
    next(error);
  }
};

