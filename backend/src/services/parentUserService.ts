import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { sendParentAccountEmail } from '../utils/emailService';
import { createPasswordSetupLink } from '../utils/passwordSetupService';


/**
 * Create or get existing parent user account
 * Returns the user ID and whether a new account was created
 */
export const createOrGetParentUser = async (
  email: string,
  name: string,
  studentName: string,
  studentAdmissionNo: string,
  schoolId: number
): Promise<{ userId: number; isNewUser: boolean }> => {
  if (!email || !email.trim()) {
    throw createError('Parent email is required', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw createError(`Invalid email format: ${email}`, 400);
  }

  const db = getDatabase();
  const trimmedEmail = email.trim().toLowerCase();

  // Check if user with this email already exists
  const [existingUsers] = await db.execute(
    `SELECT u.id, u.email, u.name, u.role_id, r.name as role_name, u.is_active
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.email = ?`,
    [trimmedEmail]
  ) as any[];

  // If user exists, check if they have parent role
  if (existingUsers.length > 0) {
    const [sameSchoolUsers] = await db.execute(
      `SELECT id, name, role_id
       FROM users
       WHERE email = ? AND school_id = ?`,
      [trimmedEmail, schoolId]
    ) as any[];

    if (sameSchoolUsers.length === 0) {
      throw createError(`A user with email "${trimmedEmail}" already exists in another school.`, 400);
    }

    const currentUser = sameSchoolUsers[0];
    const [currentRoleRows] = await db.execute(
      `SELECT r.name as role_name
       FROM roles r
       WHERE r.id = ? LIMIT 1`,
      [currentUser.role_id]
    ) as any[];
    const currentRoleName = String(currentRoleRows[0]?.role_name || '').toLowerCase();

    // Reuse existing parent login only — never convert student/staff/other accounts (avoids breaking logins and import edge cases).
    if (currentRoleName === 'parent') {
      if (name && name.trim() && currentUser.name !== name.trim()) {
        await db.execute(
          'UPDATE users SET name = ? WHERE id = ? AND school_id = ?',
          [name.trim(), currentUser.id, schoolId]
        );
      }

      return {
        userId: currentUser.id,
        isNewUser: false,
      };
    }

    throw createError(
      `A user with email "${trimmedEmail}" already exists for this school as ${currentRoleName || 'user'}. Use a different email for the parent/guardian account.`,
      400
    );
  }

  // User doesn't exist, create new parent account
  // Get parent role ID
  const [parentRoles] = await db.execute(
    'SELECT id FROM roles WHERE name = ?',
    ['parent']
  ) as any[];

  if (parentRoles.length === 0) {
    throw createError('Parent role not found in system. Please contact administrator.', 500);
  }

  // Generate random temporary password and require secure setup before login.
  const plainPassword = crypto.randomBytes(12).toString('base64url');

  // Hash password
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Create user
  const [result] = await db.execute(
    'INSERT INTO users (email, password, name, role_id, school_id, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())',
    [trimmedEmail, hashedPassword, name.trim(), parentRoles[0].id, schoolId]
  ) as any;

  // Send email with credentials
  try {
    const setupUrl = await createPasswordSetupLink(result.insertId);
    await sendParentAccountEmail({
      to: trimmedEmail,
      parentName: name.trim(),
      studentName,
      studentAdmissionNo,
      email: trimmedEmail,
      setupUrl,
      schoolId,
    });
  } catch (emailError) {
    // Log error but don't fail the operation
    console.error('Failed to send parent account email:', emailError);
  }

  return {
    userId: result.insertId,
    isNewUser: true,
  };
};

/**
 * Process parent emails from student data and create/get parent accounts.
 * Only the Father gets a parent account; Mother and Guardian do not (per product requirement).
 * Returns array of created/updated parent user IDs.
 */
export const processParentEmails = async (
  fatherEmail: string | null,
  fatherName: string | null,
  _motherEmail: string | null,
  _motherName: string | null,
  _guardianEmail: string | null,
  _guardianName: string | null,
  studentName: string,
  studentAdmissionNo: string,
  schoolId: number
): Promise<{ parentUserIds: number[]; createdAccounts: number }> => {
  const parentUserIds: number[] = [];
  let createdAccounts = 0;

  // Only create parent account for Father
  if (fatherEmail && fatherEmail.trim()) {
    const fatherNameToUse = fatherName && fatherName.trim() ? fatherName.trim() : 'Parent';
    try {
      const result = await createOrGetParentUser(
        fatherEmail,
        fatherNameToUse,
        studentName,
        studentAdmissionNo,
        schoolId
      );
      if (result.isNewUser) {
        createdAccounts++;
      }
      parentUserIds.push(result.userId);
    } catch (error: any) {
      console.error(`Error creating parent account for father email ${fatherEmail}:`, error);
    }
  }

  return {
    parentUserIds: [...new Set(parentUserIds)],
    createdAccounts,
  };
};

/**
 * Reset parent password and send email
 */
export const resetParentPassword = async (
  userId: number,
  sendEmail: boolean = true,
  schoolId?: number | null
): Promise<{ email: string }> => {
  const db = getDatabase();

  const userWhere = schoolId != null ? 'u.id = ? AND u.school_id = ?' : 'u.id = ?';
  const userParams: any[] = schoolId != null ? [userId, schoolId] : [userId];

  const [users] = await db.execute(
    `SELECT u.id, u.email, u.name, r.name as role_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE ${userWhere}`,
    userParams
  ) as any[];

  if (users.length === 0) {
    throw createError('User not found', 404);
  }

  const user = users[0];

  if (user.role_name !== 'parent') {
    throw createError('User is not a parent', 400);
  }

  const plainPassword = crypto.randomBytes(12).toString('base64url');

  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  if (schoolId != null) {
    await db.execute('UPDATE users SET password = ? WHERE id = ? AND school_id = ?', [hashedPassword, userId, schoolId]);
  } else {
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
  }

  if (sendEmail) {
    try {
      const studentWhere = schoolId != null
        ? '(father_email = ? OR mother_email = ? OR guardian_email = ?) AND school_id = ?'
        : 'father_email = ? OR mother_email = ? OR guardian_email = ?';
      const studentParams = schoolId != null ? [user.email, user.email, user.email, schoolId] : [user.email, user.email, user.email];
      const [students] = await db.execute(
        `SELECT first_name, last_name, admission_no
         FROM students
         WHERE ${studentWhere}
         LIMIT 1`,
        studentParams
      ) as any[];

      const studentInfo = students.length > 0 ? students[0] : null;
      const studentName = studentInfo
        ? `${studentInfo.first_name} ${studentInfo.last_name || ''}`.trim()
        : 'Your Child';
      const studentAdmissionNo = studentInfo?.admission_no || 'N/A';

      const setupUrl = await createPasswordSetupLink(user.id);
      await sendParentAccountEmail({
        to: user.email,
        parentName: user.name,
        studentName,
        studentAdmissionNo,
        email: user.email,
        setupUrl,
        isPasswordReset: true,
        schoolId: schoolId ?? undefined,
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't throw - password is reset even if email fails
    }
  }

  return {
    email: user.email,
  };
};

