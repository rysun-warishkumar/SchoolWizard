import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  schoolId?: number;
}

let transporter: nodemailer.Transporter | null = null;
let emailConfig: EmailConfig | null = null;
const transporterByScope = new Map<string, nodemailer.Transporter>();
const emailConfigByScope = new Map<string, EmailConfig>();

const getEmailScopeKey = (schoolId?: number): string => {
  return schoolId != null ? `school:${schoolId}` : 'global';
};

/**
 * Initialize email transporter with SMTP configuration
 */
export const initializeEmailService = async (config: EmailConfig, schoolId?: number): Promise<void> => {
  try {
    // Validate configuration
    if (!config.host || !config.host.trim()) {
      throw new Error('SMTP host is required');
    }
    if (!config.port || config.port < 1 || config.port > 65535) {
      throw new Error('SMTP port must be between 1 and 65535');
    }
    if (!config.auth.user || !config.auth.user.trim()) {
      throw new Error('SMTP username is required');
    }
    if (!config.auth.pass || !config.auth.pass.trim()) {
      throw new Error('SMTP password is required');
    }

    const scopeKey = getEmailScopeKey(schoolId);
    const scopedTransporter = nodemailer.createTransport({
      host: config.host.trim(),
      port: config.port,
      secure: config.secure, // true for 465, false for other ports
      auth: {
        user: config.auth.user.trim(),
        pass: config.auth.pass,
      },
      // Add timeout settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
      // Add debug option in development
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development',
    });

    // Verify connection
    await scopedTransporter.verify();
    emailConfigByScope.set(scopeKey, config);
    transporterByScope.set(scopeKey, scopedTransporter);
    // Backward-compatible global references (legacy imports may still rely on these).
    emailConfig = config;
    transporter = scopedTransporter;
    console.log('Email service initialized successfully');
  } catch (error: any) {
    console.error('Error initializing email service:', error);
    // Re-throw with more context
    if (error.code) {
      error.code = error.code;
    }
    throw error;
  }
};

/**
 * Get email configuration from database
 */
export const getEmailConfig = async (schoolId?: number): Promise<EmailConfig | null> => {
  try {
    const { getDatabase } = await import('../config/database.js');
    const db = getDatabase();

    let query = `SELECT 
      smtp_host,
      smtp_port,
      smtp_secure,
      smtp_username,
      smtp_password
    FROM email_settings 
    WHERE is_enabled = 1`;
    const params: any[] = [];

    const [schoolIdColumn] = await db.execute(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = DATABASE()
       AND table_name = 'email_settings'
       AND column_name = 'school_id'
       LIMIT 1`
    ) as any[];
    const hasSchoolIdColumn = Array.isArray(schoolIdColumn) && schoolIdColumn.length > 0;

    if (hasSchoolIdColumn) {
      if (schoolId != null) {
        query += ` AND (school_id = ? OR school_id IS NULL) ORDER BY (school_id = ?) DESC`;
        params.push(schoolId, schoolId);
      } else {
        query += ' AND school_id IS NULL';
      }
    }

    query += ' LIMIT 1';
    const [settings] = await db.execute(query, params) as any[];

    let selectedSetting = settings.length > 0 ? settings[0] : null;

    // Backward compatibility: if no explicit global SMTP row exists, use latest enabled SMTP row.
    if (!selectedSetting && hasSchoolIdColumn && schoolId == null) {
      const [fallbackSettings] = await db.execute(
        `SELECT smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password
         FROM email_settings
         WHERE is_enabled = 1
         ORDER BY id DESC
         LIMIT 1`
      ) as any[];
      selectedSetting = fallbackSettings.length > 0 ? fallbackSettings[0] : null;
    }

    if (!selectedSetting) {
      return null;
    }

    return {
      host: selectedSetting.smtp_host,
      port: selectedSetting.smtp_port || 587,
      secure: selectedSetting.smtp_secure === 1 || selectedSetting.smtp_port === 465,
      auth: {
        user: selectedSetting.smtp_username,
        pass: selectedSetting.smtp_password,
      },
    };
  } catch (error) {
    console.error('Error getting email config:', error);
    return null;
  }
};

/**
 * Send email using configured transporter
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Validate email options
    if (!options.to || !options.to.trim()) {
      throw new Error('Recipient email address is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(options.to.trim())) {
      throw new Error('Invalid recipient email address format');
    }

    if (!options.subject || !options.subject.trim()) {
      throw new Error('Email subject is required');
    }

    if (!options.html || !options.html.trim()) {
      throw new Error('Email content is required');
    }

    const scopeKey = getEmailScopeKey(options.schoolId);
    let scopedTransporter = transporterByScope.get(scopeKey) || null;
    let scopedEmailConfig = emailConfigByScope.get(scopeKey) || null;

    // Get email config if not initialized for this school scope
    if (!scopedTransporter || !scopedEmailConfig) {
      const config = await getEmailConfig(options.schoolId);
      if (!config) {
        throw new Error('Email service is not configured. Please configure SMTP settings in System Settings.');
      }
      await initializeEmailService(config, options.schoolId);
      scopedTransporter = transporterByScope.get(scopeKey) || null;
      scopedEmailConfig = emailConfigByScope.get(scopeKey) || null;
    }

    if (!scopedTransporter || !scopedEmailConfig) {
      throw new Error('Email transporter is not initialized');
    }

    // Get from_email and from_name from database if available
    let fromEmail = scopedEmailConfig.auth.user;
    let fromName = 'Make My School';

    try {
      const { getDatabase } = await import('../config/database.js');
      const db = getDatabase();
      const [schoolIdColumn] = await db.execute(
        `SELECT 1 FROM information_schema.columns
         WHERE table_schema = DATABASE()
         AND table_name = 'email_settings'
         AND column_name = 'school_id'
         LIMIT 1`
      ) as any[];
      const hasSchoolIdColumn = Array.isArray(schoolIdColumn) && schoolIdColumn.length > 0;

      let fromQuery = `SELECT from_email, from_name FROM email_settings WHERE is_enabled = 1`;
      const fromParams: any[] = [];
      if (hasSchoolIdColumn) {
        if (options.schoolId != null) {
          fromQuery += ' AND (school_id = ? OR school_id IS NULL) ORDER BY (school_id = ?) DESC';
          fromParams.push(options.schoolId, options.schoolId);
        } else {
          fromQuery += ' AND school_id IS NULL';
        }
      }
      fromQuery += ' LIMIT 1';

      const [settings] = await db.execute(fromQuery, fromParams) as any[];

      if (settings.length > 0 && settings[0].from_email) {
        fromEmail = settings[0].from_email;
      }
      if (settings.length > 0 && settings[0].from_name) {
        fromName = settings[0].from_name;
      }
    } catch (dbError) {
      // If we can't get from_email/from_name, use defaults
      console.warn('Could not retrieve from_email/from_name from database, using defaults');
    }

    const mailOptions = {
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      to: options.to.trim(),
      subject: options.subject.trim(),
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await scopedTransporter.sendMail(mailOptions);
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });
  } catch (error: any) {
    console.error('Error sending email:', {
      error: error.message,
      code: error.code,
      responseCode: error.responseCode,
      to: options.to,
    });
    
    // Preserve original error details
    const errorMessage = error.message || 'Failed to send email';
    const enhancedError: any = new Error(errorMessage);
    enhancedError.code = error.code;
    enhancedError.responseCode = error.responseCode;
    throw enhancedError;
  }
};

/**
 * Send student admission email with login credentials
 */
export const sendStudentAdmissionEmail = async (
  studentEmail: string,
  studentName: string,
  admissionNo: string,
  setupUrl: string,
  loginUrl?: string,
  schoolId?: number
): Promise<void> => {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .header {
          background-color: #2563eb;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          background-color: #f9fafb;
        }
        .credentials {
          background-color: white;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
          border-left: 4px solid #2563eb;
        }
        .credentials-item {
          margin: 10px 0;
        }
        .credentials-label {
          font-weight: bold;
          color: #666;
        }
        .credentials-value {
          color: #333;
          font-size: 16px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 12px;
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Make My School !</h1>
        </div>
        <div class="content">
          <p>Dear ${studentName},</p>
          <p>Congratulations! Your admission has been confirmed. Your student account has been created successfully.</p>
          
          <div class="credentials">
            <h3>Your Account Details:</h3>
            <div class="credentials-item">
              <span class="credentials-label">Admission Number:</span>
              <div class="credentials-value">${admissionNo}</div>
            </div>
            <div class="credentials-item">
              <span class="credentials-label">Email:</span>
              <div class="credentials-value">${studentEmail}</div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${setupUrl}" class="button">Set Your Password</a>
          </div>

          ${loginUrl ? `
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to Student Portal</a>
          </div>
          ` : ''}

          <div class="warning">
            <strong>Important:</strong> Use the secure password setup link above before your first login.
          </div>

          <p>If you have any questions or need assistance, please contact the school administration.</p>
          
          <p>Best regards,<br>School Administration</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: studentEmail,
    subject: 'Welcome to Make My School - Set Your Password',
    html: emailHtml,
    schoolId,
  });
};

/**
 * Send staff welcome email with credentials
 */
export const sendStaffWelcomeEmail = async (data: {
  to: string;
  staffName: string;
  staffId: string;
  loginId: string;
  password: string;
  schoolName?: string;
  loginUrl?: string;
  schoolId?: number;
}): Promise<void> => {
  const safeSchoolName = data.schoolName?.trim() || 'SchoolWizard';
  const loginUrl = data.loginUrl || 'http://localhost:5173/login';
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; background-color: #f9fafb; }
        .credentials { background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .credentials-item { margin: 10px 0; }
        .credentials-label { font-weight: bold; color: #666; }
        .credentials-value { color: #333; font-size: 16px; word-break: break-word; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${safeSchoolName}</h1>
        </div>
        <div class="content">
          <p>Dear ${data.staffName},</p>
          <p>Your staff account has been created successfully.</p>

          <div class="credentials">
            <h3>Your Login Credentials</h3>
            <div class="credentials-item">
              <span class="credentials-label">Staff ID:</span>
              <div class="credentials-value">${data.staffId}</div>
            </div>
            <div class="credentials-item">
              <span class="credentials-label">User ID:</span>
              <div class="credentials-value">${data.loginId}</div>
            </div>
            <div class="credentials-item">
              <span class="credentials-label">Password:</span>
              <div class="credentials-value">${data.password}</div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to Staff Portal</a>
          </div>

          <div class="warning">
            <strong>Important:</strong> Please change your password after first login for account security.
          </div>

          <p>Best regards,<br>${safeSchoolName} Administration</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: data.to,
    subject: `Welcome to ${safeSchoolName} - Staff Account Created`,
    html: emailHtml,
    schoolId: data.schoolId,
  });
};

/**
 * Send parent account email with login credentials
 */

export const sendSchoolOnboardingEmail = async (data: {
  to: string;
  schoolName: string;
  trialStartsAt: Date;
  trialEndsAt: Date;
  adminEmail: string;
  setupUrl: string;
  loginUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
}): Promise<void> => {
  // prepare login url default to frontend path
  const loginUrl = data.loginUrl || 'http://localhost:5173/login';
  const contactEmail = data.contactEmail || 'info@makemyschool.com';
  const contactPhone = data.contactPhone || '';
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .header {
          background-color: #2563eb;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          background-color: #f9fafb;
        }
        .credentials {
          background-color: white;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
          border-left: 4px solid #2563eb;
        }
        .credentials-item {
          margin: 10px 0;
        }
        .credentials-label {
          font-weight: bold;
          color: #666;
        }
        .credentials-value {
          color: #333;
          font-size: 16px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 12px;
        }
        .info-box {
          background-color: #eff6ff;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Make My School!</h1>
        </div>
        <div class="content">
          <p>Dear Administrator,</p>
          <p>Thank you for registering <strong>${data.schoolName}</strong> with Make My School. Your 30‑day free trial has begun.</p>

          <div class="info-box">
            <p><strong>Trial Period:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Starts: ${data.trialStartsAt.toDateString()}</li>
              <li>Ends: ${data.trialEndsAt.toDateString()}</li>
            </ul>
          </div>

          <div class="credentials">
            <h3>Your Admin Account:</h3>
            <div class="credentials-item">
              <span class="credentials-label">Email:</span>
              <div class="credentials-value">${data.adminEmail}</div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${data.setupUrl}" class="button">Set Admin Password</a>
          </div>

          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Go to Login Page</a>
          </div>

          <p>Please use the secure setup link above to create your password.</p>

          <p>If you need assistance, contact us at <a href="mailto:${contactEmail}">${contactEmail}</a>${contactPhone ? ' or call ' + contactPhone : ''}.</p>

          <p>Best regards,<br>Make My School Support Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: data.to,
    subject: `Welcome to Make My School — ${data.schoolName} onboarded`,
    html: emailHtml,
  });
};

// Password reset email helper
export const sendPasswordResetEmail = async (
  to: string,
  userName: string,
  resetUrl: string,
  schoolId?: number
): Promise<void> => {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Dear ${userName || 'User'},</p>
          <p>We received a request to reset your password. Click the button below to choose a new password. This link will expire in one hour.</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>SchoolWizard Support Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: 'SchoolWizard Password Reset',
    schoolId,
    html: emailHtml,
  });
};

export const sendParentAccountEmail = async (data: {
  to: string;
  parentName: string;
  studentName: string;
  studentAdmissionNo: string;
  email: string;
  setupUrl: string;
  isPasswordReset?: boolean;
  loginUrl?: string;
  schoolId?: number;
}): Promise<void> => {  // Use default login URL if not provided
  // Note: FRONTEND_URL is not in env schema, so we use a default
  const loginUrl = data.loginUrl || 'http://localhost:5173/login';
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .header {
          background-color: #10b981;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
          background-color: #f9fafb;
        }
        .credentials {
          background-color: white;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
          border-left: 4px solid #10b981;
        }
        .credentials-item {
          margin: 10px 0;
        }
        .credentials-label {
          font-weight: bold;
          color: #666;
        }
        .credentials-value {
          color: #333;
          font-size: 16px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #10b981;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 12px;
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .info-box {
          background-color: #dbeafe;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.isPasswordReset ? 'Password Reset - Make My School' : 'Welcome to Make My School Parent Portal!'}</h1>
        </div>
        <div class="content">
          <p>Dear ${data.parentName},</p>
          <p>${
            data.isPasswordReset
              ? 'Your parent account password has been reset. Please find your new login credentials below.'
              : `Your parent account has been created successfully. You can now access the Parent Portal to view information about your child: <strong>${data.studentName}</strong> (Admission No: ${data.studentAdmissionNo}).`
          }</p>
          
          <div class="credentials">
            <h3>Your Parent Account:</h3>
            <div class="credentials-item">
              <span class="credentials-label">Email:</span>
              <div class="credentials-value">${data.email}</div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${data.setupUrl}" class="button">Set Password</a>
          </div>

          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to Parent Portal</a>
          </div>

          <div class="info-box">
            <strong>What you can do in the Parent Portal:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>View your child's academic information</li>
              <li>Check attendance records</li>
              <li>View fees and payment history</li>
              <li>Track homework assignments</li>
              <li>View class timetable</li>
              <li>Apply for leave on behalf of your child</li>
              <li>Download study materials and notices</li>
            </ul>
          </div>

          <div class="warning">
            <strong>Important:</strong> Use the secure setup link above before your first login.
          </div>

          <p>If you have multiple children, you can switch between them using the child selector in the portal.</p>

          <p>If you have any questions or need assistance, please contact the school administration.</p>
          
          <p>Best regards,<br>School Administration</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: data.to,
    subject: data.isPasswordReset
      ? 'Make My School - Parent Account Password Setup'
      : 'Welcome to Make My School Parent Portal - Set Password',
    html: emailHtml,
    schoolId: data.schoolId,
  });
};

