import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest, getSchoolId } from '../middleware/auth';

// ========== Student Attendance ==========
export const getStudentAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { class_id, section_id, attendance_date, session_id } = req.query;
    const db = getDatabase();

    if (!class_id || !section_id || !attendance_date) {
      throw createError('Class, section, and attendance date are required', 400);
    }

    const [students] = await db.execute(
      `SELECT s.id, s.admission_no, s.first_name, s.last_name, s.photo
       FROM students s
       WHERE s.school_id = ? AND s.class_id = ? AND s.section_id = ? AND s.session_id = ? AND s.is_active = 1
       ORDER BY s.admission_no ASC`,
      [schoolId, class_id, section_id, session_id]
    ) as any[];

    const [attendance] = await db.execute(
      `SELECT sa.*, s.admission_no, s.first_name, s.last_name
       FROM student_attendance sa
       INNER JOIN students s ON sa.student_id = s.id AND s.school_id = ?
       WHERE sa.school_id = ? AND sa.class_id = ? AND sa.section_id = ? AND sa.attendance_date = ? AND sa.session_id = ?
       ORDER BY s.admission_no ASC`,
      [schoolId, schoolId, class_id, section_id, attendance_date, session_id]
    ) as any[];

    const studentIds = students.map((student: any) => Number(student.id)).filter((id: number) => !Number.isNaN(id));
    let approvedLeaves: any[] = [];
    if (studentIds.length > 0) {
      const placeholders = studentIds.map(() => '?').join(', ');
      const [approvedLeavesRows] = await db.execute(
        `SELECT slr.student_id, slr.leave_type, slr.reason
         FROM student_leave_requests slr
         WHERE slr.school_id = ?
           AND DATE(slr.leave_date) = DATE(?)
           AND LOWER(TRIM(slr.status)) = 'approved'
           AND slr.student_id IN (${placeholders})`,
        [schoolId, attendance_date, ...studentIds]
      ) as any[];
      approvedLeaves = approvedLeavesRows;
    }

    // Create a map of existing attendance
    const attendanceMap = new Map();
    attendance.forEach((att: any) => {
      attendanceMap.set(att.student_id, att);
    });
    const leaveMap = new Map<number, { leave_type?: string; reason?: string }>();
    approvedLeaves.forEach((leave: any) => {
      leaveMap.set(Number(leave.student_id), {
        leave_type: leave.leave_type || undefined,
        reason: leave.reason || undefined,
      });
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
        is_on_leave: leaveMap.has(Number(student.id)),
        leave_type: leaveMap.get(Number(student.id))?.leave_type || null,
        leave_reason: leaveMap.get(Number(student.id))?.reason || null,
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
    if (!req.user) throw createError('Not authenticated', 401);
    const schoolId = getSchoolId(req);
    if (schoolId == null) throw createError('School context required', 403);

    const { month, year } = req.query;
    const db = getDatabase();

    if (!month || !year) {
      throw createError('Month and year are required', 400);
    }

    const [students] = await db.execute(
      'SELECT id FROM students WHERE user_id = ? AND school_id = ?',
      [req.user.id, schoolId]
    ) as any[];

    if (students.length === 0) {
      throw createError('Student profile not found', 404);
    }

    const studentId = students[0].id;

    const [attendance] = await db.execute(
      `SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN status = 'half_day' THEN 1 END) as half_day_count,
        COUNT(CASE WHEN status = 'holiday' THEN 1 END) as holiday_count,
        COUNT(id) as total_days
      FROM student_attendance
      WHERE school_id = ? AND student_id = ? AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ?`,
      [schoolId, studentId, month, year]
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
    const schoolId = getSchoolId(req);
    if (schoolId == null) throw createError('School context required', 403);
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
        const [students] = await connection.execute(
          `SELECT id FROM students 
           WHERE school_id = ? AND class_id = ? AND section_id = ? AND session_id = ? AND is_active = 1`,
          [schoolId, class_id, section_id, session_id]
        ) as any[];

        for (const student of students) {
          await connection.execute(
            `INSERT INTO student_attendance 
             (school_id, student_id, class_id, section_id, session_id, attendance_date, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, 'holiday', ?)
             ON DUPLICATE KEY UPDATE 
             status = 'holiday', 
             updated_at = NOW()`,
            [schoolId, student.id, class_id, section_id, session_id, attendance_date, createdBy]
          );
        }
      } else {
        if (!attendance_records || !Array.isArray(attendance_records)) {
          throw createError('Attendance records are required', 400);
        }

        const requestedStudentIds = Array.from(
          new Set(
            attendance_records
              .map((record: any) => Number(record?.student_id))
              .filter((id: number) => Number.isInteger(id) && id > 0)
          )
        );
        const onLeaveStudentIds = new Set<number>();
        if (requestedStudentIds.length > 0) {
          const placeholders = requestedStudentIds.map(() => '?').join(', ');
          const [approvedLeaveStudents] = await connection.execute(
            `SELECT DISTINCT slr.student_id
             FROM student_leave_requests slr
             WHERE slr.school_id = ?
               AND DATE(slr.leave_date) = DATE(?)
               AND LOWER(TRIM(slr.status)) = 'approved'
               AND slr.student_id IN (${placeholders})`,
            [schoolId, attendance_date, ...requestedStudentIds]
          ) as any[];
          approvedLeaveStudents.forEach((row: any) => onLeaveStudentIds.add(Number(row.student_id)));
        }

        for (const record of attendance_records) {
          const { student_id, status, note } = record;

          if (!student_id || !status) {
            continue;
          }

          if (onLeaveStudentIds.has(Number(student_id))) {
            throw createError(
              'Attendance cannot be marked for students with approved leave on this date.',
              400
            );
          }

          await connection.execute(
            `INSERT INTO student_attendance 
             (school_id, student_id, class_id, section_id, session_id, attendance_date, status, note, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             status = VALUES(status), 
             note = VALUES(note), 
             updated_at = NOW()`,
            [
              schoolId,
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
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
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
       INNER JOIN students s ON sa.student_id = s.id AND s.school_id = ?
       INNER JOIN classes c ON sa.class_id = c.id AND c.school_id = ?
       INNER JOIN sections sec ON sa.section_id = sec.id AND sec.school_id = ?
       WHERE sa.school_id = ? AND sa.class_id = ? AND sa.section_id = ? AND sa.attendance_date = ?
       ${session_id ? 'AND sa.session_id = ?' : ''}
       ORDER BY s.admission_no ASC`,
      session_id ? [schoolId, schoolId, schoolId, schoolId, class_id, section_id, attendance_date, session_id] : [schoolId, schoolId, schoolId, schoolId, class_id, section_id, attendance_date]
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
    const schoolId = getSchoolId(req);
    if (schoolId == null) throw createError('School context required', 403);
    const { student_id, status, class_id, section_id, page = 1, limit = 20 } = req.query;
    const db = getDatabase();

    let actualStudentId = student_id;
    const roleName = String(req.user?.role || '').toLowerCase();
    let parentChildIds: number[] = [];
    if (roleName === 'student') {
      const [students] = await db.execute(
        'SELECT id FROM students WHERE user_id = ? AND school_id = ?',
        [req.user.id, schoolId]
      ) as any[];
      if (students.length === 0) {
        throw createError('Student profile not found', 404);
      }
      actualStudentId = students[0].id;
    } else if (roleName === 'parent') {
      const parentEmail = String(req.user?.email || '').trim();
      if (!parentEmail) throw createError('Parent email is required', 400);
      const [children] = await db.execute(
        `SELECT id
         FROM students
         WHERE school_id = ?
           AND (father_email = ? OR mother_email = ? OR guardian_email = ?)`,
        [schoolId, parentEmail, parentEmail, parentEmail]
      ) as any[];
      parentChildIds = (Array.isArray(children) ? children : [])
        .map((row: any) => Number(row.id))
        .filter((id: number) => Number.isInteger(id) && id > 0);
      if (parentChildIds.length === 0) {
        throw createError('No linked students found for parent account', 403);
      }
      if (actualStudentId) {
        const reqStudentId = Number(actualStudentId);
        if (!parentChildIds.includes(reqStudentId)) {
          throw createError('You can only view leave requests for linked students', 403);
        }
        actualStudentId = reqStudentId;
      }
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
       INNER JOIN students s ON slr.student_id = s.id AND s.school_id = ?
       INNER JOIN classes c ON slr.class_id = c.id AND c.school_id = ?
       INNER JOIN sections sec ON slr.section_id = sec.id AND sec.school_id = ?
       LEFT JOIN users u ON slr.approved_by = u.id
       WHERE slr.school_id = ?
    `;
    const params: any[] = [schoolId, schoolId, schoolId, schoolId];

    if (actualStudentId) {
      query += ' AND slr.student_id = ?';
      params.push(actualStudentId);
    } else if (roleName === 'parent') {
      const placeholders = parentChildIds.map(() => '?').join(', ');
      query += ` AND slr.student_id IN (${placeholders})`;
      params.push(...parentChildIds);
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

    let countQuery = 'SELECT COUNT(*) as total FROM student_leave_requests WHERE school_id = ?';
    const countParams: any[] = [schoolId];

    if (actualStudentId) {
      countQuery += ' AND student_id = ?';
      countParams.push(actualStudentId);
    } else if (roleName === 'parent') {
      const placeholders = parentChildIds.map(() => '?').join(', ');
      countQuery += ` AND student_id IN (${placeholders})`;
      countParams.push(...parentChildIds);
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
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
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
       WHERE slr.id = ? AND slr.school_id = ?`,
      [id, schoolId]
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
    const schoolId = getSchoolId(req);
    if (schoolId == null) throw createError('School context required', 403);
    let { student_id, class_id, section_id, session_id, apply_date, leave_date, leave_type, reason, document_path } =
      req.body;

    const db = getDatabase();

    const roleName = String(req.user?.role || '').toLowerCase();
    if (roleName === 'student') {
      const [students] = await db.execute(
        'SELECT id, class_id, section_id, session_id FROM students WHERE user_id = ? AND school_id = ?',
        [req.user.id, schoolId]
      ) as any[];
      if (students.length === 0) {
        throw createError('Student profile not found', 404);
      }
      const student = students[0];
      student_id = student.id;
      class_id = student.class_id;
      section_id = student.section_id;
      session_id = student.session_id;
    } else if (roleName === 'parent') {
      const parentEmail = String(req.user?.email || '').trim();
      if (!parentEmail) throw createError('Parent email is required', 400);
      if (!student_id || Number.isNaN(Number(student_id))) {
        throw createError('Valid student is required', 400);
      }
      const [children] = await db.execute(
        `SELECT id, class_id, section_id, session_id
         FROM students
         WHERE school_id = ?
           AND id = ?
           AND (father_email = ? OR mother_email = ? OR guardian_email = ?)
         LIMIT 1`,
        [schoolId, Number(student_id), parentEmail, parentEmail, parentEmail]
      ) as any[];
      if (!Array.isArray(children) || children.length === 0) {
        throw createError('You can only submit leave requests for linked students', 403);
      }
      const child = children[0];
      student_id = child.id;
      class_id = child.class_id;
      section_id = child.section_id;
      session_id = child.session_id;
    }

    if (!student_id || !class_id || !section_id || !session_id || !apply_date || !leave_date || !reason) {
      throw createError('Student, class, section, session, dates, and reason are required', 400);
    }

    const [result] = await db.execute(
      `INSERT INTO student_leave_requests 
       (school_id, student_id, class_id, section_id, session_id, apply_date, leave_date, leave_type, reason, document_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
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
       WHERE slr.id = ? AND slr.school_id = ?`,
      [result.insertId, schoolId]
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

    const schoolId = getSchoolId(req);
    if (schoolId == null) throw createError('School context required', 403);

    await db.execute(
      `UPDATE student_leave_requests 
       SET status = ?, approved_by = ?, approved_at = ?, rejection_reason = ?, updated_at = NOW()
       WHERE id = ? AND school_id = ?`,
      [updateData.status, updateData.approved_by, updateData.approved_at, updateData.rejection_reason, id, schoolId]
    );

    const [updatedRequest] = await db.execute(
      `SELECT slr.*, s.admission_no, s.first_name, s.last_name, c.name as class_name, sec.name as section_name
       FROM student_leave_requests slr
       INNER JOIN students s ON slr.student_id = s.id
       INNER JOIN classes c ON slr.class_id = c.id
       INNER JOIN sections sec ON slr.section_id = sec.id
       WHERE slr.id = ? AND slr.school_id = ?`,
      [id, schoolId]
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
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM student_leave_requests WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({ success: true, message: 'Leave request deleted successfully' });
  } catch (error) {
    next(error);
  }
};

