import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { sendParentAccountEmail } from '../utils/emailService';


/**
 * Create or get existing parent user account
 * Returns the user ID and whether a new account was created
 */
export const createOrGetParentUser = async (
  email: string,
  name: string,
  studentName: string,
  studentAdmissionNo: string
): Promise<{ userId: number; isNewUser: boolean; password?: string }> => {
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
    const existingUser = existingUsers[0];

    // If user exists but doesn't have parent role, update it
    if (existingUser.role_name !== 'parent') {
      // Get parent role ID
      const [parentRoles] = await db.execute(
        'SELECT id FROM roles WHERE name = ?',
        ['parent']
      ) as any[];

      if (parentRoles.length === 0) {
        throw createError('Parent role not found in system. Please contact administrator.', 500);
      }

      // Update user role to parent
      await db.execute(
        'UPDATE users SET role_id = ? WHERE id = ?',
        [parentRoles[0].id, existingUser.id]
      );
    }

    // Update name if provided and different
    if (name && name.trim() && existingUser.name !== name.trim()) {
      await db.execute(
        'UPDATE users SET name = ? WHERE id = ?',
        [name.trim(), existingUser.id]
      );
    }

    return {
      userId: existingUser.id,
      isNewUser: false,
    };
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

  // Generate password
  const firstName = name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const plainPassword = `${firstName}@${dateStr}`;

  // Hash password
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Create user
  const [result] = await db.execute(
    'INSERT INTO users (email, password, name, role_id, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
    [trimmedEmail, hashedPassword, name.trim(), parentRoles[0].id]
  ) as any;

  // Send email with credentials
  try {
    await sendParentAccountEmail({
      to: trimmedEmail,
      parentName: name.trim(),
      studentName,
      studentAdmissionNo,
      email: trimmedEmail,
      password: plainPassword,
    });
  } catch (emailError) {
    // Log error but don't fail the operation
    console.error('Failed to send parent account email:', emailError);
  }

  return {
    userId: result.insertId,
    isNewUser: true,
    password: plainPassword,
  };
};

/**
 * Process parent emails from student data and create/get parent accounts
 * Returns array of created/updated parent user IDs
 */
export const processParentEmails = async (
  fatherEmail: string | null,
  fatherName: string | null,
  motherEmail: string | null,
  motherName: string | null,
  guardianEmail: string | null,
  guardianName: string | null,
  studentName: string,
  studentAdmissionNo: string
): Promise<{ parentUserIds: number[]; createdAccounts: number }> => {
  const parentUserIds: number[] = [];
  let createdAccounts = 0;

  // Process father email
  if (fatherEmail && fatherEmail.trim()) {
    const fatherNameToUse = fatherName && fatherName.trim() ? fatherName.trim() : 'Parent';
    try {
      const result = await createOrGetParentUser(
        fatherEmail,
        fatherNameToUse,
        studentName,
        studentAdmissionNo
      );
      if (result.isNewUser) {
        createdAccounts++;
      }
      parentUserIds.push(result.userId);
    } catch (error: any) {
      console.error(`Error creating parent account for father email ${fatherEmail}:`, error);
      // Continue with other emails even if one fails
    }
  }

  // Process mother email (only if different from father)
  if (motherEmail && motherEmail.trim() && motherEmail.trim().toLowerCase() !== fatherEmail?.trim().toLowerCase()) {
    const motherNameToUse = motherName && motherName.trim() ? motherName.trim() : 'Parent';
    try {
      const result = await createOrGetParentUser(
        motherEmail,
        motherNameToUse,
        studentName,
        studentAdmissionNo
      );
      if (result.isNewUser) {
        createdAccounts++;
      }
      parentUserIds.push(result.userId);
    } catch (error: any) {
      console.error(`Error creating parent account for mother email ${motherEmail}:`, error);
    }
  }

  // Process guardian email (only if different from father and mother)
  if (
    guardianEmail &&
    guardianEmail.trim() &&
    guardianEmail.trim().toLowerCase() !== fatherEmail?.trim().toLowerCase() &&
    guardianEmail.trim().toLowerCase() !== motherEmail?.trim().toLowerCase()
  ) {
    const guardianNameToUse = guardianName && guardianName.trim() ? guardianName.trim() : 'Guardian';
    try {
      const result = await createOrGetParentUser(
        guardianEmail,
        guardianNameToUse,
        studentName,
        studentAdmissionNo
      );
      if (result.isNewUser) {
        createdAccounts++;
      }
      parentUserIds.push(result.userId);
    } catch (error: any) {
      console.error(`Error creating parent account for guardian email ${guardianEmail}:`, error);
    }
  }

  return {
    parentUserIds: [...new Set(parentUserIds)], // Remove duplicates
    createdAccounts,
  };
};

/**
 * Reset parent password and send email
 */
export const resetParentPassword = async (
  userId: number,
  sendEmail: boolean = true
): Promise<{ password: string; email: string }> => {
  const db = getDatabase();

  // Get user details
  const [users] = await db.execute(
    `SELECT u.id, u.email, u.name, r.name as role_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [userId]
  ) as any[];

  if (users.length === 0) {
    throw createError('User not found', 404);
  }

  const user = users[0];

  if (user.role_name !== 'parent') {
    throw createError('User is not a parent', 400);
  }

  // Generate new password
  const firstName = user.name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const plainPassword = `${firstName}@${dateStr}`;

  // Hash and update password
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

  // Send email if requested
  if (sendEmail) {
    try {
      // Get student info for email
      const [students] = await db.execute(
        `SELECT first_name, last_name, admission_no
         FROM students
         WHERE father_email = ? OR mother_email = ? OR guardian_email = ?
         LIMIT 1`,
        [user.email, user.email, user.email]
      ) as any[];

      const studentInfo = students.length > 0 ? students[0] : null;
      const studentName = studentInfo
        ? `${studentInfo.first_name} ${studentInfo.last_name || ''}`.trim()
        : 'Your Child';
      const studentAdmissionNo = studentInfo?.admission_no || 'N/A';

      await sendParentAccountEmail({
        to: user.email,
        parentName: user.name,
        studentName,
        studentAdmissionNo,
        email: user.email,
        password: plainPassword,
        isPasswordReset: true,
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't throw - password is reset even if email fails
    }
  }

  return {
    password: plainPassword,
    email: user.email,
  };
};

