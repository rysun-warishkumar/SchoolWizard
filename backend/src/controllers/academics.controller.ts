import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest, getSchoolId } from '../middleware/auth';

// ========== Classes ==========
export const getClasses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const db = getDatabase();
    const [classes] = await db.execute(
      `SELECT c.*, 
       GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') as sections,
       GROUP_CONCAT(DISTINCT cs.section_id ORDER BY s.name SEPARATOR ',') as section_ids
       FROM classes c
       LEFT JOIN class_sections cs ON c.id = cs.class_id AND cs.school_id = ?
       LEFT JOIN sections s ON cs.section_id = s.id AND s.school_id = ?
       WHERE c.school_id = ?
       GROUP BY c.id
       ORDER BY c.numeric_value ASC, c.name ASC`,
      [schoolId, schoolId, schoolId]
    ) as any[];

    res.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

export const createClass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { name, numeric_value, section_ids } = req.body;

    if (!name) {
      throw createError('Class name is required', 400);
    }

    const db = getDatabase();

    // Create class
    const [result] = await db.execute(
      'INSERT INTO classes (school_id, name, numeric_value, created_at) VALUES (?, ?, ?, NOW())',
      [schoolId, name, numeric_value || null]
    ) as any;

    // Assign sections if provided
    if (section_ids && Array.isArray(section_ids) && section_ids.length > 0) {
      const values = section_ids.map((sectionId: number) => [schoolId, result.insertId, sectionId]);
      const placeholders = values.map(() => '(?, ?, ?)').join(', ');
      const flatValues = values.flat();

      await db.execute(
        `INSERT INTO class_sections (school_id, class_id, section_id) VALUES ${placeholders}`,
        flatValues
      );
    }

    const [newClasses] = await db.execute(
      'SELECT * FROM classes WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClasses[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { id } = req.params;
    const { name, numeric_value, section_ids } = req.body;
    const db = getDatabase();

    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (numeric_value !== undefined) {
      updates.push('numeric_value = ?');
      params.push(numeric_value);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      params.push(id, schoolId);
      await db.execute(
        `UPDATE classes SET ${updates.join(', ')} WHERE id = ? AND school_id = ?`,
        params
      );
    }

    // Update sections if provided
    if (section_ids && Array.isArray(section_ids)) {
      // Remove existing sections
      await db.execute('DELETE FROM class_sections WHERE class_id = ? AND school_id = ?', [id, schoolId]);

      // Add new sections
      if (section_ids.length > 0) {
        const values = section_ids.map((sectionId: number) => [schoolId, id, sectionId]);
        const placeholders = values.map(() => '(?, ?, ?)').join(', ');
        const flatValues = values.flat();

        await db.execute(
          `INSERT INTO class_sections (school_id, class_id, section_id) VALUES ${placeholders}`,
          flatValues
        );
      }
    }

    const [updatedClasses] = await db.execute(
      'SELECT * FROM classes WHERE id = ? AND school_id = ?',
      [id, schoolId]
    ) as any[];

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: updatedClasses[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM classes WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Sections ==========
export const getSections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const db = getDatabase();
    const { class_id } = req.query;

    let query = '';
    let params: any[] = [schoolId];

    if (class_id) {
      // Get sections for a specific class (same school)
      query = `
        SELECT DISTINCT s.* 
        FROM sections s
        INNER JOIN class_sections cs ON s.id = cs.section_id AND cs.school_id = ?
        WHERE cs.class_id = ? AND s.school_id = ?
        ORDER BY s.name ASC
      `;
      params = [schoolId, class_id, schoolId];
    } else {
      // Get all sections for this school
      query = 'SELECT * FROM sections WHERE school_id = ? ORDER BY name ASC';
      params = [schoolId];
    }

    const [sections] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    next(error);
  }
};

export const createSection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { name } = req.body;

    if (!name) {
      throw createError('Section name is required', 400);
    }

    const db = getDatabase();

    const [existing] = await db.execute(
      'SELECT id FROM sections WHERE name = ? AND school_id = ?',
      [name, schoolId]
    ) as any[];

    if (existing.length > 0) {
      throw createError('Section with this name already exists', 400);
    }

    const [result] = await db.execute(
      'INSERT INTO sections (school_id, name, created_at) VALUES (?, ?, NOW())',
      [schoolId, name]
    ) as any;

    const [newSections] = await db.execute(
      'SELECT * FROM sections WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: newSections[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateSection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { id } = req.params;
    const { name } = req.body;
    const db = getDatabase();

    if (!name) {
      throw createError('Section name is required', 400);
    }

    await db.execute(
      'UPDATE sections SET name = ?, updated_at = NOW() WHERE id = ? AND school_id = ?',
      [name, id, schoolId]
    );

    const [updatedSections] = await db.execute(
      'SELECT * FROM sections WHERE id = ? AND school_id = ?',
      [id, schoolId]
    ) as any[];

    res.json({
      success: true,
      message: 'Section updated successfully',
      data: updatedSections[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM sections WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Subjects ==========
export const getSubjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) return next(createError('School context required', 403));
    const db = getDatabase();
    const [subjects] = await db.execute(
      'SELECT * FROM subjects WHERE school_id = ? ORDER BY name ASC',
      [schoolId]
    ) as any[];

    res.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) return next(createError('School context required', 403));
    const { name, code, type } = req.body;

    if (!name) {
      throw createError('Subject name is required', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      'INSERT INTO subjects (school_id, name, code, type, created_at) VALUES (?, ?, ?, ?, NOW())',
      [schoolId, name, code || null, type || 'theory']
    ) as any;

    const [newSubjects] = await db.execute(
      'SELECT * FROM subjects WHERE school_id = ? AND id = ?',
      [schoolId, result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: newSubjects[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) return next(createError('School context required', 403));
    const { id } = req.params;
    const { name, code, type } = req.body;
    const db = getDatabase();

    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (code !== undefined) {
      updates.push('code = ?');
      params.push(code);
    }
    if (type) {
      updates.push('type = ?');
      params.push(type);
    }

    if (updates.length === 0) {
      throw createError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id, schoolId);

    await db.execute(
      `UPDATE subjects SET ${updates.join(', ')} WHERE id = ? AND school_id = ?`,
      params
    );

    const [updatedSubjects] = await db.execute(
      'SELECT * FROM subjects WHERE school_id = ? AND id = ?',
      [schoolId, id]
    ) as any[];

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: updatedSubjects[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) return next(createError('School context required', 403));
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM subjects WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Subject Groups ==========
export const getSubjectGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) return next(createError('School context required', 403));
    const { class_id, section_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT sg.*, c.name as class_name, s.name as section_name,
       GROUP_CONCAT(DISTINCT sub.name ORDER BY sub.name SEPARATOR ', ') as subjects,
       GROUP_CONCAT(DISTINCT sgs.subject_id ORDER BY sgs.subject_id SEPARATOR ',') as subject_ids
       FROM subject_groups sg
       LEFT JOIN classes c ON sg.class_id = c.id AND c.school_id = ?
       LEFT JOIN sections s ON sg.section_id = s.id AND s.school_id = ?
       LEFT JOIN subject_group_subjects sgs ON sg.id = sgs.subject_group_id AND sgs.school_id = ?
       LEFT JOIN subjects sub ON sgs.subject_id = sub.id AND sub.school_id = ?
       WHERE sg.school_id = ?
    `;
    const params: any[] = [schoolId, schoolId, schoolId, schoolId, schoolId];

    if (class_id) {
      query += ' AND sg.class_id = ?';
      params.push(class_id);
    }
    if (section_id) {
      query += ' AND sg.section_id = ?';
      params.push(section_id);
    }

    query += ' GROUP BY sg.id ORDER BY sg.name ASC';

    const [groups] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

export const createSubjectGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) return next(createError('School context required', 403));
    const { name, class_id, section_id, subject_ids } = req.body;

    if (!name || !class_id || !section_id) {
      throw createError('Name, class, and section are required', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      'INSERT INTO subject_groups (school_id, name, class_id, section_id, created_at) VALUES (?, ?, ?, ?, NOW())',
      [schoolId, name, class_id, section_id]
    ) as any;

    if (subject_ids && Array.isArray(subject_ids) && subject_ids.length > 0) {
      const values = subject_ids.map((subjectId: number) => [schoolId, result.insertId, subjectId]);
      const placeholders = values.map(() => '(?, ?, ?)').join(', ');
      const flatValues = values.flat();

      await db.execute(
        `INSERT INTO subject_group_subjects (school_id, subject_group_id, subject_id) VALUES ${placeholders}`,
        flatValues
      );
    }

    const [newGroups] = await db.execute(
      'SELECT * FROM subject_groups WHERE school_id = ? AND id = ?',
      [schoolId, result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Subject group created successfully',
      data: newGroups[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubjectGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) return next(createError('School context required', 403));
    const { id } = req.params;
    const { name, subject_ids } = req.body;
    const db = getDatabase();

    if (name) {
      await db.execute(
        'UPDATE subject_groups SET name = ?, updated_at = NOW() WHERE id = ? AND school_id = ?',
        [name, id, schoolId]
      );
    }

    if (subject_ids && Array.isArray(subject_ids)) {
      await db.execute('DELETE FROM subject_group_subjects WHERE subject_group_id = ? AND school_id = ?', [id, schoolId]);

      if (subject_ids.length > 0) {
        const values = subject_ids.map((subjectId: number) => [schoolId, id, subjectId]);
        const placeholders = values.map(() => '(?, ?, ?)').join(', ');
        const flatValues = values.flat();

        await db.execute(
          `INSERT INTO subject_group_subjects (school_id, subject_group_id, subject_id) VALUES ${placeholders}`,
          flatValues
        );
      }
    }

    const [updatedGroups] = await db.execute(
      'SELECT * FROM subject_groups WHERE school_id = ? AND id = ?',
      [schoolId, id]
    ) as any[];

    res.json({
      success: true,
      message: 'Subject group updated successfully',
      data: updatedGroups[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubjectGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) return next(createError('School context required', 403));
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM subject_groups WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Subject group deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Class Teachers ==========
const resolveTeacherUserId = async (
  db: any,
  schoolId: number,
  teacherIdOrStaffId: number
): Promise<number> => {
  // Preferred path: provided value is user.id for an active teacher staff member.
  const [byUser] = await db.execute(
    `SELECT s.user_id
     FROM staff s
     INNER JOIN roles r ON s.role_id = r.id
     WHERE s.school_id = ? AND s.user_id = ? AND s.is_active = 1 AND r.name = 'teacher'
     LIMIT 1`,
    [schoolId, teacherIdOrStaffId]
  ) as any[];

  if (byUser.length > 0) {
    return Number(byUser[0].user_id);
  }

  // Backward compatibility: some screens may send staff.id instead of user.id.
  const [byStaff] = await db.execute(
    `SELECT s.user_id
     FROM staff s
     INNER JOIN roles r ON s.role_id = r.id
     WHERE s.school_id = ? AND s.id = ? AND s.is_active = 1 AND r.name = 'teacher'
     LIMIT 1`,
    [schoolId, teacherIdOrStaffId]
  ) as any[];

  if (byStaff.length > 0 && byStaff[0].user_id) {
    return Number(byStaff[0].user_id);
  }

  throw createError('Invalid teacher. The selected teacher is not active or not mapped to a user account.', 400);
};

export const getClassTeachers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { class_id, section_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT ct.id, ct.class_id, ct.section_id, ct.teacher_id, ct.created_at,
             c.name as class_name, s.name as section_name,
             u.name as teacher_name, u.email as teacher_email
       FROM class_teachers ct
       LEFT JOIN classes c ON ct.class_id = c.id AND c.school_id = ?
       LEFT JOIN sections s ON ct.section_id = s.id AND s.school_id = ?
       LEFT JOIN users u ON ct.teacher_id = u.id AND u.school_id = ?
       WHERE ct.school_id = ?
    `;
    const params: any[] = [schoolId, schoolId, schoolId, schoolId];

    if (class_id) {
      query += ' AND ct.class_id = ?';
      params.push(class_id);
    }
    if (section_id) {
      query += ' AND ct.section_id = ?';
      params.push(section_id);
    }

    const [teachers] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    next(error);
  }
};

export const assignClassTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { class_id, section_id, teacher_id } = req.body;

    if (!class_id || !section_id || !teacher_id) {
      throw createError('Class, section, and teacher are required', 400);
    }

    const db = getDatabase();

    const classId = Number(class_id);
    const sectionId = Number(section_id);
    const teacherInput = Number(teacher_id);
    const teacherUserId = await resolveTeacherUserId(db, schoolId, teacherInput);

    // Validate class/section linkage for this school.
    const [classSection] = await db.execute(
      `SELECT 1
       FROM class_sections
       WHERE school_id = ? AND class_id = ? AND section_id = ?
       LIMIT 1`,
      [schoolId, classId, sectionId]
    ) as any[];

    if (classSection.length === 0) {
      throw createError('Selected class and section are not linked in this school.', 400);
    }

    // Check if already assigned - get teacher name for better error message
    const [existing] = await db.execute(
      `SELECT ct.id, u.name as teacher_name, u.email as teacher_email
       FROM class_teachers ct
       INNER JOIN users u ON ct.teacher_id = u.id
       WHERE ct.school_id = ? AND ct.class_id = ? AND ct.section_id = ? AND ct.teacher_id = ?`,
      [schoolId, classId, sectionId, teacherUserId]
    ) as any[];

    if (existing.length > 0) {
      const teacherName = existing[0].teacher_name || 'Teacher';
      const teacherEmail = existing[0].teacher_email || '';
      throw createError(
        `Teacher "${teacherName}${teacherEmail ? ` (${teacherEmail})` : ''}" is already assigned to this class-section. Please check the Class Teachers List below.`,
        400
      );
    }

    const [result] = await db.execute(
      'INSERT INTO class_teachers (school_id, class_id, section_id, teacher_id, created_at) VALUES (?, ?, ?, ?, NOW())',
      [schoolId, classId, sectionId, teacherUserId]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Teacher assigned successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const removeClassTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM class_teachers WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Teacher removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Timetable ==========
export const getTimetable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { class_id, section_id } = req.query;
    const db = getDatabase();

    if (!class_id || !section_id) {
      throw createError('Class and section are required', 400);
    }

    const [timetable] = await db.execute(
      `SELECT tt.*, 
       sub.name as subject_name, sub.code as subject_code,
       u.name as teacher_name,
       c.name as class_name, s.name as section_name
       FROM class_timetable tt
       LEFT JOIN subjects sub ON tt.subject_id = sub.id AND sub.school_id = ?
       LEFT JOIN users u ON tt.teacher_id = u.id AND u.school_id = ?
       LEFT JOIN classes c ON tt.class_id = c.id AND c.school_id = ?
       LEFT JOIN sections s ON tt.section_id = s.id AND s.school_id = ?
       WHERE tt.school_id = ? AND tt.class_id = ? AND tt.section_id = ?
       ORDER BY 
         FIELD(tt.day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
         tt.time_from ASC`,
      [schoolId, schoolId, schoolId, schoolId, schoolId, class_id, section_id]
    ) as any[];

    res.json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    next(error);
  }
};

export const createTimetableEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { class_id, section_id, subject_group_id, subject_id, teacher_id, day_of_week, time_from, time_to, room_no } = req.body;

    if (!class_id || !section_id || !subject_id || !day_of_week || !time_from || !time_to) {
      throw createError('Class, section, subject, day, and time are required', 400);
    }

    const db = getDatabase();
    const classId = Number(class_id);
    const sectionId = Number(section_id);
    const subjectId = Number(subject_id);
    const subjectGroupId = subject_group_id ? Number(subject_group_id) : null;
    const teacherUserId = teacher_id ? await resolveTeacherUserId(db, schoolId, Number(teacher_id)) : null;

    const [classSection] = await db.execute(
      `SELECT 1 FROM class_sections WHERE school_id = ? AND class_id = ? AND section_id = ? LIMIT 1`,
      [schoolId, classId, sectionId]
    ) as any[];
    if (classSection.length === 0) {
      throw createError('Selected class/section combination is invalid for this school.', 400);
    }

    const [subjectExists] = await db.execute(
      `SELECT 1 FROM subjects WHERE school_id = ? AND id = ? LIMIT 1`,
      [schoolId, subjectId]
    ) as any[];
    if (subjectExists.length === 0) {
      throw createError('Selected subject does not exist in this school.', 400);
    }

    if (subjectGroupId != null) {
      const [subjectGroupExists] = await db.execute(
        `SELECT 1
         FROM subject_groups
         WHERE school_id = ? AND id = ? AND class_id = ? AND section_id = ?
         LIMIT 1`,
        [schoolId, subjectGroupId, classId, sectionId]
      ) as any[];
      if (subjectGroupExists.length === 0) {
        throw createError('Selected subject group is invalid for this class/section.', 400);
      }
    }

    const [result] = await db.execute(
      'INSERT INTO class_timetable (school_id, class_id, section_id, subject_group_id, subject_id, teacher_id, day_of_week, time_from, time_to, room_no, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [schoolId, classId, sectionId, subjectGroupId, subjectId, teacherUserId, day_of_week, time_from, time_to, room_no || null]
    ) as any;

    const [newEntries] = await db.execute(
      'SELECT * FROM class_timetable WHERE id = ? AND school_id = ?',
      [result.insertId, schoolId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Timetable entry created successfully',
      data: newEntries[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateTimetableEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { id } = req.params;
    const { subject_id, teacher_id, day_of_week, time_from, time_to, room_no } = req.body;
    const db = getDatabase();
    const [existingEntries] = await db.execute(
      'SELECT * FROM class_timetable WHERE id = ? AND school_id = ?',
      [id, schoolId]
    ) as any[];
    if (existingEntries.length === 0) {
      throw createError('Timetable entry not found', 404);
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (subject_id) {
      updates.push('subject_id = ?');
      params.push(subject_id);
    }
    if (teacher_id !== undefined) {
      updates.push('teacher_id = ?');
      if (teacher_id === null || teacher_id === '') {
        params.push(null);
      } else {
        const teacherUserId = await resolveTeacherUserId(db, schoolId, Number(teacher_id));
        params.push(teacherUserId);
      }
    }
    if (day_of_week) {
      updates.push('day_of_week = ?');
      params.push(day_of_week);
    }
    if (time_from) {
      updates.push('time_from = ?');
      params.push(time_from);
    }
    if (time_to) {
      updates.push('time_to = ?');
      params.push(time_to);
    }
    if (room_no !== undefined) {
      updates.push('room_no = ?');
      params.push(room_no);
    }

    if (updates.length === 0) {
      throw createError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id, schoolId);

    await db.execute(
      `UPDATE class_timetable SET ${updates.join(', ')} WHERE id = ? AND school_id = ?`,
      params
    );

    const [updatedEntries] = await db.execute(
      'SELECT * FROM class_timetable WHERE id = ? AND school_id = ?',
      [id, schoolId]
    ) as any[];

    res.json({
      success: true,
      message: 'Timetable entry updated successfully',
      data: updatedEntries[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTimetableEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM class_timetable WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Timetable entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherTimetable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = getSchoolId(req);
    if (schoolId == null) return next(createError('School context required', 403));
    const { teacher_id } = req.query;
    const db = getDatabase();

    if (!teacher_id) {
      throw createError('Teacher ID is required', 400);
    }

    const teacherUserId = await resolveTeacherUserId(db, schoolId, Number(teacher_id));

    const [timetable] = await db.execute(
      `SELECT tt.*, 
       sub.name as subject_name, sub.code as subject_code,
       u.name as teacher_name,
       c.name as class_name, s.name as section_name
       FROM class_timetable tt
       LEFT JOIN subjects sub ON tt.subject_id = sub.id AND sub.school_id = ?
       LEFT JOIN users u ON tt.teacher_id = u.id AND u.school_id = ?
       LEFT JOIN classes c ON tt.class_id = c.id AND c.school_id = ?
       LEFT JOIN sections s ON tt.section_id = s.id AND s.school_id = ?
       WHERE tt.school_id = ? AND tt.teacher_id = ?
       ORDER BY 
         FIELD(tt.day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
         tt.time_from ASC`,
      [schoolId, schoolId, schoolId, schoolId, schoolId, teacherUserId]
    ) as any[];

    res.json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    next(error);
  }
};

