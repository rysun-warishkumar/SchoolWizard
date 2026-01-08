import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Type for multer file - using any to avoid Express namespace dependency issues
type MulterFile = any;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for logo and favicon uploads (Front CMS)
const frontCmsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/front-cms');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use specific names for logo and favicon
    const fieldName = file.fieldname;
    const ext = path.extname(file.originalname);
    if (fieldName === 'logo') {
      cb(null, 'logo' + ext);
    } else if (fieldName === 'favicon') {
      cb(null, 'favicon' + ext);
    } else {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + ext);
    }
  },
});

// Configure multer for General Settings logo and favicon uploads
const generalSettingsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use specific names based on field name
    const fieldName = file.fieldname;
    const ext = path.extname(file.originalname);
    if (fieldName === 'adminLogo') {
      cb(null, 'admin-logo' + ext);
    } else if (fieldName === 'favicon') {
      cb(null, 'favicon' + ext);
    } else {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + ext);
    }
  },
});

const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|ico|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/x-icon' || file.mimetype === 'image/vnd.microsoft.icon';
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, ico, svg)'));
  }
};

export const uploadFrontCmsFiles = multer({
  storage: frontCmsStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter,
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
]);

export const uploadGeneralSettingsFiles = multer({
  storage: generalSettingsStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter,
}).fields([
  { name: 'adminLogo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
]);

// For now, we'll use a simple settings table structure
// In production, you might want a more sophisticated settings system

export const getGeneralSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [settings] = await db.execute(
      'SELECT setting_key, setting_value, setting_type FROM general_settings'
    ) as any[];

    // Convert settings array to object
    const settingsObj: any = {};
    settings.forEach((setting: any) => {
      if (setting.setting_type === 'boolean') {
        settingsObj[setting.setting_key] = setting.setting_value === '1' || setting.setting_value === 'true';
      } else if (setting.setting_type === 'number') {
        settingsObj[setting.setting_key] = Number(setting.setting_value);
      } else {
        settingsObj[setting.setting_key] = setting.setting_value || '';
      }
    });

    // Map to frontend-friendly format
    res.json({
      success: true,
      data: {
        schoolName: settingsObj.school_name || 'SchoolWizard',
        schoolCode: settingsObj.school_code || '',
        address: settingsObj.address || '',
        phone: settingsObj.phone || '',
        email: settingsObj.email || '',
        sessionStartMonth: settingsObj.session_start_month || 'April',
        attendanceType: settingsObj.attendance_type || 'day_wise',
        biometricAttendance: settingsObj.biometric_attendance || false,
        language: settingsObj.language || 'english',
        dateFormat: settingsObj.date_format || 'Y-m-d',
        timezone: settingsObj.timezone || 'UTC',
        currency: settingsObj.currency || 'USD',
        currencySymbol: settingsObj.currency_symbol || '$',
        currencySymbolPlace: settingsObj.currency_symbol_place || 'before',
        admissionNoPrefix: settingsObj.admission_no_prefix || '',
        admissionNoDigit: settingsObj.admission_no_digit || 6,
        admissionStartFrom: settingsObj.admission_start_from || 1,
        autoStaffId: settingsObj.auto_staff_id !== false,
        staffIdPrefix: settingsObj.staff_id_prefix || '',
        staffNoDigit: settingsObj.staff_no_digit || 6,
        staffIdStartFrom: settingsObj.staff_id_start_from || 1,
        duplicateFeesInvoice: settingsObj.duplicate_fees_invoice || false,
        feesDueDays: settingsObj.fees_due_days || 30,
        teacherRestrictedMode: settingsObj.teacher_restricted_mode || false,
        onlineAdmission: settingsObj.online_admission || false,
        printLogo: settingsObj.print_logo || '',
        adminLogo: settingsObj.admin_logo || '',
        adminSmallLogo: settingsObj.admin_small_logo || '',
        appLogo: settingsObj.app_logo || '',
        favicon: settingsObj.favicon || '',
        mobileAppApiUrl: settingsObj.mobile_app_api_url || '',
        mobileAppPrimaryColor: settingsObj.mobile_app_primary_color || '#2563eb',
        mobileAppSecondaryColor: settingsObj.mobile_app_secondary_color || '#64748b',
        androidAppRegistered: settingsObj.android_app_registered || false,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateGeneralSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // When FormData is sent, req.body should be populated by multer
    // But if it's not, initialize it as an empty object
    let settings: any = req.body || {};
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Settings update request:', {
        body: settings,
        files: req.files,
        contentType: req.get('content-type')
      });
    }
    
    const db = getDatabase();

    // Get existing settings to preserve logo/favicon if not uploaded
    const [existingSettings] = await db.execute(
      'SELECT setting_key, setting_value FROM general_settings WHERE setting_key IN (?, ?)',
      ['admin_logo', 'favicon']
    ) as any[];

    const existingSettingsObj: any = {};
    existingSettings.forEach((setting: any) => {
      existingSettingsObj[setting.setting_key] = setting.setting_value;
    });

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files) {
      if (files.adminLogo && files.adminLogo[0]) {
        settings.adminLogo = `/uploads/logos/${files.adminLogo[0].filename}`;
      } else if ((!settings.adminLogo || settings.adminLogo === '') && existingSettingsObj.admin_logo) {
        settings.adminLogo = existingSettingsObj.admin_logo;
      }
      if (files.favicon && files.favicon[0]) {
        settings.favicon = `/uploads/logos/${files.favicon[0].filename}`;
      } else if ((!settings.favicon || settings.favicon === '') && existingSettingsObj.favicon) {
        settings.favicon = existingSettingsObj.favicon;
      }
    } else {
      // No files uploaded, preserve existing if not provided in body
      if ((!settings.adminLogo || settings.adminLogo === '') && existingSettingsObj.admin_logo) {
        settings.adminLogo = existingSettingsObj.admin_logo;
      }
      if ((!settings.favicon || settings.favicon === '') && existingSettingsObj.favicon) {
        settings.favicon = existingSettingsObj.favicon;
      }
    }

    // Convert FormData string values to proper types
    if (settings.biometricAttendance !== undefined) {
      settings.biometricAttendance = settings.biometricAttendance === 'true' || settings.biometricAttendance === true || settings.biometricAttendance === 'on';
    }
    if (settings.autoStaffId !== undefined) {
      settings.autoStaffId = settings.autoStaffId === 'true' || settings.autoStaffId === true || settings.autoStaffId === 'on';
    }
    if (settings.duplicateFeesInvoice !== undefined) {
      settings.duplicateFeesInvoice = settings.duplicateFeesInvoice === 'true' || settings.duplicateFeesInvoice === true || settings.duplicateFeesInvoice === 'on';
    }
    if (settings.teacherRestrictedMode !== undefined) {
      settings.teacherRestrictedMode = settings.teacherRestrictedMode === 'true' || settings.teacherRestrictedMode === true || settings.teacherRestrictedMode === 'on';
    }
    if (settings.onlineAdmission !== undefined) {
      settings.onlineAdmission = settings.onlineAdmission === 'true' || settings.onlineAdmission === true || settings.onlineAdmission === 'on';
    }
    if (settings.androidAppRegistered !== undefined) {
      settings.androidAppRegistered = settings.androidAppRegistered === 'true' || settings.androidAppRegistered === true || settings.androidAppRegistered === 'on';
    }

    // Convert number fields
    if (settings.admissionNoDigit !== undefined && typeof settings.admissionNoDigit === 'string') {
      settings.admissionNoDigit = parseInt(settings.admissionNoDigit) || 6;
    }
    if (settings.admissionStartFrom !== undefined && typeof settings.admissionStartFrom === 'string') {
      settings.admissionStartFrom = parseInt(settings.admissionStartFrom) || 1;
    }
    if (settings.staffNoDigit !== undefined && typeof settings.staffNoDigit === 'string') {
      settings.staffNoDigit = parseInt(settings.staffNoDigit) || 6;
    }
    if (settings.staffIdStartFrom !== undefined && typeof settings.staffIdStartFrom === 'string') {
      settings.staffIdStartFrom = parseInt(settings.staffIdStartFrom) || 1;
    }
    if (settings.feesDueDays !== undefined && typeof settings.feesDueDays === 'string') {
      settings.feesDueDays = parseInt(settings.feesDueDays) || 30;
    }

    // Validate required fields
    if (!settings.schoolName) {
      throw createError('School name is required', 400);
    }

    // Map frontend format to database format
    const settingsMap: Record<string, { value: any; type: string }> = {
      schoolName: { value: settings.schoolName, type: 'text' },
      schoolCode: { value: settings.schoolCode || '', type: 'text' },
      address: { value: settings.address || '', type: 'text' },
      phone: { value: settings.phone || '', type: 'text' },
      email: { value: settings.email || '', type: 'text' },
      sessionStartMonth: { value: settings.sessionStartMonth || 'April', type: 'text' },
      attendanceType: { value: settings.attendanceType || 'day_wise', type: 'text' },
      biometricAttendance: { value: settings.biometricAttendance ? '1' : '0', type: 'boolean' },
      language: { value: settings.language || 'english', type: 'text' },
      dateFormat: { value: settings.dateFormat || 'Y-m-d', type: 'text' },
      timezone: { value: settings.timezone || 'UTC', type: 'text' },
      currency: { value: settings.currency || 'USD', type: 'text' },
      currencySymbol: { value: settings.currencySymbol || '$', type: 'text' },
      currencySymbolPlace: { value: settings.currencySymbolPlace || 'before', type: 'text' },
      admissionNoPrefix: { value: settings.admissionNoPrefix || '', type: 'text' },
      admissionNoDigit: { value: String(settings.admissionNoDigit || 6), type: 'number' },
      admissionStartFrom: { value: String(settings.admissionStartFrom || 1), type: 'number' },
      autoStaffId: { value: settings.autoStaffId ? '1' : '0', type: 'boolean' },
      staffIdPrefix: { value: settings.staffIdPrefix || '', type: 'text' },
      staffNoDigit: { value: String(settings.staffNoDigit || 6), type: 'number' },
      staffIdStartFrom: { value: String(settings.staffIdStartFrom || 1), type: 'number' },
      duplicateFeesInvoice: { value: settings.duplicateFeesInvoice ? '1' : '0', type: 'boolean' },
      feesDueDays: { value: String(settings.feesDueDays || 30), type: 'number' },
      teacherRestrictedMode: { value: settings.teacherRestrictedMode ? '1' : '0', type: 'boolean' },
      onlineAdmission: { value: settings.onlineAdmission ? '1' : '0', type: 'boolean' },
      printLogo: { value: settings.printLogo || '', type: 'text' },
      adminLogo: { value: settings.adminLogo || '', type: 'text' },
      adminSmallLogo: { value: settings.adminSmallLogo || '', type: 'text' },
      appLogo: { value: settings.appLogo || '', type: 'text' },
      favicon: { value: settings.favicon || '', type: 'text' },
      mobileAppApiUrl: { value: settings.mobileAppApiUrl || '', type: 'text' },
      mobileAppPrimaryColor: { value: settings.mobileAppPrimaryColor || '#2563eb', type: 'text' },
      mobileAppSecondaryColor: { value: settings.mobileAppSecondaryColor || '#64748b', type: 'text' },
      androidAppRegistered: { value: settings.androidAppRegistered ? '1' : '0', type: 'boolean' },
    };

    // Update each setting
    for (const [key, { value, type }] of Object.entries(settingsMap)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      // Ensure all values are strings and not undefined/null
      const settingValue = value !== null && value !== undefined ? String(value) : '';
      const settingType = type || 'text';
      
      try {
        await db.execute(
          `INSERT INTO general_settings (setting_key, setting_value, setting_type) 
           VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
          [dbKey, settingValue, settingType, settingValue]
        );
      } catch (error: any) {
        console.error(`Error updating setting ${dbKey}:`, error);
        throw createError(`Failed to update setting ${key}: ${error.message}`, 500);
      }
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [sessions] = await db.execute(
      'SELECT * FROM sessions ORDER BY start_date DESC'
    ) as any[];

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, start_date, end_date, is_current } = req.body;

    if (!name || !start_date || !end_date) {
      throw createError('Name, start date, and end date are required', 400);
    }

    const db = getDatabase();

    // If setting as current, unset other current sessions
    if (is_current) {
      await db.execute('UPDATE sessions SET is_current = 0');
    }

    const [result] = await db.execute(
      'INSERT INTO sessions (name, start_date, end_date, is_current, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, start_date, end_date, is_current ? 1 : 0]
    ) as any;

    const [newSessions] = await db.execute(
      'SELECT * FROM sessions WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: newSessions[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, start_date, end_date, is_current } = req.body;
    const db = getDatabase();

    // If setting as current, unset other current sessions
    if (is_current) {
      await db.execute('UPDATE sessions SET is_current = 0 WHERE id != ?', [id]);
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (start_date) {
      updates.push('start_date = ?');
      params.push(start_date);
    }
    if (end_date) {
      updates.push('end_date = ?');
      params.push(end_date);
    }
    if (is_current !== undefined) {
      updates.push('is_current = ?');
      params.push(is_current ? 1 : 0);
    }

    if (updates.length === 0) {
      throw createError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.execute(
      `UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const [updatedSessions] = await db.execute(
      'SELECT * FROM sessions WHERE id = ?',
      [id]
    ) as any[];

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: updatedSessions[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if session is current
    const [sessions] = await db.execute(
      'SELECT is_current FROM sessions WHERE id = ?',
      [id]
    ) as any[];

    if (sessions.length === 0) {
      throw createError('Session not found', 404);
    }

    if (sessions[0].is_current) {
      throw createError('Cannot delete current session', 400);
    }

    await db.execute('DELETE FROM sessions WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Email Settings ==========
export const getEmailSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [settings] = await db.execute(
      'SELECT id, smtp_host, smtp_port, smtp_secure, smtp_username, from_email, from_name, is_enabled FROM email_settings ORDER BY id DESC LIMIT 1'
    ) as any[];

    if (settings.length === 0) {
      // Return default empty settings
      res.json({
        success: true,
        data: {
          id: null,
          smtp_host: '',
          smtp_port: 587,
          smtp_secure: false,
          smtp_username: '',
          smtp_password: '',
          from_email: '',
          from_name: 'SchoolWizard',
          is_enabled: false,
        },
      });
      return;
    }

    const setting = settings[0];
    // Don't send password in response
    res.json({
      success: true,
      data: {
        id: setting.id,
        smtp_host: setting.smtp_host || '',
        smtp_port: setting.smtp_port || 587,
        smtp_secure: setting.smtp_secure === 1,
        smtp_username: setting.smtp_username || '',
        smtp_password: '', // Never send password back
        from_email: setting.from_email || '',
        from_name: setting.from_name || 'SchoolWizard',
        is_enabled: setting.is_enabled === 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmailSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      smtp_host,
      smtp_port,
      smtp_secure,
      smtp_username,
      smtp_password,
      from_email,
      from_name,
      is_enabled,
    } = req.body;

    // Validate required fields if enabled
    if (is_enabled) {
      if (!smtp_host || !smtp_host.trim()) {
        throw createError('SMTP Host is required when email is enabled', 400);
      }
      
      if (!smtp_port || isNaN(Number(smtp_port)) || Number(smtp_port) < 1 || Number(smtp_port) > 65535) {
        throw createError('SMTP Port must be a valid number between 1 and 65535', 400);
      }
      
      if (!smtp_username || !smtp_username.trim()) {
        throw createError('SMTP Username is required when email is enabled', 400);
      }
      
      // Validate email format for username if it looks like an email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (smtp_username.includes('@') && !emailRegex.test(smtp_username)) {
        throw createError('SMTP Username must be a valid email address if provided as email', 400);
      }
      
      if (!smtp_password || smtp_password.trim() === '') {
        throw createError('SMTP Password is required when email is enabled', 400);
      }
      
      // Validate from_email if provided
      if (from_email && from_email.trim() && !emailRegex.test(from_email)) {
        throw createError('From Email must be a valid email address', 400);
      }
    }

    const db = getDatabase();

    // Check if settings exist
    const [existing] = await db.execute(
      'SELECT id FROM email_settings ORDER BY id DESC LIMIT 1'
    ) as any[];

    if (existing.length > 0) {
      // Update existing
      const updates: string[] = [];
      const params: any[] = [];

      updates.push('smtp_host = ?');
      params.push(smtp_host || '');
      updates.push('smtp_port = ?');
      params.push(smtp_port || 587);
      updates.push('smtp_secure = ?');
      params.push(smtp_secure ? 1 : 0);
      updates.push('smtp_username = ?');
      params.push(smtp_username || '');
      if (smtp_password && smtp_password.trim() !== '') {
        updates.push('smtp_password = ?');
        params.push(smtp_password);
      }
      updates.push('from_email = ?');
      params.push(from_email || smtp_username || '');
      updates.push('from_name = ?');
      params.push(from_name || 'SchoolWizard');
      updates.push('is_enabled = ?');
      params.push(is_enabled ? 1 : 0);
      updates.push('updated_at = NOW()');
      params.push(existing[0].id);

      await db.execute(
        `UPDATE email_settings SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    } else {
      // Create new
      await db.execute(
        `INSERT INTO email_settings 
        (smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password, from_email, from_name, is_enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          smtp_host || '',
          smtp_port || 587,
          smtp_secure ? 1 : 0,
          smtp_username || '',
          smtp_password || '',
          from_email || smtp_username || '',
          from_name || 'SchoolWizard',
          is_enabled ? 1 : 0,
        ]
      );
    }

    // Reinitialize email service if enabled
    if (is_enabled) {
      try {
        const { initializeEmailService } = await import('../utils/emailService.js');
        await initializeEmailService({
          host: smtp_host,
          port: smtp_port || 587,
          secure: smtp_secure || smtp_port === 465,
          auth: {
            user: smtp_username,
            pass: smtp_password,
          },
        });
      } catch (emailError: any) {
        console.error('Error initializing email service:', emailError);
        // Don't fail the update, just log the error
      }
    }

    res.json({
      success: true,
      message: 'Email settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const testEmailSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { test_email } = req.body;

    // Validate test email address
    if (!test_email) {
      throw createError('Test email address is required', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(test_email)) {
      throw createError('Please provide a valid email address', 400);
    }

    // Import email service functions
    const { sendEmail, getEmailConfig, initializeEmailService } = await import('../utils/emailService.js');

    // Get email configuration from database
    const db = getDatabase();
    const [settings] = await db.execute(
      `SELECT 
        smtp_host,
        smtp_port,
        smtp_secure,
        smtp_username,
        smtp_password,
        from_email,
        from_name,
        is_enabled
      FROM email_settings 
      WHERE is_enabled = 1 
      LIMIT 1`
    ) as any[];

    if (settings.length === 0) {
      throw createError(
        'Email settings are not configured or not enabled. Please configure and enable SMTP settings first.',
        400
      );
    }

    const setting = settings[0];

    // Validate required fields
    if (!setting.smtp_host || !setting.smtp_username || !setting.smtp_password) {
      throw createError(
        'Email settings are incomplete. Please ensure SMTP Host, Username, and Password are configured.',
        400
      );
    }

    // Initialize email service with current settings
    try {
      await initializeEmailService({
        host: setting.smtp_host,
        port: setting.smtp_port || 587,
        secure: setting.smtp_secure === 1 || setting.smtp_port === 465,
        auth: {
          user: setting.smtp_username,
          pass: setting.smtp_password,
        },
      });
    } catch (initError: any) {
      // Provide specific error messages for common issues
      let errorMessage = 'Failed to connect to SMTP server. ';
      
      if (initError.code === 'ECONNREFUSED') {
        errorMessage += 'Connection refused. Please check if the SMTP host and port are correct.';
      } else if (initError.code === 'ETIMEDOUT') {
        errorMessage += 'Connection timeout. Please check your network connection and SMTP server settings.';
      } else if (initError.responseCode === 535) {
        errorMessage += 'Authentication failed. Please check your SMTP username and password.';
      } else if (initError.responseCode === 553) {
        errorMessage += 'Invalid sender email address. Please check your SMTP username.';
      } else if (initError.message) {
        errorMessage += initError.message;
      } else {
        errorMessage += 'Please verify your SMTP settings and try again.';
      }
      
      throw createError(errorMessage, 400);
    }

    // Send test email
    try {
      const fromEmail = setting.from_email || setting.smtp_username;
      const fromName = setting.from_name || 'SchoolWizard';

      await sendEmail({
        to: test_email,
        subject: 'Test Email from SchoolWizard',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background-color: #2563eb;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
              }
              .content {
                background-color: #f9fafb;
                padding: 20px;
                border: 1px solid #ddd;
                border-top: none;
                border-radius: 0 0 5px 5px;
              }
              .success {
                background-color: #d1fae5;
                border-left: 4px solid #10b981;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
              }
              .info {
                background-color: #dbeafe;
                border-left: 4px solid #2563eb;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✅ Test Email Successful</h1>
            </div>
            <div class="content">
              <div class="success">
                <strong>Congratulations!</strong> Your SMTP configuration is working correctly.
              </div>
              <p>This is a test email from <strong>SchoolWizard</strong>.</p>
              <p>If you received this email, it means:</p>
              <ul>
                <li>Your SMTP server connection is successful</li>
                <li>Your authentication credentials are correct</li>
                <li>Emails can be sent from your system</li>
              </ul>
              <div class="info">
                <strong>Email Details:</strong><br>
                From: ${fromName} &lt;${fromEmail}&gt;<br>
                To: ${test_email}<br>
                Sent at: ${new Date().toLocaleString()}<br>
                SMTP Host: ${setting.smtp_host}<br>
                SMTP Port: ${setting.smtp_port || 587}
              </div>
              <p>You can now use the email functionality in SchoolWizard to send notifications, admission emails, and other communications.</p>
              <p>Best regards,<br>SchoolWizard System</p>
            </div>
          </body>
          </html>
        `,
      });

      res.json({
        success: true,
        message: `Test email sent successfully to ${test_email}. Please check your inbox (and spam folder).`,
      });
    } catch (sendError: any) {
      // Provide specific error messages for sending failures
      let errorMessage = 'Failed to send test email. ';
      
      if (sendError.code === 'EENVELOPE') {
        errorMessage += 'Invalid recipient email address.';
      } else if (sendError.responseCode === 550) {
        errorMessage += 'Recipient email address rejected by server. Please verify the email address.';
      } else if (sendError.responseCode === 552) {
        errorMessage += 'Mailbox full or message too large.';
      } else if (sendError.message) {
        errorMessage += sendError.message;
      } else {
        errorMessage += 'Please check your SMTP settings and try again.';
      }
      
      throw createError(errorMessage, 400);
    }
  } catch (error) {
    next(error);
  }
};

// ========== Notification Settings ==========
export const getNotificationSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [notifications] = await db.execute(
      'SELECT * FROM notification_settings ORDER BY id ASC'
    ) as any[];

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotificationSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { notifications } = req.body; // Array of notification settings
    const db = getDatabase();

    if (!Array.isArray(notifications)) {
      throw createError('Notifications must be an array', 400);
    }

    for (const notification of notifications) {
      const {
        event_name,
        email_enabled_student,
        email_enabled_guardian,
        email_enabled_staff,
        sms_enabled_student,
        sms_enabled_guardian,
        sms_enabled_staff,
      } = notification;

      await db.execute(
        `UPDATE notification_settings SET
         email_enabled_student = ?,
         email_enabled_guardian = ?,
         email_enabled_staff = ?,
         sms_enabled_student = ?,
         sms_enabled_guardian = ?,
         sms_enabled_staff = ?,
         updated_at = NOW()
         WHERE event_name = ?`,
        [
          email_enabled_student ? 1 : 0,
          email_enabled_guardian ? 1 : 0,
          email_enabled_staff ? 1 : 0,
          sms_enabled_student ? 1 : 0,
          sms_enabled_guardian ? 1 : 0,
          sms_enabled_staff ? 1 : 0,
          event_name,
        ]
      );
    }

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== SMS Settings ==========
export const getSMSSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [settings] = await db.execute(
      'SELECT id, sms_gateway, sms_api_key, sms_sender_id, sms_username, sms_url, is_enabled FROM sms_settings ORDER BY id DESC'
    ) as any[];

    res.json({
      success: true,
      data: settings.map((s: any) => ({
        ...s,
        is_enabled: s.is_enabled === 1,
        // Don't send sensitive data
        sms_api_secret: undefined,
        sms_password: undefined,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createSMSSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      sms_gateway,
      sms_api_key,
      sms_api_secret,
      sms_sender_id,
      sms_username,
      sms_password,
      sms_url,
      is_enabled,
    } = req.body;

    if (!sms_gateway) {
      throw createError('SMS Gateway is required', 400);
    }

    const db = getDatabase();

    // If enabling this gateway, disable others
    if (is_enabled) {
      await db.execute('UPDATE sms_settings SET is_enabled = 0');
    }

    const [result] = await db.execute(
      `INSERT INTO sms_settings 
       (sms_gateway, sms_api_key, sms_api_secret, sms_sender_id, sms_username, sms_password, sms_url, is_enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        sms_gateway,
        sms_api_key || null,
        sms_api_secret || null,
        sms_sender_id || null,
        sms_username || null,
        sms_password || null,
        sms_url || null,
        is_enabled ? 1 : 0,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'SMS settings created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSMSSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      sms_gateway,
      sms_api_key,
      sms_api_secret,
      sms_sender_id,
      sms_username,
      sms_password,
      sms_url,
      is_enabled,
    } = req.body;

    const db = getDatabase();

    // If enabling this gateway, disable others
    if (is_enabled) {
      await db.execute('UPDATE sms_settings SET is_enabled = 0 WHERE id != ?', [id]);
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (sms_gateway) {
      updates.push('sms_gateway = ?');
      params.push(sms_gateway);
    }
    if (sms_api_key !== undefined) {
      updates.push('sms_api_key = ?');
      params.push(sms_api_key || null);
    }
    if (sms_api_secret !== undefined && sms_api_secret !== '') {
      updates.push('sms_api_secret = ?');
      params.push(sms_api_secret);
    }
    if (sms_sender_id !== undefined) {
      updates.push('sms_sender_id = ?');
      params.push(sms_sender_id || null);
    }
    if (sms_username !== undefined) {
      updates.push('sms_username = ?');
      params.push(sms_username || null);
    }
    if (sms_password !== undefined && sms_password !== '') {
      updates.push('sms_password = ?');
      params.push(sms_password);
    }
    if (sms_url !== undefined) {
      updates.push('sms_url = ?');
      params.push(sms_url || null);
    }
    if (is_enabled !== undefined) {
      updates.push('is_enabled = ?');
      params.push(is_enabled ? 1 : 0);
    }

    if (updates.length === 0) {
      throw createError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.execute(
      `UPDATE sms_settings SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'SMS settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSMSSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM sms_settings WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'SMS settings deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Payment Gateway Settings ==========
export const getPaymentGateways = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [gateways] = await db.execute(
      'SELECT id, gateway_name, display_name, merchant_id, test_mode, is_enabled FROM payment_gateways ORDER BY id DESC'
    ) as any[];

    res.json({
      success: true,
      data: gateways.map((g: any) => ({
        ...g,
        test_mode: g.test_mode === 1,
        is_enabled: g.is_enabled === 1,
        // Don't send sensitive data
        api_key: undefined,
        api_secret: undefined,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createPaymentGateway = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      gateway_name,
      display_name,
      api_key,
      api_secret,
      merchant_id,
      test_mode,
      is_enabled,
    } = req.body;

    if (!gateway_name || !display_name) {
      throw createError('Gateway name and display name are required', 400);
    }

    const db = getDatabase();

    // If enabling this gateway, disable others
    if (is_enabled) {
      await db.execute('UPDATE payment_gateways SET is_enabled = 0');
    }

    const [result] = await db.execute(
      `INSERT INTO payment_gateways 
       (gateway_name, display_name, api_key, api_secret, merchant_id, test_mode, is_enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        gateway_name,
        display_name,
        api_key || null,
        api_secret || null,
        merchant_id || null,
        test_mode ? 1 : 0,
        is_enabled ? 1 : 0,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Payment gateway created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentGateway = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      gateway_name,
      display_name,
      api_key,
      api_secret,
      merchant_id,
      test_mode,
      is_enabled,
    } = req.body;

    const db = getDatabase();

    // If enabling this gateway, disable others
    if (is_enabled) {
      await db.execute('UPDATE payment_gateways SET is_enabled = 0 WHERE id != ?', [id]);
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (gateway_name) {
      updates.push('gateway_name = ?');
      params.push(gateway_name);
    }
    if (display_name) {
      updates.push('display_name = ?');
      params.push(display_name);
    }
    if (api_key !== undefined) {
      updates.push('api_key = ?');
      params.push(api_key || null);
    }
    if (api_secret !== undefined && api_secret !== '') {
      updates.push('api_secret = ?');
      params.push(api_secret);
    }
    if (merchant_id !== undefined) {
      updates.push('merchant_id = ?');
      params.push(merchant_id || null);
    }
    if (test_mode !== undefined) {
      updates.push('test_mode = ?');
      params.push(test_mode ? 1 : 0);
    }
    if (is_enabled !== undefined) {
      updates.push('is_enabled = ?');
      params.push(is_enabled ? 1 : 0);
    }

    if (updates.length === 0) {
      throw createError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.execute(
      `UPDATE payment_gateways SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Payment gateway updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deletePaymentGateway = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM payment_gateways WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Payment gateway deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Print Settings ==========
export const getPrintSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [settings] = await db.execute(
      'SELECT * FROM print_settings ORDER BY setting_type ASC'
    ) as any[];

    const result: any = { header: null, footer: null };
    settings.forEach((s: any) => {
      result[s.setting_type] = {
        id: s.id,
        header_image: s.header_image || null,
        footer_text: s.footer_text || '',
      };
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePrintSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { header_image, footer_text } = req.body;
    const db = getDatabase();

    // Update or create header
    const [headerExists] = await db.execute(
      'SELECT id FROM print_settings WHERE setting_type = "header"'
    ) as any[];

    if (headerExists.length > 0) {
      await db.execute(
        'UPDATE print_settings SET header_image = ?, updated_at = NOW() WHERE setting_type = "header"',
        [header_image || null]
      );
    } else {
      await db.execute(
        'INSERT INTO print_settings (setting_type, header_image) VALUES ("header", ?)',
        [header_image || null]
      );
    }

    // Update or create footer
    const [footerExists] = await db.execute(
      'SELECT id FROM print_settings WHERE setting_type = "footer"'
    ) as any[];

    if (footerExists.length > 0) {
      await db.execute(
        'UPDATE print_settings SET footer_text = ?, updated_at = NOW() WHERE setting_type = "footer"',
        [footer_text || '']
      );
    } else {
      await db.execute(
        'INSERT INTO print_settings (setting_type, footer_text) VALUES ("footer", ?)',
        [footer_text || '']
      );
    }

    res.json({
      success: true,
      message: 'Print settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Front CMS Settings ==========
export const getFrontCMSSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [settings] = await db.execute(
      'SELECT * FROM front_cms_settings ORDER BY id DESC LIMIT 1'
    ) as any[];

    if (settings.length === 0) {
      res.json({
        success: true,
        data: {
          id: null,
          is_enabled: true,
          sidebar_enabled: true,
          rtl_mode: false,
          logo: null,
          favicon: null,
          footer_text: '',
          address: '',
          google_analytics: '',
          facebook_url: '',
          twitter_url: '',
          youtube_url: '',
          linkedin_url: '',
          instagram_url: '',
          pinterest_url: '',
          whatsapp_url: '',
          current_theme: 'default',
        },
      });
      return;
    }

    const setting = settings[0];
    res.json({
      success: true,
      data: {
        id: setting.id,
        is_enabled: setting.is_enabled === 1,
        sidebar_enabled: setting.sidebar_enabled === 1,
        rtl_mode: setting.rtl_mode === 1,
        logo: setting.logo || null,
        favicon: setting.favicon || null,
        footer_text: setting.footer_text || '',
        address: setting.address || '',
        google_analytics: setting.google_analytics || '',
        facebook_url: setting.facebook_url || '',
        twitter_url: setting.twitter_url || '',
        youtube_url: setting.youtube_url || '',
        linkedin_url: setting.linkedin_url || '',
        instagram_url: setting.instagram_url || '',
        pinterest_url: setting.pinterest_url || '',
        whatsapp_url: setting.whatsapp_url || '',
        current_theme: setting.current_theme || 'default',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateFrontCMSSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      is_enabled,
      sidebar_enabled,
      rtl_mode,
      logo,
      favicon,
      footer_text,
      address,
      google_analytics,
      facebook_url,
      twitter_url,
      youtube_url,
      linkedin_url,
      instagram_url,
      pinterest_url,
      whatsapp_url,
      current_theme,
    } = req.body;

    const db = getDatabase();

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    let logoPath = logo || null;
    let faviconPath = favicon || null;

    if (files) {
      if (files.logo && files.logo[0]) {
        logoPath = `/uploads/front-cms/${files.logo[0].filename}`;
      }
      if (files.favicon && files.favicon[0]) {
        faviconPath = `/uploads/front-cms/${files.favicon[0].filename}`;
      }
    }

    const [existing] = await db.execute(
      'SELECT id, logo, favicon FROM front_cms_settings ORDER BY id DESC LIMIT 1'
    ) as any[];

    // If no new file uploaded, keep existing path
    if (existing.length > 0) {
      if (!logoPath && existing[0].logo) {
        logoPath = existing[0].logo;
      }
      if (!faviconPath && existing[0].favicon) {
        faviconPath = existing[0].favicon;
      }

      await db.execute(
        `UPDATE front_cms_settings SET
         is_enabled = ?,
         sidebar_enabled = ?,
         rtl_mode = ?,
         logo = ?,
         favicon = ?,
         footer_text = ?,
         address = ?,
         google_analytics = ?,
         facebook_url = ?,
         twitter_url = ?,
         youtube_url = ?,
         linkedin_url = ?,
         instagram_url = ?,
         pinterest_url = ?,
         whatsapp_url = ?,
         current_theme = ?,
         updated_at = NOW()
         WHERE id = ?`,
        [
          is_enabled ? 1 : 0,
          sidebar_enabled ? 1 : 0,
          rtl_mode ? 1 : 0,
          logoPath || null,
          faviconPath || null,
          footer_text || '',
          address || '',
          google_analytics || '',
          facebook_url || '',
          twitter_url || '',
          youtube_url || '',
          linkedin_url || '',
          instagram_url || '',
          pinterest_url || '',
          whatsapp_url || '',
          current_theme || 'default',
          existing[0].id,
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO front_cms_settings 
         (is_enabled, sidebar_enabled, rtl_mode, logo, favicon, footer_text, address, google_analytics,
          facebook_url, twitter_url, youtube_url, linkedin_url, instagram_url, pinterest_url,
          whatsapp_url, current_theme, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          is_enabled ? 1 : 0,
          sidebar_enabled ? 1 : 0,
          rtl_mode ? 1 : 0,
          logoPath || null,
          faviconPath || null,
          footer_text || '',
          address || '',
          google_analytics || '',
          facebook_url || '',
          twitter_url || '',
          youtube_url || '',
          linkedin_url || '',
          instagram_url || '',
          pinterest_url || '',
          whatsapp_url || '',
          current_theme || 'default',
        ]
      );
    }

    res.json({
      success: true,
      message: 'Front CMS settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Languages ==========
export const getLanguages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [languages] = await db.execute(
      'SELECT * FROM languages ORDER BY is_default DESC, name ASC'
    ) as any[];

    res.json({
      success: true,
      data: languages.map((l: any) => ({
        ...l,
        is_default: l.is_default === 1,
        is_active: l.is_active === 1,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createLanguage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, code, is_default, is_active } = req.body;

    if (!name || !code) {
      throw createError('Language name and code are required', 400);
    }

    const db = getDatabase();

    // If setting as default, unset other defaults
    if (is_default) {
      await db.execute('UPDATE languages SET is_default = 0');
    }

    const [result] = await db.execute(
      'INSERT INTO languages (name, code, is_default, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [name, code, is_default ? 1 : 0, is_active !== false ? 1 : 0]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Language created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLanguage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, code, is_default, is_active } = req.body;
    const db = getDatabase();

    // If setting as default, unset other defaults
    if (is_default) {
      await db.execute('UPDATE languages SET is_default = 0 WHERE id != ?', [id]);
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (code) {
      updates.push('code = ?');
      params.push(code);
    }
    if (is_default !== undefined) {
      updates.push('is_default = ?');
      params.push(is_default ? 1 : 0);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      throw createError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.execute(
      `UPDATE languages SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Language updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLanguage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if it's the default language
    const [languages] = await db.execute(
      'SELECT is_default FROM languages WHERE id = ?',
      [id]
    ) as any[];

    if (languages.length === 0) {
      throw createError('Language not found', 404);
    }

    if (languages[0].is_default === 1) {
      throw createError('Cannot delete default language', 400);
    }

    await db.execute('DELETE FROM languages WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Language deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Modules Settings ==========
export const getModulesSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const [modules] = await db.execute(
      'SELECT id, name, display_name, description, icon, is_active, display_order FROM modules ORDER BY display_order ASC, name ASC'
    ) as any[];

    res.json({
      success: true,
      data: modules.map((m: any) => ({
        ...m,
        is_active: m.is_active === 1,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const updateModuleStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const db = getDatabase();

    // Prevent disabling dashboard module
    const [modules] = await db.execute(
      'SELECT name FROM modules WHERE id = ?',
      [id]
    ) as any[];

    if (modules.length === 0) {
      throw createError('Module not found', 404);
    }

    if (modules[0].name === 'dashboard' && !is_active) {
      throw createError('Cannot disable dashboard module', 400);
    }

    await db.execute(
      'UPDATE modules SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [is_active ? 1 : 0, id]
    );

    res.json({
      success: true,
      message: 'Module status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Custom Fields ==========
export const getCustomFields = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { field_belongs_to } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM custom_fields WHERE 1=1';
    const params: any[] = [];

    if (field_belongs_to) {
      query += ' AND field_belongs_to = ?';
      params.push(field_belongs_to);
    }

    query += ' ORDER BY display_order ASC, field_name ASC';

    const [fields] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: fields.map((f: any) => ({
        ...f,
        is_required: f.is_required === 1,
        is_visible: f.is_visible === 1,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomField = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      field_belongs_to,
      field_type,
      field_name,
      field_label,
      field_values,
      grid_column,
      is_required,
      is_visible,
      display_order,
    } = req.body;

    if (!field_belongs_to || !field_type || !field_name || !field_label) {
      throw createError('Field belongs to, type, name, and label are required', 400);
    }

    const db = getDatabase();

    const [result] = await db.execute(
      `INSERT INTO custom_fields 
       (field_belongs_to, field_type, field_name, field_label, field_values, grid_column, is_required, is_visible, display_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        field_belongs_to,
        field_type,
        field_name,
        field_label,
        field_values || null,
        grid_column || 12,
        is_required ? 1 : 0,
        is_visible !== false ? 1 : 0,
        display_order || 0,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Custom field created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomField = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      field_type,
      field_name,
      field_label,
      field_values,
      grid_column,
      is_required,
      is_visible,
      display_order,
    } = req.body;
    const db = getDatabase();

    const updates: string[] = [];
    const params: any[] = [];

    if (field_type) {
      updates.push('field_type = ?');
      params.push(field_type);
    }
    if (field_name) {
      updates.push('field_name = ?');
      params.push(field_name);
    }
    if (field_label) {
      updates.push('field_label = ?');
      params.push(field_label);
    }
    if (field_values !== undefined) {
      updates.push('field_values = ?');
      params.push(field_values || null);
    }
    if (grid_column !== undefined) {
      updates.push('grid_column = ?');
      params.push(grid_column);
    }
    if (is_required !== undefined) {
      updates.push('is_required = ?');
      params.push(is_required ? 1 : 0);
    }
    if (is_visible !== undefined) {
      updates.push('is_visible = ?');
      params.push(is_visible ? 1 : 0);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      params.push(display_order);
    }

    if (updates.length === 0) {
      throw createError('No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.execute(
      `UPDATE custom_fields SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Custom field updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomField = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM custom_fields WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Custom field deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== System Fields ==========
export const getSystemFields = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { field_belongs_to } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM system_fields WHERE 1=1';
    const params: any[] = [];

    if (field_belongs_to) {
      query += ' AND field_belongs_to = ?';
      params.push(field_belongs_to);
    }

    query += ' ORDER BY display_order ASC, field_name ASC';

    const [fields] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: fields.map((f: any) => ({
        ...f,
        is_enabled: f.is_enabled === 1,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const updateSystemFieldStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_enabled } = req.body;
    const db = getDatabase();

    await db.execute(
      'UPDATE system_fields SET is_enabled = ?, updated_at = NOW() WHERE id = ?',
      [is_enabled ? 1 : 0, id]
    );

    res.json({
      success: true,
      message: 'System field status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Backup & Restore ==========
import { AuthRequest } from '../middleware/auth';
import * as backupService from '../utils/backupService';
// path and fs already imported at top of file

export const getBackupRecords = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const records = await backupService.getBackupRecords();
    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const createBackup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id ? Number(req.user.id) : undefined;
    const backup = await backupService.createBackup({
      userId,
      backupType: 'manual',
    });

    // Clean up old backups
    await backupService.cleanupOldBackups();

    res.json({
      success: true,
      message: 'Backup created successfully',
      data: backup,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadBackup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [records] = await db.execute(
      'SELECT file_path, backup_name FROM backup_records WHERE id = ?',
      [id]
    ) as any[];

    if (records.length === 0) {
      throw createError('Backup record not found', 404);
    }

    const filePath = records[0].file_path;
    const backupName = records[0].backup_name;

    if (!fs.existsSync(filePath)) {
      throw createError('Backup file not found', 404);
    }

    res.download(filePath, backupName, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          next(err);
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const restoreBackup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [records] = await db.execute(
      'SELECT file_path FROM backup_records WHERE id = ?',
      [id]
    ) as any[];

    if (records.length === 0) {
      throw createError('Backup record not found', 404);
    }

    const filePath = records[0].file_path;

    await backupService.restoreBackup(filePath);

    res.json({
      success: true,
      message: 'Backup restored successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBackup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await backupService.deleteBackup(Number(id));

    res.json({
      success: true,
      message: 'Backup deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getBackupSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await backupService.getBackupSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBackupSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { auto_backup_enabled, backup_frequency, backup_time, keep_backups } = req.body;
    await backupService.updateBackupSettings({
      auto_backup_enabled,
      backup_frequency,
      backup_time,
      keep_backups,
    });

    res.json({
      success: true,
      message: 'Backup settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const generateCronSecretKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const secretKey = await backupService.generateCronSecretKey();
    res.json({
      success: true,
      message: 'Cron secret key generated successfully',
      data: { cron_secret_key: secretKey },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadBackup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // This would require multer middleware for file upload
    // For now, we'll return an error indicating it needs to be implemented
    throw createError('Backup upload not yet implemented. Please use restore from existing backup.', 501);
  } catch (error) {
    next(error);
  }
};

