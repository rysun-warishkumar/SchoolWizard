import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

// ========== Departments ==========
export const getDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [departments] = await db.execute('SELECT * FROM departments ORDER BY name ASC') as any[];
    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim() === '') {
      throw createError('Department name is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO departments (name, description) VALUES (?, ?)',
      [name.trim(), description || null]
    ) as any;

    const [newDepartments] = await db.execute(
      'SELECT * FROM departments WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: newDepartments[0],
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Department with this name already exists', 400);
    }
    next(error);
  }
};

// ========== Designations ==========
export const getDesignations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [designations] = await db.execute('SELECT * FROM designations ORDER BY name ASC') as any[];
    res.json({ success: true, data: designations });
  } catch (error) {
    next(error);
  }
};

export const createDesignation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim() === '') {
      throw createError('Designation name is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO designations (name, description) VALUES (?, ?)',
      [name.trim(), description || null]
    ) as any;

    const [newDesignations] = await db.execute(
      'SELECT * FROM designations WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Designation created successfully',
      data: newDesignations[0],
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Designation with this name already exists', 400);
    }
    next(error);
  }
};

// ========== Leave Types ==========
export const getLeaveTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [leaveTypes] = await db.execute('SELECT * FROM leave_types ORDER BY name ASC') as any[];
    res.json({ success: true, data: leaveTypes });
  } catch (error) {
    next(error);
  }
};

export const createLeaveType = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, max_days, is_paid } = req.body;
    if (!name || name.trim() === '') {
      throw createError('Leave type name is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO leave_types (name, description, max_days, is_paid) VALUES (?, ?, ?, ?)',
      [name.trim(), description || null, max_days || null, is_paid !== undefined ? (is_paid ? 1 : 0) : 1]
    ) as any;

    const [newLeaveTypes] = await db.execute(
      'SELECT * FROM leave_types WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Leave type created successfully',
      data: newLeaveTypes[0],
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Leave type with this name already exists', 400);
    }
    next(error);
  }
};

// ========== Staff ==========
export const getStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role_id, department_id, search, is_active, page, limit } = req.query;
    const db = getDatabase();

    // Validate and sanitize pagination parameters
    let pageNumber = 1;
    let limitNumber = 20;

    // Validate page parameter
    if (page !== undefined) {
      const parsedPage = Number(page);
      if (isNaN(parsedPage) || parsedPage < 1 || !Number.isInteger(parsedPage)) {
        throw createError('Invalid page number. Page must be a positive integer.', 400);
      }
      pageNumber = parsedPage;
    }

    // Validate limit parameter
    if (limit !== undefined) {
      const parsedLimit = Number(limit);
      if (isNaN(parsedLimit) || parsedLimit < 1 || !Number.isInteger(parsedLimit)) {
        throw createError('Invalid limit value. Limit must be a positive integer.', 400);
      }
      // Set maximum limit to prevent performance issues
      if (parsedLimit > 100) {
        throw createError('Limit cannot exceed 100 records per page. Please use a smaller limit.', 400);
      }
      limitNumber = parsedLimit;
    }

    // Validate role_id if provided
    if (role_id !== undefined) {
      const parsedRoleId = Number(role_id);
      if (isNaN(parsedRoleId) || parsedRoleId < 1 || !Number.isInteger(parsedRoleId)) {
        throw createError('Invalid role ID. Role ID must be a positive integer.', 400);
      }
    }

    // Validate department_id if provided
    if (department_id !== undefined) {
      const parsedDepartmentId = Number(department_id);
      if (isNaN(parsedDepartmentId) || parsedDepartmentId < 1 || !Number.isInteger(parsedDepartmentId)) {
        throw createError('Invalid department ID. Department ID must be a positive integer.', 400);
      }
    }

    // Validate search term length
    if (search && typeof search === 'string' && search.length > 100) {
      throw createError('Search term is too long. Maximum 100 characters allowed.', 400);
    }

    let query = `
      SELECT s.*, 
       r.name as role_name,
       d.name as department_name,
       des.name as designation_name
       FROM staff s
       LEFT JOIN roles r ON s.role_id = r.id
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN designations des ON s.designation_id = des.id
       WHERE 1=1
    `;
    const params: any[] = [];

    if (is_active !== undefined) {
      query += ' AND s.is_active = ?';
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    if (role_id) {
      query += ' AND s.role_id = ?';
      params.push(Number(role_id));
    }

    if (department_id) {
      query += ' AND s.department_id = ?';
      params.push(Number(department_id));
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.staff_id LIKE ? OR s.email LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Support filtering by user_id for staff panel
    const user_id = (req as any).query?.user_id;
    if (user_id) {
      const parsedUserId = Number(user_id);
      if (isNaN(parsedUserId) || parsedUserId < 1 || !Number.isInteger(parsedUserId)) {
        throw createError('Invalid user ID. User ID must be a positive integer.', 400);
      }
      query += ' AND s.user_id = ?';
      params.push(parsedUserId);
    }

    query += ' ORDER BY s.first_name ASC';

    // Calculate pagination offset
    const offset = (pageNumber - 1) * limitNumber;
    
    // Validate offset is not negative
    if (offset < 0) {
      throw createError('Invalid pagination offset. Please check page and limit values.', 400);
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(limitNumber, offset);

    const [staff] = await db.execute(query, params) as any[];

    // Get total count with same filters
    let countQuery = 'SELECT COUNT(*) as total FROM staff WHERE 1=1';
    const countParams: any[] = [];

    if (is_active !== undefined) {
      countQuery += ' AND is_active = ?';
      countParams.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }
    if (role_id) {
      countQuery += ' AND role_id = ?';
      countParams.push(Number(role_id));
    }
    if (department_id) {
      countQuery += ' AND department_id = ?';
      countParams.push(Number(department_id));
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      countQuery += ' AND (first_name LIKE ? OR last_name LIKE ? OR staff_id LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (user_id) {
      countQuery += ' AND user_id = ?';
      countParams.push(Number(user_id));
    }

    const [countResult] = await db.execute(countQuery, countParams) as any[];
    const total = Number(countResult[0].total);
    
    // Calculate total pages
    const pages = total > 0 ? Math.ceil(total / limitNumber) : 0;

    // Validate that requested page exists - auto-correct instead of throwing error
    if (pageNumber > pages && pages > 0) {
      pageNumber = pages;
    } else if (total === 0 && pageNumber > 1) {
      // If no results, reset to page 1
      pageNumber = 1;
    }

    res.json({
      success: true,
      data: staff || [],
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages,
        hasNextPage: pageNumber < pages,
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error: any) {
    // If it's already a createError, pass it through
    if (error.statusCode) {
      next(error);
    } else {
      // Otherwise, wrap it
      next(createError(error.message || 'Failed to fetch staff list', 500));
    }
  }
};

// Get current staff member's profile (for staff panel)
export const getMyStaffProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const db = getDatabase();

    // Find staff by user_id
    const [staff] = await db.execute(
      `SELECT s.*, 
       r.name as role_name,
       d.name as department_name,
       des.name as designation_name
       FROM staff s
       LEFT JOIN roles r ON s.role_id = r.id
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN designations des ON s.designation_id = des.id
       WHERE s.user_id = ?`,
      [req.user.id]
    ) as any[];

    if (staff.length === 0) {
      throw createError('Staff profile not found', 404);
    }

    // Get documents
    const [documents] = await db.execute(
      'SELECT * FROM staff_documents WHERE staff_id = ?',
      [staff[0].id]
    ) as any[];

    const staffMember = staff[0];
    staffMember.documents = documents;

    res.json({
      success: true,
      data: staffMember,
    });
  } catch (error) {
    next(error);
  }
};

// Get classes assigned to current staff member (for staff panel)
export const getMyClasses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const db = getDatabase();

    // Get classes from class_teachers table
    const [classTeachers] = await db.execute(
      `SELECT DISTINCT
        ct.class_id,
        ct.section_id,
        c.name as class_name,
        s.name as section_name,
        c.numeric_value
      FROM class_teachers ct
      JOIN classes c ON ct.class_id = c.id
      JOIN sections s ON ct.section_id = s.id
      WHERE ct.teacher_id = ?
      ORDER BY c.numeric_value ASC, c.name ASC, s.name ASC`,
      [req.user.id]
    ) as any[];

    // Get subjects from timetable where teacher is assigned
    const [timetableSubjects] = await db.execute(
      `SELECT DISTINCT
        ct.class_id,
        ct.section_id,
        ct.subject_id,
        sub.name as subject_name,
        sub.code as subject_code
      FROM class_timetable ct
      JOIN subjects sub ON ct.subject_id = sub.id
      WHERE ct.teacher_id = ?
      ORDER BY sub.name ASC`,
      [req.user.id]
    ) as any[];

    // Group subjects by class-section
    const classesWithSubjects = classTeachers.map((ct: any) => {
      const subjects = timetableSubjects.filter(
        (ts: any) => ts.class_id === ct.class_id && ts.section_id === ct.section_id
      );
      return {
        ...ct,
        subjects: subjects.map((s: any) => ({
          id: s.subject_id,
          name: s.subject_name,
          code: s.subject_code,
        })),
      };
    });

    res.json({
      success: true,
      data: classesWithSubjects,
    });
  } catch (error) {
    next(error);
  }
};

// Get students for classes assigned to current staff member (for staff panel)
export const getMyStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { class_id, section_id } = req.query;
    const db = getDatabase();

    // Get classes assigned to this teacher
    const [assignedClasses] = await db.execute(
      `SELECT DISTINCT class_id, section_id
       FROM class_teachers
       WHERE teacher_id = ?`,
      [req.user.id]
    ) as any[];

    if (assignedClasses.length === 0) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    // Build query to get students from assigned classes
    let query = `
      SELECT s.*,
        c.name as class_name,
        sec.name as section_name,
        cat.name as category_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN student_categories cat ON s.category_id = cat.id
      WHERE s.is_active = 1
      AND (
    `;

    const params: any[] = [];
    assignedClasses.forEach((ac: any, index: number) => {
      if (index > 0) query += ' OR ';
      query += '(s.class_id = ? AND s.section_id = ?)';
      params.push(ac.class_id, ac.section_id);
    });

    query += ')';

    // Filter by specific class-section if provided
    if (class_id && section_id) {
      query += ' AND s.class_id = ? AND s.section_id = ?';
      params.push(class_id, section_id);
    }

    query += ' ORDER BY s.admission_no ASC';

    const [students] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// Get timetable for current staff member (for staff panel)
export const getMyTimetable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const db = getDatabase();

    // Get timetable entries where this teacher is assigned
    const [timetable] = await db.execute(
      `SELECT tt.*, 
       sub.name as subject_name, sub.code as subject_code,
       c.name as class_name, s.name as section_name
       FROM class_timetable tt
       LEFT JOIN subjects sub ON tt.subject_id = sub.id
       LEFT JOIN classes c ON tt.class_id = c.id
       LEFT JOIN sections s ON tt.section_id = s.id
       WHERE tt.teacher_id = ?
       ORDER BY 
         FIELD(tt.day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
         tt.time_from ASC`,
      [req.user.id]
    ) as any[];

    res.json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    next(error);
  }
};

export const getStaffById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [staff] = await db.execute(
      `SELECT s.*, 
       r.name as role_name,
       d.name as department_name,
       des.name as designation_name
       FROM staff s
       LEFT JOIN roles r ON s.role_id = r.id
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN designations des ON s.designation_id = des.id
       WHERE s.id = ?`,
      [id]
    ) as any[];

    if (staff.length === 0) {
      throw createError('Staff member not found', 404);
    }

    // Get documents
    const [documents] = await db.execute(
      'SELECT * FROM staff_documents WHERE staff_id = ?',
      [id]
    ) as any[];

    const staffMember = staff[0];
    staffMember.documents = documents;

    res.json({
      success: true,
      data: staffMember,
    });
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      staff_id,
      role_id,
      designation_id,
      department_id,
      first_name,
      last_name,
      father_name,
      mother_name,
      gender,
      marital_status,
      date_of_birth,
      date_of_joining,
      phone,
      emergency_contact,
      email,
      photo,
      current_address,
      permanent_address,
      qualification,
      work_experience,
      note,
      epf_no,
      basic_salary,
      contract_type,
      work_shift,
      location,
      number_of_leaves,
      bank_account_title,
      bank_account_number,
      bank_name,
      ifsc_code,
      bank_branch_name,
      facebook_url,
      twitter_url,
      linkedin_url,
      instagram_url,
    } = req.body;

    // Validation
    if (!staff_id || staff_id.trim() === '') {
      throw createError('Staff ID is required', 400);
    }
    if (!role_id) {
      throw createError('Role is required', 400);
    }
    if (!first_name || first_name.trim() === '') {
      throw createError('First name is required', 400);
    }
    if (!date_of_joining) {
      throw createError('Date of joining is required', 400);
    }

    const db = getDatabase();

    // Check if staff_id already exists
    const [existingStaff] = await db.execute(
      'SELECT id FROM staff WHERE staff_id = ?',
      [staff_id.trim()]
    ) as any[];

    if (existingStaff.length > 0) {
      throw createError('Staff ID already exists', 400);
    }

    // Create user account if email is provided
    let userId = null;
    if (email && email.trim() !== '') {
      try {
        const defaultPassword = 'staff123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const [userResult] = await db.execute(
          'INSERT INTO users (email, password, name, role_id, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
          [email.trim(), hashedPassword, `${first_name} ${last_name || ''}`.trim(), role_id]
        ) as any;
        userId = userResult.insertId;
      } catch (userError: any) {
        if (userError.code === 'ER_DUP_ENTRY' && userError.message.includes('email')) {
          throw createError(`An account with email "${email}" already exists. Please use a different email address.`, 400);
        }
        throw userError;
      }
    }

    // Create staff member
    // Get actual table structure from database to ensure we match exactly
    const [tableColumns] = await db.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'staff'
        AND COLUMN_NAME NOT IN ('id', 'created_at', 'updated_at', 'leaving_date', 'resignation_letter')
        ORDER BY ORDINAL_POSITION
      `) as any[];

    const actualColumns = tableColumns.map((col: any) => col.COLUMN_NAME);

    // Create a map of field values
    const fieldMap: Record<string, any> = {
      staff_id: staff_id.trim(),
      user_id: userId,
      role_id: Number(role_id),
      designation_id: designation_id ? Number(designation_id) : null,
      department_id: department_id ? Number(department_id) : null,
      first_name: first_name.trim(),
      last_name: last_name ? last_name.trim() : null,
      father_name: father_name ? father_name.trim() : null,
      mother_name: mother_name ? mother_name.trim() : null,
      gender: gender || 'male',
      marital_status: marital_status || 'single',
      date_of_birth: date_of_birth || null,
      date_of_joining: date_of_joining,
      phone: phone ? phone.trim() : null,
      emergency_contact: emergency_contact ? emergency_contact.trim() : null,
      email: email ? email.trim() : null,
      photo: photo || null,
      current_address: current_address ? current_address.trim() : null,
      permanent_address: permanent_address ? permanent_address.trim() : null,
      qualification: qualification ? qualification.trim() : null,
      work_experience: work_experience ? work_experience.trim() : null,
      note: note ? note.trim() : null,
      epf_no: epf_no ? epf_no.trim() : null,
      basic_salary: basic_salary ? Number(basic_salary) : 0,
      contract_type: contract_type || 'permanent',
      work_shift: work_shift || 'morning',
      location: location ? location.trim() : null,
      number_of_leaves: number_of_leaves ? Number(number_of_leaves) : 0,
      bank_account_title: bank_account_title ? bank_account_title.trim() : null,
      bank_account_number: bank_account_number ? bank_account_number.trim() : null,
      bank_name: bank_name ? bank_name.trim() : null,
      ifsc_code: ifsc_code ? ifsc_code.trim() : null,
      bank_branch_name: bank_branch_name ? bank_branch_name.trim() : null,
      facebook_url: facebook_url ? facebook_url.trim() : null,
      twitter_url: twitter_url ? twitter_url.trim() : null,
      linkedin_url: linkedin_url ? linkedin_url.trim() : null,
      instagram_url: instagram_url ? instagram_url.trim() : null,
      is_active: 1, // default to active
    };

    // Build columns and values arrays in the exact order they appear in the database
    const columns: string[] = [];
    const values: any[] = [];

    for (const colName of actualColumns) {
      if (fieldMap.hasOwnProperty(colName)) {
        columns.push(colName);
        values.push(fieldMap[colName]);
      } else {
        // Column exists in DB but not in our fieldMap - use null
        columns.push(colName);
        values.push(null);
      }
    }

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n=== INSERT Statement Debug (Staff) ===`);
      console.log(`Actual table columns count: ${actualColumns.length}`);
      console.log(`Columns to insert: ${columns.length}`);
      console.log(`Values count: ${values.length}`);
      console.log(`Columns:`, columns);
    }

    // Verify counts match
    if (columns.length !== values.length) {
      console.error(`Column count (${columns.length}) doesn't match values count (${values.length})`);
      throw createError(`Internal error: Column count mismatch. Please contact support.`, 500);
    }

    // Build placeholders
    const placeholders = columns.map(() => '?').join(', ');

    // Note: created_at and updated_at have DEFAULT CURRENT_TIMESTAMP, so we don't need to include them
    // Also note: leaving_date and resignation_letter are not included (only set when disabling)
    const [result] = await db.execute(
      `INSERT INTO staff (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    ) as any;

    // Verify the insert was successful
    if (!result || !result.insertId) {
      throw createError('Failed to create staff record. Please try again.', 500);
    }

    const [newStaff] = await db.execute(
      'SELECT * FROM staff WHERE id = ?',
      [result.insertId]
    ) as any[];

    const staffName = `${first_name} ${last_name || ''}`.trim();
    res.status(201).json({
      success: true,
      message: `Staff member "${staffName}" has been added successfully with Staff ID: ${staff_id}`,
      data: newStaff[0],
    });
    return; // Ensure no further response is sent
  } catch (error: any) {
    // Handle duplicate entry errors
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('staff_id')) {
        throw createError('Staff ID already exists. Please use a different Staff ID.', 400);
      }
      if (error.message.includes('email')) {
        const emailValue = req.body.email || 'provided email';
        throw createError(`An account with email "${emailValue}" already exists. Please use a different email address.`, 400);
      }
    }
    next(error);
  }
};

export const updateStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const db = getDatabase();

    // Build dynamic update query
    const allowedFields = [
      'staff_id', 'role_id', 'designation_id', 'department_id',
      'first_name', 'last_name', 'father_name', 'mother_name', 'gender', 'marital_status',
      'date_of_birth', 'date_of_joining', 'phone', 'emergency_contact', 'email', 'photo',
      'current_address', 'permanent_address', 'qualification', 'work_experience', 'note',
      'epf_no', 'basic_salary', 'contract_type', 'work_shift', 'location', 'number_of_leaves',
      'bank_account_title', 'bank_account_number', 'bank_name', 'ifsc_code', 'bank_branch_name',
      'facebook_url', 'twitter_url', 'linkedin_url', 'instagram_url',
      'is_active', 'leaving_date', 'resignation_letter',
    ];

    const updateFields: string[] = [];
    const params: any[] = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      throw createError('No fields to update', 400);
    }

    updateFields.push('updated_at = NOW()');
    params.push(id);

    await db.execute(
      `UPDATE staff SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    const [updatedStaff] = await db.execute(
      'SELECT * FROM staff WHERE id = ?',
      [id]
    ) as any[];

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: updatedStaff[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if staff exists
    const [staff] = await db.execute('SELECT * FROM staff WHERE id = ?', [id]) as any[];
    if (staff.length === 0) {
      throw createError('Staff member not found', 404);
    }

    // Only allow deletion if staff is disabled
    if (staff[0].is_active) {
      throw createError('Cannot delete active staff member. Please disable the staff member first.', 400);
    }

    await db.execute('DELETE FROM staff WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const disableStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { leaving_date, resignation_letter } = req.body;
    const db = getDatabase();

    await db.execute(
      'UPDATE staff SET is_active = 0, leaving_date = ?, resignation_letter = ?, updated_at = NOW() WHERE id = ?',
      [leaving_date || null, resignation_letter || null, id]
    );

    // Also disable user account if exists
    const [staff] = await db.execute('SELECT user_id FROM staff WHERE id = ?', [id]) as any[];
    if (staff[0].user_id) {
      await db.execute('UPDATE users SET is_active = 0 WHERE id = ?', [staff[0].user_id]);
    }

    res.json({
      success: true,
      message: 'Staff member disabled successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const enableStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute(
      'UPDATE staff SET is_active = 1, updated_at = NOW() WHERE id = ?',
      [id]
    );

    // Also enable user account if exists
    const [staff] = await db.execute('SELECT user_id FROM staff WHERE id = ?', [id]) as any[];
    if (staff[0].user_id) {
      await db.execute('UPDATE users SET is_active = 1 WHERE id = ?', [staff[0].user_id]);
    }

    res.json({
      success: true,
      message: 'Staff member enabled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Staff Attendance ==========
export const getStaffAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role_id, attendance_date } = req.query;
    const db = getDatabase();

    if (!attendance_date) {
      throw createError('Attendance date is required', 400);
    }

    let query = `
      SELECT 
        s.id,
        s.staff_id,
        s.first_name,
        s.last_name,
        s.photo,
        r.name as role_name,
        d.name as department_name,
        sa.status,
        sa.check_in_time,
        sa.check_out_time,
        sa.note
      FROM staff s
      LEFT JOIN roles r ON s.role_id = r.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN staff_attendance sa ON s.id = sa.staff_id AND sa.attendance_date = ?
      WHERE s.is_active = 1
    `;
    const params: any[] = [attendance_date];

    if (role_id) {
      query += ' AND s.role_id = ?';
      params.push(role_id);
    }

    query += ' ORDER BY s.first_name ASC';

    const [staff] = await db.execute(query, params) as any[];

    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const submitStaffAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { attendance_date, is_holiday, attendance_records } = req.body;

    if (!attendance_date) {
      throw createError('Attendance date is required', 400);
    }

    if (is_holiday) {
      // Mark all active staff as holiday
      const db = getDatabase();
      const [staff] = await db.execute(
        'SELECT id FROM staff WHERE is_active = 1'
      ) as any[];

      for (const member of staff) {
        await db.execute(
          `INSERT INTO staff_attendance (staff_id, attendance_date, status, note)
           VALUES (?, ?, 'holiday', 'Holiday')
           ON DUPLICATE KEY UPDATE status = 'holiday', note = 'Holiday', updated_at = NOW()`,
          [member.id, attendance_date]
        );
      }

      res.json({
        success: true,
        message: `Holiday marked for all staff on ${attendance_date}`,
      });
      return;
    }

    if (!attendance_records || !Array.isArray(attendance_records) || attendance_records.length === 0) {
      throw createError('Attendance records are required', 400);
    }

    const db = getDatabase();

    for (const record of attendance_records) {
      const { staff_id, status, check_in_time, check_out_time, note } = record;

      if (!staff_id || !status) {
        continue; // Skip invalid records
      }

      await db.execute(
        `INSERT INTO staff_attendance (staff_id, attendance_date, status, check_in_time, check_out_time, note)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           status = VALUES(status),
           check_in_time = VALUES(check_in_time),
           check_out_time = VALUES(check_out_time),
           note = VALUES(note),
           updated_at = NOW()`,
        [staff_id, attendance_date, status, check_in_time || null, check_out_time || null, note || null]
      );
    }

    res.json({
      success: true,
      message: 'Staff attendance submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getStaffAttendanceReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { staff_id, month, year, role_id } = req.query;
    const db = getDatabase();

    if (!month || !year) {
      throw createError('Month and year are required', 400);
    }

    let query = `
      SELECT 
        s.id,
        s.staff_id,
        s.first_name,
        s.last_name,
        r.name as role_name,
        d.name as department_name,
        COUNT(CASE WHEN sa.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN sa.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN sa.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN sa.status = 'half_day' THEN 1 END) as half_day_count,
        COUNT(CASE WHEN sa.status = 'holiday' THEN 1 END) as holiday_count,
        COUNT(sa.id) as total_days,
        ROUND(
          (COUNT(CASE WHEN sa.status IN ('present', 'late', 'half_day') THEN 1 END) * 100.0 / 
           NULLIF(COUNT(sa.id), 0)), 2
        ) as gross_present_percentage
      FROM staff s
      LEFT JOIN roles r ON s.role_id = r.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN staff_attendance sa ON s.id = sa.staff_id 
        AND MONTH(sa.attendance_date) = ? 
        AND YEAR(sa.attendance_date) = ?
      WHERE s.is_active = 1
    `;
    const params: any[] = [month, year];

    if (staff_id) {
      query += ' AND s.id = ?';
      params.push(staff_id);
    }

    if (role_id) {
      query += ' AND s.role_id = ?';
      params.push(role_id);
    }

    query += ' GROUP BY s.id, s.staff_id, s.first_name, s.last_name, r.name, d.name ORDER BY s.first_name ASC';

    const [report] = await db.execute(query, params) as any[];

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// ========== Leave Requests ==========
export const getLeaveRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { staff_id, status, page = 1, limit = 20 } = req.query;
    const db = getDatabase();
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        lr.id,
        lr.staff_id,
        lr.leave_type_id,
        lr.apply_date,
        lr.leave_date,
        lr.reason,
        lr.note,
        lr.document_path,
        lr.status,
        lr.approved_by,
        lr.approved_at,
        lr.created_at,
        s.staff_id as staff_staff_id,
        s.first_name,
        s.last_name,
        s.photo,
        lt.name as leave_type_name,
        u.name as approved_by_name
      FROM leave_requests lr
      INNER JOIN staff s ON lr.staff_id = s.id
      INNER JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users u ON lr.approved_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (staff_id) {
      query += ' AND lr.staff_id = ?';
      params.push(staff_id);
    }

    if (status) {
      query += ' AND lr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY lr.leave_date DESC, lr.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [leaveRequests] = await db.execute(query, params) as any[];

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM leave_requests lr
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (staff_id) {
      countQuery += ' AND lr.staff_id = ?';
      countParams.push(staff_id);
    }

    if (status) {
      countQuery += ' AND lr.status = ?';
      countParams.push(status);
    }

    const [countResult] = await db.execute(countQuery, countParams) as any[];
    const total = countResult[0].total;

    res.json({
      success: true,
      data: leaveRequests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [leaveRequests] = await db.execute(
      `SELECT 
        lr.*,
        s.staff_id as staff_staff_id,
        s.first_name,
        s.last_name,
        s.photo,
        lt.name as leave_type_name,
        u.name as approved_by_name
      FROM leave_requests lr
      INNER JOIN staff s ON lr.staff_id = s.id
      INNER JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users u ON lr.approved_by = u.id
      WHERE lr.id = ?`,
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

export const createLeaveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { staff_id, leave_type_id, apply_date, leave_date, reason, note, document_path } = req.body;

    if (!staff_id) {
      throw createError('Staff ID is required', 400);
    }
    if (!leave_type_id) {
      throw createError('Leave type is required', 400);
    }
    if (!apply_date) {
      throw createError('Apply date is required', 400);
    }
    if (!leave_date) {
      throw createError('Leave date is required', 400);
    }

    const db = getDatabase();

    // Verify staff exists
    const [staff] = await db.execute('SELECT id FROM staff WHERE id = ? AND is_active = 1', [staff_id]) as any[];
    if (staff.length === 0) {
      throw createError('Staff member not found or inactive', 404);
    }

    // Verify leave type exists
    const [leaveType] = await db.execute('SELECT id FROM leave_types WHERE id = ?', [leave_type_id]) as any[];
    if (leaveType.length === 0) {
      throw createError('Leave type not found', 404);
    }

    const [result] = await db.execute(
      `INSERT INTO leave_requests (staff_id, leave_type_id, apply_date, leave_date, reason, note, document_path, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [staff_id, leave_type_id, apply_date, leave_date, reason || null, note || null, document_path || null]
    ) as any;

    const [newRequest] = await db.execute(
      `SELECT 
        lr.*,
        s.staff_id as staff_staff_id,
        s.first_name,
        s.last_name,
        lt.name as leave_type_name
      FROM leave_requests lr
      INNER JOIN staff s ON lr.staff_id = s.id
      INNER JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.id = ?`,
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: newRequest[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateLeaveRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note, approved_by } = req.body;

    if (!status) {
      throw createError('Status is required', 400);
    }

    if (!['pending', 'approved', 'disapproved'].includes(status)) {
      throw createError('Invalid status. Must be pending, approved, or disapproved', 400);
    }

    const db = getDatabase();

    // Get current leave request
    const [leaveRequests] = await db.execute('SELECT * FROM leave_requests WHERE id = ?', [id]) as any[];
    if (leaveRequests.length === 0) {
      throw createError('Leave request not found', 404);
    }

    const updateData: any = {
      status,
      note: note || null,
    };

    if (status === 'approved' || status === 'disapproved') {
      updateData.approved_by = approved_by || req.user?.id;
      updateData.approved_at = new Date();
    } else {
      updateData.approved_by = null;
      updateData.approved_at = null;
    }

    await db.execute(
      `UPDATE leave_requests 
       SET status = ?, note = ?, approved_by = ?, approved_at = ?, updated_at = NOW()
       WHERE id = ?`,
      [updateData.status, updateData.note, updateData.approved_by, updateData.approved_at, id]
    );

    const [updatedRequest] = await db.execute(
      `SELECT 
        lr.*,
        s.staff_id as staff_staff_id,
        s.first_name,
        s.last_name,
        lt.name as leave_type_name,
        u.name as approved_by_name
      FROM leave_requests lr
      INNER JOIN staff s ON lr.staff_id = s.id
      INNER JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users u ON lr.approved_by = u.id
      WHERE lr.id = ?`,
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

export const deleteLeaveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [result] = await db.execute('DELETE FROM leave_requests WHERE id = ?', [id]) as any;

    if (result.affectedRows === 0) {
      throw createError('Leave request not found', 404);
    }

    res.json({
      success: true,
      message: 'Leave request deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Payroll ==========
export const getPayroll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role_id, month, year, status, page = 1, limit = 20 } = req.query;
    const db = getDatabase();

    if (!month || !year) {
      throw createError('Month and year are required', 400);
    }

    let query = `
      SELECT 
        p.id,
        p.staff_id,
        p.month,
        p.year,
        p.basic_salary,
        p.total_earnings,
        p.total_deductions,
        p.tax,
        p.net_salary,
        p.status,
        p.payment_date,
        p.payment_mode,
        p.payment_note,
        s.staff_id as staff_staff_id,
        s.first_name,
        s.last_name,
        s.photo,
        r.name as role_name,
        d.name as department_name
      FROM payroll p
      INNER JOIN staff s ON p.staff_id = s.id
      LEFT JOIN roles r ON s.role_id = r.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE p.month = ? AND p.year = ?
    `;
    const params: any[] = [month, year];

    if (role_id) {
      query += ' AND s.role_id = ?';
      params.push(role_id);
    }

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY s.first_name ASC';

    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [payroll] = await db.execute(query, params) as any[];

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM payroll p
      INNER JOIN staff s ON p.staff_id = s.id
      WHERE p.month = ? AND p.year = ?
    `;
    const countParams: any[] = [month, year];

    if (role_id) {
      countQuery += ' AND s.role_id = ?';
      countParams.push(role_id);
    }

    if (status) {
      countQuery += ' AND p.status = ?';
      countParams.push(status);
    }

    const [countResult] = await db.execute(countQuery, countParams) as any[];
    const total = countResult[0].total;

    res.json({
      success: true,
      data: payroll,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [payroll] = await db.execute(
      `SELECT 
        p.*,
        s.staff_id as staff_staff_id,
        s.first_name,
        s.last_name,
        s.photo,
        s.basic_salary as staff_basic_salary,
        r.name as role_name,
        d.name as department_name
      FROM payroll p
      INNER JOIN staff s ON p.staff_id = s.id
      LEFT JOIN roles r ON s.role_id = r.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE p.id = ?`,
      [id]
    ) as any[];

    if (payroll.length === 0) {
      throw createError('Payroll not found', 404);
    }

    // Get earnings
    const [earnings] = await db.execute(
      'SELECT * FROM payroll_earnings WHERE payroll_id = ?',
      [id]
    ) as any[];

    // Get deductions
    const [deductions] = await db.execute(
      'SELECT * FROM payroll_deductions WHERE payroll_id = ?',
      [id]
    ) as any[];

    res.json({
      success: true,
      data: {
        ...payroll[0],
        earnings,
        deductions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const generatePayroll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { staff_id, month, year, basic_salary, earnings, deductions, tax } = req.body;

    if (!staff_id || !month || !year) {
      throw createError('Staff ID, month, and year are required', 400);
    }

    const db = getDatabase();

    // Verify staff exists
    const [staff] = await db.execute('SELECT id, basic_salary FROM staff WHERE id = ? AND is_active = 1', [staff_id]) as any[];
    if (staff.length === 0) {
      throw createError('Staff member not found or inactive', 404);
    }

    // Check if payroll already exists
    const [existing] = await db.execute(
      'SELECT id FROM payroll WHERE staff_id = ? AND month = ? AND year = ?',
      [staff_id, month, year]
    ) as any[];

    if (existing.length > 0) {
      throw createError('Payroll for this staff member and month already exists', 400);
    }

    const basicSalary = basic_salary || staff[0].basic_salary || 0;
    const totalEarnings = Number(earnings?.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0) || 0) + basicSalary;
    const totalDeductions = Number(deductions?.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0) || 0);
    const taxAmount = Number(tax || 0);
    const netSalary = totalEarnings - totalDeductions - taxAmount;

    // Create payroll
    const [result] = await db.execute(
      `INSERT INTO payroll (staff_id, month, year, basic_salary, total_earnings, total_deductions, tax, net_salary, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'generated')`,
      [staff_id, month, year, basicSalary, totalEarnings, totalDeductions, taxAmount, netSalary]
    ) as any;

    const payrollId = result.insertId;

    // Add earnings
    if (earnings && Array.isArray(earnings)) {
      for (const earning of earnings) {
        if (earning.earning_type && earning.amount) {
          await db.execute(
            'INSERT INTO payroll_earnings (payroll_id, earning_type, amount) VALUES (?, ?, ?)',
            [payrollId, earning.earning_type, earning.amount]
          );
        }
      }
    }

    // Add deductions
    if (deductions && Array.isArray(deductions)) {
      for (const deduction of deductions) {
        if (deduction.deduction_type && deduction.amount) {
          await db.execute(
            'INSERT INTO payroll_deductions (payroll_id, deduction_type, amount) VALUES (?, ?, ?)',
            [payrollId, deduction.deduction_type, deduction.amount]
          );
        }
      }
    }

    const [newPayroll] = await db.execute(
      `SELECT 
        p.*,
        s.staff_id as staff_staff_id,
        s.first_name,
        s.last_name,
        r.name as role_name
      FROM payroll p
      INNER JOIN staff s ON p.staff_id = s.id
      LEFT JOIN roles r ON s.role_id = r.id
      WHERE p.id = ?`,
      [payrollId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Payroll generated successfully',
      data: newPayroll[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updatePayroll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { basic_salary, earnings, deductions, tax, status, payment_date, payment_mode, payment_note } = req.body;

    const db = getDatabase();

    // Get existing payroll
    const [existing] = await db.execute('SELECT * FROM payroll WHERE id = ?', [id]) as any[];
    if (existing.length === 0) {
      throw createError('Payroll not found', 404);
    }

    const payroll = existing[0];

    // If status is being updated to 'paid', require payment details
    if (status === 'paid' && !payment_date) {
      throw createError('Payment date is required when marking payroll as paid', 400);
    }

    // Calculate new totals if earnings/deductions are updated
    let totalEarnings = payroll.total_earnings;
    let totalDeductions = payroll.total_deductions;
    let netSalary = payroll.net_salary;

    if (earnings || deductions || basic_salary !== undefined || tax !== undefined) {
      // Get current earnings and deductions
      const [currentEarnings] = await db.execute(
        'SELECT * FROM payroll_earnings WHERE payroll_id = ?',
        [id]
      ) as any[];

      const [currentDeductions] = await db.execute(
        'SELECT * FROM payroll_deductions WHERE payroll_id = ?',
        [id]
      ) as any[];

      const basicSalary = basic_salary !== undefined ? Number(basic_salary) : payroll.basic_salary;
      const earningsList = earnings || currentEarnings;
      const deductionsList = deductions || currentDeductions;

      totalEarnings = Number(earningsList.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)) + basicSalary;
      totalDeductions = Number(deductionsList.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0));
      const taxAmount = tax !== undefined ? Number(tax) : payroll.tax;
      netSalary = totalEarnings - totalDeductions - taxAmount;
    }

    // Update payroll
    await db.execute(
      `UPDATE payroll 
       SET basic_salary = ?, total_earnings = ?, total_deductions = ?, tax = ?, net_salary = ?,
           status = ?, payment_date = ?, payment_mode = ?, payment_note = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        basic_salary !== undefined ? basic_salary : payroll.basic_salary,
        totalEarnings,
        totalDeductions,
        tax !== undefined ? tax : payroll.tax,
        netSalary,
        status || payroll.status,
        payment_date || payroll.payment_date,
        payment_mode || payroll.payment_mode,
        payment_note || payroll.payment_note,
        id,
      ]
    );

    // Update earnings if provided
    if (earnings && Array.isArray(earnings)) {
      await db.execute('DELETE FROM payroll_earnings WHERE payroll_id = ?', [id]);
      for (const earning of earnings) {
        if (earning.earning_type && earning.amount) {
          await db.execute(
            'INSERT INTO payroll_earnings (payroll_id, earning_type, amount) VALUES (?, ?, ?)',
            [id, earning.earning_type, earning.amount]
          );
        }
      }
    }

    // Update deductions if provided
    if (deductions && Array.isArray(deductions)) {
      await db.execute('DELETE FROM payroll_deductions WHERE payroll_id = ?', [id]);
      for (const deduction of deductions) {
        if (deduction.deduction_type && deduction.amount) {
          await db.execute(
            'INSERT INTO payroll_deductions (payroll_id, deduction_type, amount) VALUES (?, ?, ?)',
            [id, deduction.deduction_type, deduction.amount]
          );
        }
      }
    }

    const [updatedPayroll] = await db.execute(
      `SELECT 
        p.*,
        s.staff_id as staff_staff_id,
        s.first_name,
        s.last_name,
        r.name as role_name
      FROM payroll p
      INNER JOIN staff s ON p.staff_id = s.id
      LEFT JOIN roles r ON s.role_id = r.id
      WHERE p.id = ?`,
      [id]
    ) as any[];

    res.json({
      success: true,
      message: 'Payroll updated successfully',
      data: updatedPayroll[0],
    });
  } catch (error) {
    next(error);
  }
};

export const revertPayrollStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw createError('Status is required', 400);
    }

    const db = getDatabase();

    const [payroll] = await db.execute('SELECT status FROM payroll WHERE id = ?', [id]) as any[];
    if (payroll.length === 0) {
      throw createError('Payroll not found', 404);
    }

    // Validate status transition
    const currentStatus = payroll[0].status;
    if (status === 'not_generated' && currentStatus !== 'generated') {
      throw createError('Can only revert from generated to not_generated', 400);
    }
    if (status === 'generated' && currentStatus !== 'paid') {
      throw createError('Can only revert from paid to generated', 400);
    }

    await db.execute(
      'UPDATE payroll SET status = ?, payment_date = NULL, payment_mode = NULL, payment_note = NULL, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    res.json({
      success: true,
      message: 'Payroll status reverted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Teacher Ratings ==========
export const getTeacherRatings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teacher_id, is_approved, student_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        tr.*,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        t.photo as teacher_photo,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        s.admission_no,
        s.photo as student_photo
      FROM teacher_ratings tr
      LEFT JOIN staff t ON tr.teacher_id = t.id
      LEFT JOIN students s ON tr.student_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (teacher_id) {
      query += ' AND tr.teacher_id = ?';
      params.push(teacher_id);
    }
    if (is_approved !== undefined) {
      query += ' AND tr.is_approved = ?';
      params.push(is_approved === 'true' || is_approved === '1' ? 1 : 0);
    }
    if (student_id) {
      query += ' AND tr.student_id = ?';
      params.push(student_id);
    }

    query += ' ORDER BY tr.created_at DESC';

    const [ratings] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    next(error);
  }
};

export const submitTeacherRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { teacher_id, student_id, rating, review } = req.body;
    const db = getDatabase();

    if (!teacher_id || !student_id || !rating) {
      throw createError('Teacher, student, and rating are required', 400);
    }

    if (rating < 1 || rating > 5) {
      throw createError('Rating must be between 1 and 5', 400);
    }

    // Check if student already rated this teacher
    const [existing] = await db.execute(
      'SELECT id FROM teacher_ratings WHERE teacher_id = ? AND student_id = ?',
      [teacher_id, student_id]
    ) as any[];

    if (existing.length > 0) {
      // Update existing rating
      await db.execute(
        'UPDATE teacher_ratings SET rating = ?, review = ?, is_approved = 0, updated_at = NOW() WHERE id = ?',
        [rating, review || null, existing[0].id]
      );

      const [updated] = await db.execute(
        'SELECT * FROM teacher_ratings WHERE id = ?',
        [existing[0].id]
      ) as any[];

      res.json({
        success: true,
        message: 'Rating updated successfully. It will be reviewed by admin.',
        data: updated[0],
      });
      return;
    } else {
      // Create new rating
      const [result] = await db.execute(
        'INSERT INTO teacher_ratings (teacher_id, student_id, rating, review, is_approved) VALUES (?, ?, ?, ?, 0)',
        [teacher_id, student_id, rating, review || null]
      ) as any;

      const [newRating] = await db.execute(
        'SELECT * FROM teacher_ratings WHERE id = ?',
        [result.insertId]
      ) as any[];

      res.status(201).json({
        success: true,
        message: 'Rating submitted successfully. It will be reviewed by admin.',
        data: newRating[0],
      });
    }
  } catch (error) {
    next(error);
  }
};

export const approveTeacherRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute(
      'UPDATE teacher_ratings SET is_approved = 1, updated_at = NOW() WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Rating approved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const rejectTeacherRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute(
      'DELETE FROM teacher_ratings WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Rating rejected and deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Bulk Import Staff ==========
export const bulkImportStaff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const { staff } = req.body;

    if (!Array.isArray(staff) || staff.length === 0) {
      throw createError('Staff array is required and must not be empty', 400);
    }

    // Get actual table structure from database to ensure we match exactly
    const [tableColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'staff'
      AND COLUMN_NAME NOT IN ('id', 'created_at', 'updated_at', 'leaving_date', 'resignation_letter')
      ORDER BY ORDINAL_POSITION
    `) as any[];

    const actualColumns = tableColumns.map((col: any) => col.COLUMN_NAME);

    const results = {
      success: [] as any[],
      failed: [] as any[],
      total: staff.length,
    };

    // Process each staff member - each in its own transaction
    for (let i = 0; i < staff.length; i++) {
      const staffData = staff[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed
      let staffUserId: number | null = null;
      
      // Get a new connection for each staff member's transaction
      let staffConnection: any = null;

      try {
        // Start transaction for this staff member
        staffConnection = await db.getConnection();
        await staffConnection.beginTransaction();

        // Extract and validate required fields
        const {
          staff_id,
          role_id,
          designation_id,
          department_id,
          first_name,
          last_name,
          father_name,
          mother_name,
          gender,
          marital_status,
          date_of_birth,
          date_of_joining,
          phone,
          emergency_contact,
          email,
          current_address,
          permanent_address,
          qualification,
          work_experience,
          note,
          epf_no,
          basic_salary,
          contract_type,
          work_shift,
          location,
          number_of_leaves,
          bank_account_title,
          bank_account_number,
          bank_name,
          ifsc_code,
          bank_branch_name,
          facebook_url,
          twitter_url,
          linkedin_url,
          instagram_url,
        } = staffData;

        // Validate required fields
        const missingFields: string[] = [];
        if (!staff_id || String(staff_id).trim() === '') missingFields.push('Staff ID');
        if (!role_id) missingFields.push('Role ID');
        if (!first_name || String(first_name).trim() === '') missingFields.push('First Name');
        if (!date_of_joining) missingFields.push('Date of Joining');

        if (missingFields.length > 0) {
          results.failed.push({
            row: rowNumber,
            staff_id: staff_id || 'N/A',
            first_name: first_name || 'N/A',
            error: `Missing required fields: ${missingFields.join(', ')}`,
          });
          await staffConnection.rollback();
          staffConnection.release();
          continue;
        }

        // Check if staff_id already exists
        const [existing] = await staffConnection.execute(
          'SELECT id FROM staff WHERE staff_id = ?',
          [String(staff_id).trim()]
        ) as any[];

        if (existing.length > 0) {
          await staffConnection.rollback();
          staffConnection.release();
          results.failed.push({
            row: rowNumber,
            staff_id: String(staff_id).trim(),
            first_name: String(first_name).trim(),
            error: 'Staff ID already exists',
          });
          continue;
        }

        // Create user account if email is provided (within transaction)
        if (email && String(email).trim() !== '') {
          const emailStr = String(email).trim();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(emailStr)) {
            try {
              // Generate default password: staff123 (same as manual creation)
              const defaultPassword = 'staff123';
              const hashedPassword = await bcrypt.hash(defaultPassword, 10);

              const [userResult] = await staffConnection.execute(
                'INSERT INTO users (email, password, name, role_id, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
                [emailStr, hashedPassword, `${String(first_name).trim()} ${String(last_name || '').trim()}`.trim(), Number(role_id)]
              ) as any;
              staffUserId = userResult.insertId;
            } catch (userError: any) {
              // If user creation fails, rollback and fail this staff
              if (userError.code === 'ER_DUP_ENTRY' && userError.message.includes('email')) {
                await staffConnection.rollback();
                staffConnection.release();
                results.failed.push({
                  row: rowNumber,
                  staff_id: String(staff_id).trim(),
                  first_name: String(first_name).trim(),
                  error: `Email "${emailStr}" already exists`,
                });
                continue;
              }
              throw createError(`Failed to create user account: ${userError.message}`, 400);
            }
          }
        }

        // Prepare staff data
        const staffFields: Record<string, any> = {
          staff_id: String(staff_id).trim(),
          user_id: staffUserId,
          role_id: Number(role_id),
          designation_id: designation_id ? Number(designation_id) : null,
          department_id: department_id ? Number(department_id) : null,
          first_name: String(first_name).trim(),
          last_name: last_name ? String(last_name).trim() : null,
          father_name: father_name ? String(father_name).trim() : null,
          mother_name: mother_name ? String(mother_name).trim() : null,
          gender: gender ? String(gender).toLowerCase() : 'male',
          marital_status: marital_status ? String(marital_status).toLowerCase() : 'single',
          date_of_birth: date_of_birth ? String(date_of_birth) : null,
          date_of_joining: String(date_of_joining),
          phone: phone ? String(phone).trim() : null,
          emergency_contact: emergency_contact ? String(emergency_contact).trim() : null,
          email: email ? String(email).trim() : null,
          photo: null, // Skip photo in import
          current_address: current_address ? String(current_address).trim() : null,
          permanent_address: permanent_address ? String(permanent_address).trim() : null,
          qualification: qualification ? String(qualification).trim() : null,
          work_experience: work_experience ? String(work_experience).trim() : null,
          note: note ? String(note).trim() : null,
          epf_no: epf_no ? String(epf_no).trim() : null,
          basic_salary: basic_salary ? Number(basic_salary) : 0,
          contract_type: contract_type ? String(contract_type).toLowerCase() : 'permanent',
          work_shift: work_shift ? String(work_shift).toLowerCase() : 'morning',
          location: location ? String(location).trim() : null,
          number_of_leaves: number_of_leaves ? Number(number_of_leaves) : 0,
          bank_account_title: bank_account_title ? String(bank_account_title).trim() : null,
          bank_account_number: bank_account_number ? String(bank_account_number).trim() : null,
          bank_name: bank_name ? String(bank_name).trim() : null,
          ifsc_code: ifsc_code ? String(ifsc_code).trim() : null,
          bank_branch_name: bank_branch_name ? String(bank_branch_name).trim() : null,
          facebook_url: facebook_url ? String(facebook_url).trim() : null,
          twitter_url: twitter_url ? String(twitter_url).trim() : null,
          linkedin_url: linkedin_url ? String(linkedin_url).trim() : null,
          instagram_url: instagram_url ? String(instagram_url).trim() : null,
          is_active: 1,
        };

        // Build columns and values arrays in the exact order they appear in the database
        const columns: string[] = [];
        const values: any[] = [];

        for (const colName of actualColumns) {
          if (staffFields.hasOwnProperty(colName)) {
            columns.push(colName);
            values.push(staffFields[colName]);
          } else {
            // Column exists in DB but not in our fieldMap - use null
            columns.push(colName);
            values.push(null);
          }
        }

        // Verify counts match
        if (columns.length !== values.length) {
          throw createError(`Internal error: Column count (${columns.length}) doesn't match values count (${values.length})`, 500);
        }

        // Build placeholders
        const placeholders = columns.map(() => '?').join(', ');

        // Insert staff using dynamic column mapping
        const [result] = await staffConnection.execute(
          `INSERT INTO staff (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        ) as any;

        const staffId = result.insertId;

        // Commit transaction
        await staffConnection.commit();
        staffConnection.release();
        staffConnection = null;

        results.success.push({
          row: rowNumber,
          staff_id: staffFields.staff_id,
          first_name: staffFields.first_name,
          staff_id_db: staffId,
        });
      } catch (error: any) {
        // Rollback current transaction if active
        if (staffConnection) {
          try {
            await staffConnection.rollback();
            staffConnection.release();
          } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
          }
          staffConnection = null;
        }

        results.failed.push({
          row: rowNumber,
          staff_id: staffData.staff_id || 'N/A',
          first_name: staffData.first_name || 'N/A',
          error: error.message || 'Unknown error',
        });
      }
    }
    
    // Note: No need to commit/rollback main transaction since each staff member has its own transaction

    res.json({
      success: true,
      message: `Import completed: ${results.success.length} successful, ${results.failed.length} failed`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

