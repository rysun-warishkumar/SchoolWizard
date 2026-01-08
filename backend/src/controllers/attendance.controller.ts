import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// ========== Student Attendance ==========
export const getStudentAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { class_id, section_id, attendance_date, session_id } = req.query;
    const db = getDatabase();

    if (!class_id || !section_id || !attendance_date) {
      throw createError('Class, section, and attendance date are required', 400);
    }

    // Get students for the class-section
    const [students] = await db.execute(
      `SELECT s.id, s.admission_no, s.first_name, s.last_name, s.photo
       FROM students s
       WHERE s.class_id = ? AND s.section_id = ? AND s.session_id = ? AND s.is_active = 1
       ORDER BY s.admission_no ASC`,
      [class_id, section_id, session_id]
    ) as any[];

    // Get existing attendance records for the date
    const [attendance] = await db.execute(
      `SELECT sa.*, s.admission_no, s.first_name, s.last_name
       FROM student_attendance sa
       INNER JOIN students s ON sa.student_id = s.id
       WHERE sa.class_id = ? AND sa.section_id = ? AND sa.attendance_date = ? AND sa.session_id = ?
       ORDER BY s.admission_no ASC`,
      [class_id, section_id, attendance_date, session_id]
    ) as any[];

    // Create a map of existing attendance
    const attendanceMap = new Map();
    attendance.forEach((att: any) => {
      attendanceMap.set(att.student_id, att);
    });

    // Merge students with attendance data
    const result = students.map((student: any) => {
      const existingAttendance = attendanceMap.get(student.id);
      return {
        student_id: student.id,
        admission_no: student.admission_no,
        first_name: student.first_name,
        last_name: student.last_name,
        photo: student.photo,
        status: existingAttendance?.status || null,
        note: existingAttendance?.note || null,
        attendance_id: existingAttendance?.id || null,
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Get attendance for a specific student by month/year (for student panel)
export const getMyStudentAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { month, year } = req.query;
    const db = getDatabase();

    if (!month || !year) {
      throw createError('Month and year are required', 400);
    }

    // Get student ID from user_id
    const [students] = await db.execute(
      'SELECT id FROM students WHERE user_id = ?',
      [req.user.id]
    ) as any[];

    if (students.length === 0) {
      throw createError('Student profile not found', 404);
    }

    const studentId = students[0].id;

    // Get attendance summary for the month
    const [attendance] = await db.execute(
      `SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN status = 'half_day' THEN 1 END) as half_day_count,
        COUNT(CASE WHEN status = 'holiday' THEN 1 END) as holiday_count,
        COUNT(id) as total_days
      FROM student_attendance
      WHERE student_id = ? AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ?`,
      [studentId, month, year]
    ) as any[];

    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

export const submitStudentAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { class_id, section_id, attendance_date, session_id, attendance_records, mark_holiday } =
      req.body;

    if (!class_id || !section_id || !attendance_date || !session_id) {
      throw createError('Class, section, attendance date, and session are required', 400);
    }

    const db = getDatabase();
    const connection = await db.getConnection();
    const createdBy = req.user?.id || null;

    try {
      await connection.beginTransaction();

      if (mark_holiday) {
        // Mark all students as holiday
        const [students] = await connection.execute(
          `SELECT id FROM students 
           WHERE class_id = ? AND section_id = ? AND session_id = ? AND is_active = 1`,
          [class_id, section_id, session_id]
        ) as any[];

        for (const student of students) {
          await connection.execute(
            `INSERT INTO student_attendance 
             (student_id, class_id, section_id, session_id, attendance_date, status, created_by)
             VALUES (?, ?, ?, ?, ?, 'holiday', ?)
             ON DUPLICATE KEY UPDATE 
             status = 'holiday', 
             updated_at = NOW()`,
            [student.id, class_id, section_id, session_id, attendance_date, createdBy]
          );
        }
      } else {
        // Process individual attendance records
        if (!attendance_records || !Array.isArray(attendance_records)) {
          throw createError('Attendance records are required', 400);
        }

        for (const record of attendance_records) {
          const { student_id, status, note } = record;

          if (!student_id || !status) {
            continue; // Skip invalid records
          }

          await connection.execute(
            `INSERT INTO student_attendance 
             (student_id, class_id, section_id, session_id, attendance_date, status, note, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             status = VALUES(status), 
             note = VALUES(note), 
             updated_at = NOW()`,
            [
              student_id,
              class_id,
              section_id,
              session_id,
              attendance_date,
              status,
              note || null,
              createdBy,
            ]
          );
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: mark_holiday
          ? 'Attendance marked as holiday successfully'
          : 'Attendance submitted successfully',
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

// ========== Attendance By Date ==========
export const getAttendanceByDate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { class_id, section_id, attendance_date, session_id } = req.query;
    const db = getDatabase();

    if (!class_id || !section_id || !attendance_date) {
      throw createError('Class, section, and attendance date are required', 400);
    }

    const [attendance] = await db.execute(
      `SELECT 
        sa.*,
        s.admission_no,
        s.first_name,
        s.last_name,
        s.photo,
        c.name as class_name,
        sec.name as section_name
       FROM student_attendance sa
       INNER JOIN students s ON sa.student_id = s.id
       INNER JOIN classes c ON sa.class_id = c.id
       INNER JOIN sections sec ON sa.section_id = sec.id
       WHERE sa.class_id = ? AND sa.section_id = ? AND sa.attendance_date = ?
       ${session_id ? 'AND sa.session_id = ?' : ''}
       ORDER BY s.admission_no ASC`,
      session_id ? [class_id, section_id, attendance_date, session_id] : [class_id, section_id, attendance_date]
    ) as any[];

    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

// ========== Student Leave Requests ==========
export const getStudentLeaveRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { student_id, status, class_id, section_id, page = 1, limit = 20 } = req.query;
    const db = getDatabase();

    // If user is a student, ensure they can only access their own leave requests
    let actualStudentId = student_id;
    if (req.user?.role === 'student') {
      // Get student ID from user_id
      const [students] = await db.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      ) as any[];
      if (students.length === 0) {
        throw createError('Student profile not found', 404);
      }
      actualStudentId = students[0].id;
      // Override any student_id in query to prevent unauthorized access
    }

    let query = `
      SELECT 
        slr.*,
        s.admission_no,
        s.first_name,
        s.last_name,
        c.name as class_name,
        sec.name as section_name,
        u.name as approved_by_name
       FROM student_leave_requests slr
       INNER JOIN students s ON slr.student_id = s.id
       INNER JOIN classes c ON slr.class_id = c.id
       INNER JOIN sections sec ON slr.section_id = sec.id
       LEFT JOIN users u ON slr.approved_by = u.id
       WHERE 1=1
    `;
    const params: any[] = [];

    if (actualStudentId) {
      query += ' AND slr.student_id = ?';
      params.push(actualStudentId);
    }
    if (status) {
      query += ' AND slr.status = ?';
      params.push(status);
    }
    if (class_id) {
      query += ' AND slr.class_id = ?';
      params.push(class_id);
    }
    if (section_id) {
      query += ' AND slr.section_id = ?';
      params.push(section_id);
    }

    query += ' ORDER BY slr.leave_date DESC, slr.created_at DESC';

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [leaveRequests] = await db.execute(query, params) as any[];

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM student_leave_requests WHERE 1=1';
    const countParams: any[] = [];

    if (actualStudentId) {
      countQuery += ' AND student_id = ?';
      countParams.push(actualStudentId);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (class_id) {
      countQuery += ' AND class_id = ?';
      countParams.push(class_id);
    }
    if (section_id) {
      countQuery += ' AND section_id = ?';
      countParams.push(section_id);
    }

    const [countResult] = await db.execute(countQuery, countParams) as any[];

    res.json({
      success: true,
      data: leaveRequests,
      pagination: {
        total: countResult[0].total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(countResult[0].total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentLeaveRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [leaveRequests] = await db.execute(
      `SELECT 
        slr.*,
        s.admission_no,
        s.first_name,
        s.last_name,
        c.name as class_name,
        sec.name as section_name,
        u.name as approved_by_name
       FROM student_leave_requests slr
       INNER JOIN students s ON slr.student_id = s.id
       INNER JOIN classes c ON slr.class_id = c.id
       INNER JOIN sections sec ON slr.section_id = sec.id
       LEFT JOIN users u ON slr.approved_by = u.id
       WHERE slr.id = ?`,
      [id]
    ) as any[];

    if (leaveRequests.length === 0) {
      throw createError('Leave request not found', 404);
    }

    res.json({ success: true, data: leaveRequests[0] });
  } catch (error) {
    next(error);
  }
};

export const createStudentLeaveRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let { student_id, class_id, section_id, session_id, apply_date, leave_date, leave_type, reason, document_path } =
      req.body;

    const db = getDatabase();

    // If user is a student, ensure they can only create leave requests for themselves
    if (req.user?.role === 'student') {
      // Get student ID from user_id
      const [students] = await db.execute(
        'SELECT id, class_id, section_id, session_id FROM students WHERE user_id = ?',
        [req.user.id]
      ) as any[];
      if (students.length === 0) {
        throw createError('Student profile not found', 404);
      }
      const student = students[0];
      // Override student_id, class_id, section_id, session_id to prevent unauthorized access
      student_id = student.id;
      class_id = student.class_id;
      section_id = student.section_id;
      session_id = student.session_id;
    }

    if (!student_id || !class_id || !section_id || !session_id || !apply_date || !leave_date || !reason) {
      throw createError('Student, class, section, session, dates, and reason are required', 400);
    }

    const [result] = await db.execute(
      `INSERT INTO student_leave_requests 
       (student_id, class_id, section_id, session_id, apply_date, leave_date, leave_type, reason, document_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id,
        class_id,
        section_id,
        session_id,
        apply_date,
        leave_date,
        leave_type || 'casual',
        reason,
        document_path || null,
      ]
    ) as any;

    const [newLeaveRequest] = await db.execute(
      `SELECT slr.*, s.admission_no, s.first_name, s.last_name, c.name as class_name, sec.name as section_name
       FROM student_leave_requests slr
       INNER JOIN students s ON slr.student_id = s.id
       INNER JOIN classes c ON slr.class_id = c.id
       INNER JOIN sections sec ON slr.section_id = sec.id
       WHERE slr.id = ?`,
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: newLeaveRequest[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudentLeaveRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      throw createError('Valid status is required', 400);
    }

    const db = getDatabase();
    const approvedBy = req.user?.id || null;

    const updateData: any = {
      status,
      approved_by: status !== 'pending' ? approvedBy : null,
      approved_at: status !== 'pending' ? new Date() : null,
      rejection_reason: status === 'rejected' ? rejection_reason || null : null,
    };

    await db.execute(
      `UPDATE student_leave_requests 
       SET status = ?, approved_by = ?, approved_at = ?, rejection_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [updateData.status, updateData.approved_by, updateData.approved_at, updateData.rejection_reason, id]
    );

    const [updatedRequest] = await db.execute(
      `SELECT slr.*, s.admission_no, s.first_name, s.last_name, c.name as class_name, sec.name as section_name
       FROM student_leave_requests slr
       INNER JOIN students s ON slr.student_id = s.id
       INNER JOIN classes c ON slr.class_id = c.id
       INNER JOIN sections sec ON slr.section_id = sec.id
       WHERE slr.id = ?`,
      [id]
    ) as any[];

    res.json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: updatedRequest[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStudentLeaveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM student_leave_requests WHERE id = ?', [id]);

    res.json({ success: true, message: 'Leave request deleted successfully' });
  } catch (error) {
    next(error);
  }
};

