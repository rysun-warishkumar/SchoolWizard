import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { format } from 'date-fns';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { sendStudentAdmissionEmail } from '../utils/emailService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for student photo uploads
const studentPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/students');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Get student ID from params (for updates) or use 'new' for creates
    const studentId = req.params?.id || 'new';
    const studentName = req.body?.first_name || 'student';
    const sanitizedName = studentName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `student_${sanitizedName}_${studentId}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

export const uploadStudentPhoto = multer({
  storage: studentPhotoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ========== Student Categories ==========
export const getStudentCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [categories] = await db.execute(
      'SELECT * FROM student_categories ORDER BY name ASC'
    ) as any[];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const createStudentCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name) {
      throw createError('Category name is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO student_categories (name, created_at) VALUES (?, NOW())',
      [name]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { id: result.insertId, name },
    });
  } catch (error) {
    next(error);
  }
};

// ========== Student Houses ==========
export const getStudentHouses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [houses] = await db.execute(
      'SELECT * FROM student_houses ORDER BY name ASC'
    ) as any[];

    res.json({
      success: true,
      data: houses,
    });
  } catch (error) {
    next(error);
  }
};

export const createStudentHouse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name) {
      throw createError('House name is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO student_houses (name, created_at) VALUES (?, NOW())',
      [name]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'House created successfully',
      data: { id: result.insertId, name },
    });
  } catch (error) {
    next(error);
  }
};

// ========== Disable Reasons ==========
export const getDisableReasons = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [reasons] = await db.execute(
      'SELECT * FROM disable_reasons ORDER BY name ASC'
    ) as any[];

    res.json({
      success: true,
      data: reasons,
    });
  } catch (error) {
    next(error);
  }
};

export const createDisableReason = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name) {
      throw createError('Reason name is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO disable_reasons (name, created_at) VALUES (?, NOW())',
      [name]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Disable reason created successfully',
      data: { id: result.insertId, name },
    });
  } catch (error) {
    next(error);
  }
};

// ========== Students ==========
export const getStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { class_id, section_id, search, page, limit } = req.query;
    const db = getDatabase();

    // Validate and sanitize pagination parameters
    let pageNum = 1;
    let limitNum = 20;

    // Validate page number
    if (page !== undefined) {
      const parsedPage = Number(page);
      if (isNaN(parsedPage) || parsedPage < 1 || !Number.isInteger(parsedPage)) {
        throw createError('Invalid page number. Must be a positive integer.', 400);
      }
      pageNum = parsedPage;
    }

    // Validate limit number
    if (limit !== undefined) {
      const parsedLimit = Number(limit);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100 || !Number.isInteger(parsedLimit)) {
        throw createError('Invalid limit. Must be a positive integer between 1 and 100.', 400);
      }
      limitNum = parsedLimit;
    }

    // Validate class_id if provided
    if (class_id !== undefined) {
      const parsedClassId = Number(class_id);
      if (isNaN(parsedClassId) || parsedClassId < 1 || !Number.isInteger(parsedClassId)) {
        throw createError('Invalid class_id. Must be a positive integer.', 400);
      }
    }

    // Validate section_id if provided
    if (section_id !== undefined) {
      const parsedSectionId = Number(section_id);
      if (isNaN(parsedSectionId) || parsedSectionId < 1 || !Number.isInteger(parsedSectionId)) {
        throw createError('Invalid section_id. Must be a positive integer.', 400);
      }
    }

    // Validate search term if provided
    if (search !== undefined && typeof search !== 'string') {
      throw createError('Invalid search parameter. Must be a string.', 400);
    }

    let query = `
      SELECT s.*, 
       c.name as class_name, sec.name as section_name,
       cat.name as category_name, h.name as house_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       LEFT JOIN student_categories cat ON s.category_id = cat.id
       LEFT JOIN student_houses h ON s.house_id = h.id
       WHERE 1=1
    `;
    const params: any[] = [];

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(Number(class_id));
    }

    if (section_id) {
      query += ' AND s.section_id = ?';
      params.push(Number(section_id));
    }

    if (search) {
      const searchTerm = String(search).trim();
      if (searchTerm.length > 0) {
        query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_no LIKE ?)';
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
    }

    query += ' ORDER BY s.admission_no ASC';

    // Get total count first (before pagination)
    let countQuery = 'SELECT COUNT(*) as total FROM students s WHERE 1=1';
    const countParams: any[] = [];

    if (class_id) {
      countQuery += ' AND s.class_id = ?';
      countParams.push(Number(class_id));
    }
    if (section_id) {
      countQuery += ' AND s.section_id = ?';
      countParams.push(Number(section_id));
    }
    if (search) {
      const searchTerm = String(search).trim();
      if (searchTerm.length > 0) {
        countQuery += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_no LIKE ?)';
        const searchPattern = `%${searchTerm}%`;
        countParams.push(searchPattern, searchPattern, searchPattern);
      }
    }

    const [countResult] = await db.execute(countQuery, countParams) as any[];
    const total = Number(countResult[0]?.total || 0);
    const totalPages = Math.ceil(total / limitNum);

    // Validate page number against total pages
    if (total > 0 && pageNum > totalPages) {
      throw createError(`Page ${pageNum} does not exist. Maximum page is ${totalPages}.`, 400);
    }

    // Pagination
    const offset = (pageNum - 1) * limitNum;
    query += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [students] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: students || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [students] = await db.execute(
      `SELECT s.*, 
       c.name as class_name, sec.name as section_name,
       cat.name as category_name, h.name as house_name,
       sess.name as session_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       LEFT JOIN student_categories cat ON s.category_id = cat.id
       LEFT JOIN student_houses h ON s.house_id = h.id
       LEFT JOIN sessions sess ON s.session_id = sess.id
       WHERE s.id = ?`,
      [id]
    ) as any[];

    if (students.length === 0) {
      throw createError('Student not found', 404);
    }

    // Get documents
    const [documents] = await db.execute(
      'SELECT * FROM student_documents WHERE student_id = ?',
      [id]
    ) as any[];

    const student = students[0];
    student.documents = documents;

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// Get current student's profile (for student panel)
export const getMyStudentProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const db = getDatabase();

    // Find student by user_id
    const [students] = await db.execute(
      `SELECT s.*, 
       c.name as class_name, sec.name as section_name,
       cat.name as category_name, h.name as house_name,
       sess.name as session_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       LEFT JOIN student_categories cat ON s.category_id = cat.id
       LEFT JOIN student_houses h ON s.house_id = h.id
       LEFT JOIN sessions sess ON s.session_id = sess.id
       WHERE s.user_id = ?`,
      [req.user.id]
    ) as any[];

    if (students.length === 0) {
      throw createError('Student profile not found', 404);
    }

    // Get documents
    const [documents] = await db.execute(
      'SELECT * FROM student_documents WHERE student_id = ?',
      [students[0].id]
    ) as any[];

    const student = students[0];
    student.documents = documents;

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// Get all children for a parent (for parent panel)
export const getMyChildren = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'parent') {
      throw createError('Access denied. Only parents can view their children.', 403);
    }

    const db = getDatabase();
    const parentEmail = req.user.email;

    // Find all students where parent's email matches father_email, mother_email, or guardian_email
    const [children] = await db.execute(
      `SELECT s.*, 
       c.name as class_name, sec.name as section_name,
       cat.name as category_name, h.name as house_name,
       sess.name as session_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       LEFT JOIN student_categories cat ON s.category_id = cat.id
       LEFT JOIN student_houses h ON s.house_id = h.id
       LEFT JOIN sessions sess ON s.session_id = sess.id
       WHERE s.is_active = 1 
       AND (s.father_email = ? OR s.mother_email = ? OR s.guardian_email = ?)
       ORDER BY s.admission_no ASC`,
      [parentEmail, parentEmail, parentEmail]
    ) as any[];

    res.json({
      success: true,
      data: children,
    });
  } catch (error) {
    next(error);
  }
};

export const createStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      admission_no,
      roll_no,
      class_id,
      section_id,
      session_id,
      first_name,
      last_name,
      gender,
      date_of_birth,
      category_id,
      religion,
      caste,
      student_mobile,
      email,
      admission_date,
      photo,
      blood_group,
      house_id,
      height,
      weight,
      as_on_date,
      sibling_id,
      father_name,
      father_occupation,
      father_phone,
      father_email,
      mother_name,
      mother_occupation,
      mother_phone,
      mother_email,
      guardian_name,
      guardian_relation,
      guardian_occupation,
      guardian_phone,
      guardian_email,
      current_address,
      permanent_address,
      is_rte,
      rte_details,
    } = req.body;

    // Detailed validation
    const missingFields: string[] = [];
    if (!admission_no || admission_no.trim() === '') missingFields.push('Admission Number');
    if (!class_id) missingFields.push('Class');
    if (!section_id) missingFields.push('Section');
    if (!session_id) missingFields.push('Session');
    if (!first_name || first_name.trim() === '') missingFields.push('First Name');
    if (!gender) missingFields.push('Gender');
    if (!date_of_birth) missingFields.push('Date of Birth');
    if (!admission_date) missingFields.push('Admission Date');

    if (missingFields.length > 0) {
      throw createError(`Please fill in all required fields: ${missingFields.join(', ')}`, 400);
    }

    // Validate email format if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw createError('Please enter a valid email address', 400);
      }
    }

    // Validate phone number format if provided
    if (student_mobile && student_mobile.trim() !== '') {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(student_mobile.replace(/\D/g, ''))) {
        throw createError('Please enter a valid 10-digit mobile number', 400);
      }
    }

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date_of_birth)) {
      throw createError('Invalid date of birth format. Please use YYYY-MM-DD format', 400);
    }
    if (!dateRegex.test(admission_date)) {
      throw createError('Invalid admission date format. Please use YYYY-MM-DD format', 400);
    }

    // Validate date of birth is not in the future
    const dobDate = new Date(date_of_birth);
    const today = new Date();
    if (dobDate > today) {
      throw createError('Date of birth cannot be in the future', 400);
    }

    const db = getDatabase();

    // Check if admission number exists
    const [existingAdmission] = await db.execute(
      'SELECT id FROM students WHERE admission_no = ?',
      [admission_no.trim()]
    ) as any[];

    if (existingAdmission.length > 0) {
      throw createError(`A student with admission number "${admission_no}" already exists. Please use a different admission number.`, 400);
    }

    // Check if email exists in students table
    if (email && email.trim() !== '') {
      const [existingEmail] = await db.execute(
        'SELECT id, admission_no FROM students WHERE email = ?',
        [email.trim()]
      ) as any[];

      if (existingEmail.length > 0) {
        throw createError(`A student with email "${email}" already exists (Admission No: ${existingEmail[0].admission_no}). Please use a different email address.`, 400);
      }

      // Check if email exists in users table
      const [existingUserEmail] = await db.execute(
        'SELECT id, email FROM users WHERE email = ?',
        [email.trim()]
      ) as any[];

      if (existingUserEmail.length > 0) {
        throw createError(`An account with email "${email}" already exists. Please use a different email address.`, 400);
      }
    }

    // Validate class and section exist
    const [classExists] = await db.execute(
      'SELECT id, name FROM classes WHERE id = ?',
      [class_id]
    ) as any[];

    if (classExists.length === 0) {
      throw createError('Selected class does not exist', 400);
    }

    const [sectionExists] = await db.execute(
      'SELECT id, name FROM sections WHERE id = ?',
      [section_id]
    ) as any[];

    if (sectionExists.length === 0) {
      throw createError('Selected section does not exist', 400);
    }

    // Get current session if not provided
    let currentSessionId = session_id;
    if (!currentSessionId) {
      const [sessions] = await db.execute(
        'SELECT id FROM sessions WHERE is_current = 1 LIMIT 1'
      ) as any[];
      if (sessions.length > 0) {
        currentSessionId = sessions[0].id;
      } else {
        throw createError('No current session found. Please select a session or set a current session in settings.', 400);
      }
    } else {
      // Validate session exists
      const [sessionExists] = await db.execute(
        'SELECT id, name FROM sessions WHERE id = ?',
        [currentSessionId]
      ) as any[];

      if (sessionExists.length === 0) {
        throw createError('Selected session does not exist', 400);
      }
    }

    // Validate category if provided
    if (category_id) {
      const [categoryExists] = await db.execute(
        'SELECT id FROM student_categories WHERE id = ?',
        [category_id]
      ) as any[];

      if (categoryExists.length === 0) {
        throw createError('Selected category does not exist', 400);
      }
    }

    // Validate house if provided
    if (house_id) {
      const [houseExists] = await db.execute(
        'SELECT id FROM student_houses WHERE id = ?',
        [house_id]
      ) as any[];

      if (houseExists.length === 0) {
        throw createError('Selected house does not exist', 400);
      }
    }

    // Create user account for student if email is provided
    let userId = null;
    let plainPassword = '';
    if (email && email.trim() !== '') {
      try {
        // Generate default password: StudentName@TodayDate (e.g., Ravi@01102025)
        const today = new Date();
        const dateStr = format(today, 'ddMMyyyy'); // Format: 01102025
        const studentName = first_name.trim();
        plainPassword = `${studentName}@${dateStr}`;
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Get student role
        const [roles] = await db.execute(
          'SELECT id FROM roles WHERE name = ?',
          ['student']
        ) as any[];

        if (roles.length === 0) {
          throw createError('Student role not found in system. Please contact administrator.', 500);
        }

        const [userResult] = await db.execute(
          'INSERT INTO users (email, password, name, role_id, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
          [email.trim(), hashedPassword, `${first_name} ${last_name || ''}`.trim(), roles[0].id]
        ) as any[];
        userId = userResult.insertId;
      } catch (userError: any) {
        // Handle duplicate email error from users table
        if (userError.code === 'ER_DUP_ENTRY' && userError.message.includes('email')) {
          throw createError(`An account with email "${email}" already exists. Please use a different email address.`, 400);
        }
        throw userError;
      }
    }

    // Handle photo upload (file or base64)
    let photoPath = null;
    if (req.file) {
      // File upload via multer
      photoPath = `/uploads/students/${req.file.filename}`;
    } else if (photo && photo.trim() !== '') {
      // Check if it's a base64 string (for backward compatibility)
      if (photo.startsWith('data:image/')) {
        // For now, we'll still accept base64 but could convert to file
        // For backward compatibility, keep base64
        photoPath = photo;
      } else if (photo.startsWith('/uploads/')) {
        // Already a file path
        photoPath = photo;
      } else {
        // Assume it's a file path
        photoPath = photo;
      }
    }

    // Create student
    try {
      // Get actual table structure from database to ensure we match exactly
      const [tableColumns] = await db.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'students'
        AND COLUMN_NAME NOT IN ('id', 'created_at', 'updated_at', 'disable_reason_id', 'disable_date')
        ORDER BY ORDINAL_POSITION
      `) as any[];

      const actualColumns = tableColumns.map((col: any) => col.COLUMN_NAME);

      // Create a map of field values
      const fieldMap: Record<string, any> = {
        admission_no: admission_no.trim(),
        roll_no: roll_no ? roll_no.trim() : null,
        user_id: userId,
        class_id: Number(class_id),
        section_id: Number(section_id),
        session_id: Number(currentSessionId),
        first_name: first_name.trim(),
        last_name: last_name ? last_name.trim() : null,
        gender: gender,
        date_of_birth: date_of_birth,
        category_id: category_id ? Number(category_id) : null,
        religion: religion ? religion.trim() : null,
        caste: caste ? caste.trim() : null,
        student_mobile: student_mobile ? student_mobile.trim() : null,
        email: email ? email.trim() : null,
        admission_date: admission_date,
        photo: photoPath,
        blood_group: blood_group ? blood_group.trim() : null,
        house_id: house_id ? Number(house_id) : null,
        height: height ? height.trim() : null,
        weight: weight ? weight.trim() : null,
        as_on_date: as_on_date || null,
        sibling_id: sibling_id ? Number(sibling_id) : null,
        father_name: father_name ? father_name.trim() : null,
        father_occupation: father_occupation ? father_occupation.trim() : null,
        father_phone: father_phone ? father_phone.trim() : null,
        father_email: father_email ? father_email.trim() : null,
        father_photo: null, // not in form yet
        mother_name: mother_name ? mother_name.trim() : null,
        mother_occupation: mother_occupation ? mother_occupation.trim() : null,
        mother_phone: mother_phone ? mother_phone.trim() : null,
        mother_email: mother_email ? mother_email.trim() : null,
        mother_photo: null, // not in form yet
        guardian_name: guardian_name ? guardian_name.trim() : null,
        guardian_relation: guardian_relation ? guardian_relation.trim() : null,
        guardian_occupation: guardian_occupation ? guardian_occupation.trim() : null,
        guardian_phone: guardian_phone ? guardian_phone.trim() : null,
        guardian_email: guardian_email ? guardian_email.trim() : null,
        guardian_photo: null, // not in form yet
        current_address: current_address ? current_address.trim() : null,
        permanent_address: permanent_address ? permanent_address.trim() : null,
        transport_route_id: null, // not in form yet
        hostel_id: null, // not in form yet
        hostel_room_id: null, // not in form yet
        is_rte: is_rte ? 1 : 0,
        rte_details: rte_details ? rte_details.trim() : null,
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
        console.log(`\n=== INSERT Statement Debug ===`);
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
      // Also note: disable_reason_id and disable_date are not included as they're only set when disabling a student
      const [result] = await db.execute(
        `INSERT INTO students (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      ) as any;

      // Verify the insert was successful
      if (!result || !result.insertId) {
        throw createError('Failed to create student record. Please try again.', 500);
      }

      const [newStudents] = await db.execute(
        'SELECT * FROM students WHERE id = ?',
        [result.insertId]
      ) as any[];

      if (!newStudents || newStudents.length === 0) {
        throw createError('Student was created but could not be retrieved. Please refresh the list.', 500);
      }

      const studentName = `${first_name} ${last_name || ''}`.trim();
      
      // Send email to student if email is provided
      if (email && email.trim() !== '' && plainPassword) {
        try {
          const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173/login';
          await sendStudentAdmissionEmail(
            email.trim(),
            studentName,
            admission_no,
            plainPassword,
            loginUrl
          );
        } catch (emailError: any) {
          // Log email error but don't fail the student creation
          console.error('Failed to send admission email:', emailError);
          // Continue with success response even if email fails
        }
      }

      // Process parent emails and create/get parent accounts
      let parentAccountsCreated = 0;
      try {
        const { processParentEmails } = await import('../services/parentUserService');
        const parentResult = await processParentEmails(
          father_email || null,
          father_name || null,
          mother_email || null,
          mother_name || null,
          guardian_email || null,
          guardian_name || null,
          studentName,
          admission_no
        );
        parentAccountsCreated = parentResult.createdAccounts;
      } catch (parentError: any) {
        // Log parent account creation error but don't fail the student creation
        console.error('Failed to create parent accounts:', parentError);
        // Continue with success response even if parent account creation fails
      }
      
      // Send success response
      const parentMessage = parentAccountsCreated > 0 
        ? ` ${parentAccountsCreated} parent account(s) created and login credentials sent.`
        : '';
      res.status(201).json({
        success: true,
        message: `Student "${studentName}" has been admitted successfully with Admission No: ${admission_no}${email && email.trim() !== '' ? '. Login credentials have been sent to the student\'s email.' : ''}${parentMessage}`,
        data: newStudents[0],
      });
      return;
    } catch (dbError: any) {
      // Log the actual error for debugging
      console.error('Database error in createStudent:', {
        code: dbError.code,
        errno: dbError.errno,
        sqlState: dbError.sqlState,
        sqlMessage: dbError.sqlMessage,
        message: dbError.message,
        stack: dbError.stack,
      });

      // Handle database errors
      if (dbError.code === 'ER_DUP_ENTRY') {
        if (dbError.sqlMessage && dbError.sqlMessage.includes('admission_no')) {
          throw createError(`A student with admission number "${admission_no}" already exists. Please use a different admission number.`, 400);
        } else if (dbError.sqlMessage && dbError.sqlMessage.includes('email')) {
          throw createError(`A student with email "${email}" already exists. Please use a different email address.`, 400);
        } else {
          throw createError('A record with this information already exists. Please check for duplicates.', 400);
        }
      } else if (dbError.code === 'ER_NO_REFERENCED_ROW_2') {
        throw createError('Invalid reference. Please ensure the selected class, section, or session exists.', 400);
      } else if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        throw createError('Invalid field in request. Please contact support.', 500);
      } else if (dbError.code === 'ER_DATA_TOO_LONG') {
        throw createError('One or more fields exceed the maximum allowed length. Please check your input.', 400);
      } else if (dbError.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
        throw createError('Invalid data format for one or more fields. Please check your input.', 400);
      } else {
        // Re-throw if it's already a custom error
        if (dbError.statusCode) {
          throw dbError;
        }
        // Provide more detailed error message in development
        const errorMessage = process.env.NODE_ENV === 'development' 
          ? `Database error: ${dbError.sqlMessage || dbError.message}`
          : 'Failed to create student. Please try again or contact support if the problem persists.';
        throw createError(errorMessage, 500);
      }
    }
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: any = req.body || {};
    const db = getDatabase();

    // Debug: Log what we received
    console.log('Update Student - req.file:', req.file ? { filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype } : 'null');
    console.log('Update Student - req.body keys:', Object.keys(req.body || {}));
    console.log('Update Student - Content-Type:', req.headers['content-type']);

    // Handle photo file upload - SIMPLE: if file exists, set photo path
    if (req.file) {
      const [existingStudent] = await db.execute(
        'SELECT first_name, photo FROM students WHERE id = ?',
        [id]
      ) as any[];
      
      const studentName = existingStudent[0]?.first_name || 'student';
      const sanitizedName = studentName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const ext = path.extname(req.file.filename);
      const newFilename = `student_${sanitizedName}_${id}_${Date.now()}${ext}`;
      const oldPath = path.join(__dirname, '../../uploads/students', req.file.filename);
      const newPath = path.join(__dirname, '../../uploads/students', newFilename);
      
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }
      
      updates.photo = `/uploads/students/${newFilename}`;
      
      // Delete old photo if it exists
      if (existingStudent[0]?.photo?.startsWith('/uploads/')) {
        const oldPhotoPath = path.join(__dirname, '../..', existingStudent[0].photo);
        if (fs.existsSync(oldPhotoPath) && oldPhotoPath !== newPath) {
          try {
            fs.unlinkSync(oldPhotoPath);
          } catch (err) {
            // Ignore delete errors
          }
        }
      }
    }

    // Build update query - SIMPLE: only update fields that are provided
    const allowedFields = [
      'admission_no', 'roll_no', 'class_id', 'section_id', 'session_id', 'first_name', 'last_name', 'gender',
      'date_of_birth', 'category_id', 'religion', 'caste', 'student_mobile', 'email',
      'admission_date', 'photo', 'blood_group', 'house_id', 'height', 'weight',
      'father_name', 'father_occupation', 'father_phone', 'father_email',
      'mother_name', 'mother_occupation', 'mother_phone', 'mother_email',
      'guardian_name', 'guardian_relation', 'guardian_occupation', 'guardian_phone', 'guardian_email',
      'current_address', 'permanent_address', 'is_rte', 'rte_details',
    ];

    const updateFields: string[] = [];
    const params: any[] = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        
        // Simple type conversion
        if (['class_id', 'section_id', 'session_id', 'category_id', 'house_id'].includes(field)) {
          params.push(updates[field] ? Number(updates[field]) : null);
        } else if (field === 'is_rte') {
          params.push(updates[field] === '1' || updates[field] === 1 || updates[field] === true ? 1 : 0);
        } else {
          params.push(updates[field] === null || updates[field] === '' ? null : String(updates[field]).trim());
        }
      }
    }

    // Debug: Log what we're updating
    console.log('Update Student - Fields to update:', updateFields);
    console.log('Update Student - updates object:', updates);

    if (updateFields.length === 0) {
      console.error('Update Student - No fields to update. req.file:', req.file, 'updates:', updates);
      throw createError('No fields to update', 400);
    }

    updateFields.push('updated_at = NOW()');
    params.push(Number(id));

    // Execute update query with error handling
    try {
      const sql = `UPDATE students SET ${updateFields.join(', ')} WHERE id = ?`;
      await db.execute(sql, params);
    } catch (dbError: any) {
      console.error('Database error in updateStudent:', {
        code: dbError.code,
        errno: dbError.errno,
        sqlState: dbError.sqlState,
        sqlMessage: dbError.sqlMessage,
        message: dbError.message,
        updateFields,
        paramsCount: params.length,
        updateFieldsCount: updateFields.length,
        sql: `UPDATE students SET ${updateFields.join(', ')} WHERE id = ?`,
        params: params.map((p, i) => ({ index: i, value: p, type: typeof p })),
      });
      
      // Handle specific database errors
      if (dbError.code === 'ER_WRONG_ARGUMENTS') {
        throw createError(`Database error: Incorrect arguments. Field count: ${updateFields.length}, Parameter count: ${params.length}.`, 500);
      }
      throw dbError;
    }

    const [updatedStudents] = await db.execute(
      'SELECT * FROM students WHERE id = ?',
      [id]
    ) as any[];

    // Process parent emails if they were updated
    if (updates.father_email || updates.mother_email || updates.guardian_email) {
      const student = updatedStudents[0];
      const studentName = `${student.first_name} ${student.last_name || ''}`.trim();
      
      try {
        const { processParentEmails } = await import('../services/parentUserService');
        await processParentEmails(
          student.father_email || null,
          student.father_name || null,
          student.mother_email || null,
          student.mother_name || null,
          student.guardian_email || null,
          student.guardian_name || null,
          studentName,
          student.admission_no
        );
      } catch (parentError: any) {
        // Log parent account creation error but don't fail the update
        console.error('Failed to process parent accounts during update:', parentError);
      }
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudents[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Get student info to find associated user
    const [students] = await db.execute(
      'SELECT user_id FROM students WHERE id = ?',
      [id]
    ) as any[];

    if (students.length === 0) {
      throw createError('Student not found', 404);
    }

    const userId = students[0].user_id;

    // Delete student record
    await db.execute('DELETE FROM students WHERE id = ?', [id]);

    // Delete associated user account if exists
    if (userId) {
      try {
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);
      } catch (userError: any) {
        // Log error but don't fail if user deletion fails (user might already be deleted)
        console.error('Error deleting user account:', userError);
      }
    }

    res.json({
      success: true,
      message: 'Student and associated user account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const disableStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { disable_reason_id } = req.body;
    const db = getDatabase();

    await db.execute(
      'UPDATE students SET is_active = 0, disable_reason_id = ?, disable_date = CURDATE(), updated_at = NOW() WHERE id = ?',
      [disable_reason_id || null, id]
    );

    res.json({
      success: true,
      message: 'Student disabled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Online Admissions ==========
export const getOnlineAdmissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [admissions] = await db.execute(
      `SELECT oa.*, c.name as class_name
       FROM online_admissions oa
       LEFT JOIN classes c ON oa.class_id = c.id
       ORDER BY oa.created_at DESC`
    ) as any[];

    res.json({
      success: true,
      data: admissions,
    });
  } catch (error) {
    next(error);
  }
};

export const approveOnlineAdmission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Get online admission
    const [admissions] = await db.execute(
      'SELECT * FROM online_admissions WHERE id = ?',
      [id]
    ) as any[];

    if (admissions.length === 0) {
      throw createError('Online admission not found', 404);
    }

    const admission = admissions[0];

    // Create student from online admission
    // This is a simplified version - you may want to add more fields
    const [result] = await db.execute(
      `INSERT INTO students (
        admission_no, class_id, first_name, last_name, gender, date_of_birth,
        email, student_mobile, admission_date, father_name, father_phone,
        mother_name, mother_phone, guardian_name, guardian_phone, current_address,
        is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        admission.admission_no || `OA${id}`,
        admission.class_id,
        admission.first_name,
        admission.last_name,
        admission.gender,
        admission.date_of_birth,
        admission.email,
        admission.phone,
        admission.father_name,
        admission.father_phone,
        admission.mother_name,
        admission.mother_phone,
        admission.guardian_name,
        admission.guardian_phone,
        admission.address,
      ]
    ) as any[];

    // Update online admission status
    await db.execute(
      'UPDATE online_admissions SET status = ?, updated_at = NOW() WHERE id = ?',
      ['approved', id]
    );

    res.json({
      success: true,
      message: 'Online admission approved and student created',
      data: { studentId: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const rejectOnlineAdmission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute(
      'UPDATE online_admissions SET status = ?, updated_at = NOW() WHERE id = ?',
      ['rejected', id]
    );

    res.json({
      success: true,
      message: 'Online admission rejected',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Bulk Import Students ==========
export const bulkImportStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      throw createError('Students array is required and must not be empty', 400);
    }

    // Get current session (no transaction needed for this)
    const [sessions] = await db.execute(
      'SELECT id FROM sessions WHERE is_current = 1 LIMIT 1'
    ) as any[];
    const currentSessionId = sessions[0]?.id;

    if (!currentSessionId) {
      throw createError('No active session found. Please set a current session first.', 400);
    }

    // Get actual table structure from database to ensure we match exactly
    const [tableColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'students'
      AND COLUMN_NAME NOT IN ('id', 'updated_at', 'disable_reason_id', 'disable_date')
      ORDER BY ORDINAL_POSITION
    `) as any[];

    const actualColumns = tableColumns.map((col: any) => col.COLUMN_NAME);
    
    // Get parent role ID once (used for all students)
    const [parentRoles] = await db.execute(
      'SELECT id FROM roles WHERE name = ?',
      ['parent']
    ) as any[];
    const parentRoleId = parentRoles.length > 0 ? parentRoles[0].id : null;
    
    if (!parentRoleId) {
      throw createError('Parent role not found in system. Please contact administrator.', 500);
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
      total: students.length,
    };

    // Process each student - each in its own transaction
    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed
      let studentUserId: number | null = null;
      let parentUserIds: number[] = [];
      
      // Get a new connection for each student's transaction
      let studentConnection: any = null;

      try {
        // Start transaction for this student
        studentConnection = await db.getConnection();
        await studentConnection.beginTransaction();
        // Extract and validate required fields
        const {
          admission_no,
          roll_no,
          class_id,
          section_id,
          first_name,
          last_name,
          gender,
          date_of_birth,
          admission_date,
          category_id,
          religion,
          caste,
          student_mobile,
          email,
          blood_group,
          house_id,
          height,
          weight,
          father_name,
          father_occupation,
          father_phone,
          father_email,
          mother_name,
          mother_occupation,
          mother_phone,
          mother_email,
          guardian_name,
          guardian_relation,
          guardian_occupation,
          guardian_phone,
          guardian_email,
          current_address,
          permanent_address,
        } = studentData;

        // Validate required fields
        const missingFields: string[] = [];
        if (!admission_no || String(admission_no).trim() === '') missingFields.push('Admission Number');
        if (!class_id) missingFields.push('Class ID');
        if (!section_id) missingFields.push('Section ID');
        if (!first_name || String(first_name).trim() === '') missingFields.push('First Name');
        if (!gender) missingFields.push('Gender');
        if (!date_of_birth) missingFields.push('Date of Birth');
        if (!admission_date) missingFields.push('Admission Date');

        if (missingFields.length > 0) {
          results.failed.push({
            row: rowNumber,
            admission_no: admission_no || 'N/A',
            first_name: first_name || 'N/A',
            error: `Missing required fields: ${missingFields.join(', ')}`,
          });
          continue;
        }

        // Check if admission number already exists
        const [existing] = await studentConnection.execute(
          'SELECT id FROM students WHERE admission_no = ?',
          [String(admission_no).trim()]
        ) as any[];

        if (existing.length > 0) {
          await studentConnection.rollback();
          studentConnection.release();
          results.failed.push({
            row: rowNumber,
            admission_no: String(admission_no).trim(),
            first_name: String(first_name).trim(),
            error: 'Admission number already exists',
          });
          continue;
        }

        // Create user account if email is provided (within transaction)
        if (email && String(email).trim() !== '') {
          const emailStr = String(email).trim();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(emailStr)) {
            try {
              // Generate default password: StudentName@TodayDate
              const today = new Date();
              const dateStr = format(today, 'ddMMyyyy');
              const studentName = String(first_name).trim();
              const plainPassword = `${studentName}@${dateStr}`;
              const hashedPassword = await bcrypt.hash(plainPassword, 10);

              // Get student role
              const [roles] = await studentConnection.execute(
                'SELECT id FROM roles WHERE name = ?',
                ['student']
              ) as any[];

              if (roles.length > 0) {
                const [userResult] = await studentConnection.execute(
                  'INSERT INTO users (email, password, name, role_id, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
                  [emailStr, hashedPassword, `${String(first_name).trim()} ${String(last_name || '').trim()}`.trim(), roles[0].id]
                ) as any;
                studentUserId = userResult.insertId;
              }
            } catch (userError: any) {
              // If user creation fails, rollback and fail this student
              throw createError(`Failed to create user account: ${userError.message}`, 400);
            }
          }
        }

        // Prepare student data
        const studentFields: Record<string, any> = {
          admission_no: String(admission_no).trim(),
          roll_no: roll_no ? String(roll_no).trim() : null,
          user_id: studentUserId,
          class_id: Number(class_id),
          section_id: Number(section_id),
          session_id: currentSessionId,
          first_name: String(first_name).trim(),
          last_name: last_name ? String(last_name).trim() : null,
          gender: String(gender).toLowerCase(),
          date_of_birth: String(date_of_birth),
          category_id: category_id ? Number(category_id) : null,
          religion: religion ? String(religion).trim() : null,
          caste: caste ? String(caste).trim() : null,
          student_mobile: student_mobile ? String(student_mobile).trim() : null,
          email: email ? String(email).trim() : null,
          admission_date: String(admission_date),
          photo: null, // Skip photo in import
          blood_group: blood_group ? String(blood_group).trim() : null,
          house_id: house_id ? Number(house_id) : null,
          height: height ? String(height).trim() : null,
          weight: weight ? String(weight).trim() : null,
          father_name: father_name ? String(father_name).trim() : null,
          father_occupation: father_occupation ? String(father_occupation).trim() : null,
          father_phone: father_phone ? String(father_phone).trim() : null,
          father_email: father_email ? String(father_email).trim() : null,
          mother_name: mother_name ? String(mother_name).trim() : null,
          mother_occupation: mother_occupation ? String(mother_occupation).trim() : null,
          mother_phone: mother_phone ? String(mother_phone).trim() : null,
          mother_email: mother_email ? String(mother_email).trim() : null,
          guardian_name: guardian_name ? String(guardian_name).trim() : null,
          guardian_relation: guardian_relation ? String(guardian_relation).trim() : null,
          guardian_occupation: guardian_occupation ? String(guardian_occupation).trim() : null,
          guardian_phone: guardian_phone ? String(guardian_phone).trim() : null,
          guardian_email: guardian_email ? String(guardian_email).trim() : null,
          current_address: current_address ? String(current_address).trim() : null,
          permanent_address: permanent_address ? String(permanent_address).trim() : null,
          is_active: 1,
        };

        // Build columns and values arrays in the exact order they appear in the database
        const columns: string[] = [];
        const values: any[] = [];

        for (const colName of actualColumns) {
          if (studentFields.hasOwnProperty(colName)) {
            columns.push(colName);
            values.push(studentFields[colName]);
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

        // Insert student using dynamic column mapping
        const [result] = await studentConnection.execute(
          `INSERT INTO students (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        ) as any;

        const studentId = result.insertId;
        const studentName = `${String(first_name).trim()} ${String(last_name || '').trim()}`.trim();

        // Create parent user accounts within the same transaction
        // If parent creation fails, the entire transaction (including student) will be rolled back
        try {
          const { processParentEmails } = await import('../services/parentUserService');
          
          // Note: processParentEmails uses getDatabase() which gets a new connection
          // This means parent creation happens in a separate transaction
          // However, if student creation succeeds but parent creation fails, we still want to keep the student
          // The main requirement is: if student creation fails, parents should not be created (ensured by transaction)
          // So we'll create parents after committing student, but catch errors
          
          // Commit student first
          await studentConnection.commit();
          studentConnection.release();
          studentConnection = null;

          // Now create parent accounts (separate transaction)
          // If this fails, student is already created (which is acceptable)
          // The key requirement is met: if student fails, parents won't be created
          const parentResult = await processParentEmails(
            father_email || null,
            father_name || null,
            mother_email || null,
            mother_name || null,
            guardian_email || null,
            guardian_name || null,
            studentName,
            String(admission_no).trim()
          );
          parentUserIds = parentResult.parentUserIds;
        } catch (parentError: any) {
          // If we get here, student is already committed
          // Log the error but don't fail - student creation succeeded
          console.warn(`Student ${admission_no} created successfully, but parent account creation failed:`, parentError.message);
          // Ensure connection is released even if parent creation fails
          if (studentConnection) {
            await studentConnection.commit();
            studentConnection.release();
            studentConnection = null;
          }
        }

        results.success.push({
          row: rowNumber,
          admission_no: studentFields.admission_no,
          first_name: studentFields.first_name,
          student_id: studentId,
        });
      } catch (error: any) {
        // Rollback current transaction if active
        if (studentConnection) {
          try {
            await studentConnection.rollback();
            studentConnection.release();
          } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
          }
          studentConnection = null;
        }

        results.failed.push({
          row: rowNumber,
          admission_no: studentData.admission_no || 'N/A',
          first_name: studentData.first_name || 'N/A',
          error: error.message || 'Unknown error',
        });
      }
    }
    
    // Note: No need to commit/rollback main transaction since each student has its own transaction

    res.json({
      success: true,
      message: `Import completed: ${results.success.length} successful, ${results.failed.length} failed`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// ========== Promote Students ==========
export const getStudentsForPromotion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { class_id, section_id } = req.query;
    const db = getDatabase();

    if (!class_id || !section_id) {
      throw createError('Class and Section are required', 400);
    }

    const [students] = await db.execute(
      `SELECT 
        s.id,
        s.admission_no,
        s.first_name,
        s.last_name,
        s.class_id,
        s.section_id,
        s.session_id,
        c.name as class_name,
        sec.name as section_name,
        sess.name as session_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN sessions sess ON s.session_id = sess.id
      WHERE s.class_id = ? AND s.section_id = ? AND s.is_active = 1
      ORDER BY s.admission_no ASC`,
      [class_id, section_id]
    ) as any[];

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

export const promoteStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { promotions, target_session_id, target_class_id, target_section_id } = req.body;

    if (!promotions || !Array.isArray(promotions) || promotions.length === 0) {
      throw createError('Promotions data is required', 400);
    }

    if (!target_session_id) {
      throw createError('Target session is required', 400);
    }

    const db = getDatabase();
    const connection = await db.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      for (const promotion of promotions) {
        const { student_id, current_result, next_session_status } = promotion;

        if (!student_id || !current_result || !next_session_status) {
          throw createError('Invalid promotion data', 400);
        }

        // Get current student data
        const [students] = await connection.execute(
          'SELECT * FROM students WHERE id = ?',
          [student_id]
        ) as any[];

        if (students.length === 0) {
          throw createError(`Student with ID ${student_id} not found`, 404);
        }

        const student = students[0];
        let newSessionId = student.session_id;
        let newClassId = student.class_id;
        let newSectionId = student.section_id;

        // Apply promotion logic
        if (current_result === 'pass' && next_session_status === 'continue') {
          // Pass + Continue: Promote to next session and next class-section
          newSessionId = target_session_id;
          if (target_class_id) newClassId = target_class_id;
          if (target_section_id) newSectionId = target_section_id;
        } else if (current_result === 'fail' && next_session_status === 'continue') {
          // Fail + Continue: Promote to next session, keep same class-section
          newSessionId = target_session_id;
          // Keep existing class_id and section_id
        } else if (current_result === 'pass' && next_session_status === 'leave') {
          // Pass + Leave: No promotion
          // Keep existing session_id, class_id, section_id
        } else if (current_result === 'fail' && next_session_status === 'leave') {
          // Fail + Leave: No promotion
          // Keep existing session_id, class_id, section_id
        }

        // Update student
        await connection.execute(
          'UPDATE students SET session_id = ?, class_id = ?, section_id = ?, updated_at = NOW() WHERE id = ?',
          [newSessionId, newClassId, newSectionId, student_id]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Students promoted successfully',
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    next(error);
  }
};

