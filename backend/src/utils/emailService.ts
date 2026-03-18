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

const BRAND_NAME = 'Make My School';
const SUPPORT_EMAIL = 'support@makemyschool.com';
const INFO_EMAIL = 'info@makemyschool.com';
const SUPPORT_PHONE = '8200614808';
const MAIN_WEBSITE_URL = 'https://makemyschool.com';
const ADMIN_LOGIN_URL = 'https://admin.makemyschool.com/login';
const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/makemyschool/?hl=af',
  facebook: 'https://www.facebook.com/profile.php?id=61588644934093',
  youtube: 'https://www.youtube.com/@MakeMySchool',
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildEmailTemplate = (data: {
  title: string;
  subtitle: string;
  bodyHtml: string;
  accentColor?: string;
}): string => {
  const accentColor = data.accentColor || '#2563eb';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(data.title)}</title>
    </head>
    <body style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,sans-serif;color:#1f2937;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;background:#f3f6fb;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
              <tr>
                <td style="padding:24px 24px 20px;background:linear-gradient(135deg, ${accentColor} 0%, #1e3a8a 100%);color:#ffffff;">
                  <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.92;">${BRAND_NAME}</p>
                  <h1 style="margin:0;font-size:25px;line-height:1.3;">${escapeHtml(data.title)}</h1>
                  <p style="margin:10px 0 0;font-size:15px;opacity:0.95;">${escapeHtml(data.subtitle)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  ${data.bodyHtml}
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid #e5e7eb;background:#f8fafc;padding:18px 24px;">
                  <p style="margin:0 0 10px;font-size:13px;color:#4b5563;">
                    Need help? Contact us at
                    <a href="mailto:${SUPPORT_EMAIL}" style="color:#1d4ed8;text-decoration:none;">${SUPPORT_EMAIL}</a>,
                    <a href="mailto:${INFO_EMAIL}" style="color:#1d4ed8;text-decoration:none;">${INFO_EMAIL}</a>
                    or call <a href="tel:${SUPPORT_PHONE}" style="color:#1d4ed8;text-decoration:none;">${SUPPORT_PHONE}</a>.
                  </p>
                  <p style="margin:0 0 10px;font-size:13px;">
                    <a href="${MAIN_WEBSITE_URL}" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8;text-decoration:none;">makemyschool.com</a>
                  </p>
                  <p style="margin:0 0 10px;font-size:13px;">
                    <a href="${SOCIAL_LINKS.instagram}" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8;text-decoration:none;">Instagram</a>
                    &nbsp;|&nbsp;
                    <a href="${SOCIAL_LINKS.facebook}" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8;text-decoration:none;">Facebook</a>
                    &nbsp;|&nbsp;
                    <a href="${SOCIAL_LINKS.youtube}" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8;text-decoration:none;">YouTube</a>
                  </p>
                  <p style="margin:0;font-size:11px;color:#6b7280;">This is an automated email from ${BRAND_NAME}. Please do not reply directly.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
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
  const studentPortalUrl = loginUrl || ADMIN_LOGIN_URL;
  const emailHtml = buildEmailTemplate({
    title: 'Welcome to Make My School',
    subtitle: 'Your student account is ready',
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear ${escapeHtml(studentName)},</p>
      <p style="margin:0 0 16px;">Great news! 🎉 Your admission has been confirmed and your account is now active.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;border:1px solid #dbe4f5;border-radius:10px;background:#f9fbff;">
        <tr>
          <td style="padding:14px;">
            <p style="margin:0 0 6px;"><strong>Admission Number:</strong> ${escapeHtml(admissionNo)}</p>
            <p style="margin:0;"><strong>Email:</strong> ${escapeHtml(studentEmail)}</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 16px;text-align:center;">
        <a href="${setupUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Set Your Password</a>
      </p>
      <p style="margin:0 0 16px;text-align:center;">
        <a href="${studentPortalUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Login to Portal</a>
      </p>
      <p style="margin:0;padding:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:13px;"><strong>Important:</strong> Please set your password first, then login.</p>
    `,
  });

  await sendEmail({
    to: studentEmail,
    subject: '🎉 Welcome to Make My School - Set Your Password',
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
  const safeSchoolName = data.schoolName?.trim() || BRAND_NAME;
  const portalLoginUrl = data.loginUrl || ADMIN_LOGIN_URL;
  const emailHtml = buildEmailTemplate({
    title: `Welcome to ${BRAND_NAME}`,
    subtitle: `${safeSchoolName} staff account created`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear ${escapeHtml(data.staffName)},</p>
      <p style="margin:0 0 16px;">Your staff account is now active. Please use the credentials below to sign in.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;border:1px solid #dbe4f5;border-radius:10px;background:#f9fbff;">
        <tr><td style="padding:14px;">
          <p style="margin:0 0 6px;"><strong>Staff ID:</strong> ${escapeHtml(data.staffId)}</p>
          <p style="margin:0 0 6px;"><strong>Login ID:</strong> ${escapeHtml(data.loginId)}</p>
          <p style="margin:0;"><strong>Password:</strong> ${escapeHtml(data.password)}</p>
        </td></tr>
      </table>
      <p style="margin:0 0 16px;text-align:center;">
        <a href="${portalLoginUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Login to Staff Portal</a>
      </p>
      <p style="margin:0;padding:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:13px;"><strong>Important:</strong> Change your password after first login for better security.</p>
    `,
  });

  await sendEmail({
    to: data.to,
    subject: `Welcome to ${BRAND_NAME} - Staff Account Created`,
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
  adminPassword?: string;
  setupUrl: string;
  loginUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
}): Promise<void> => {
  const loginUrl = data.loginUrl || ADMIN_LOGIN_URL;
  const trialDays = Math.max(
    1,
    Math.round((data.trialEndsAt.getTime() - data.trialStartsAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  const emailHtml = buildEmailTemplate({
    title: `Welcome to ${BRAND_NAME}!`,
    subtitle: 'Your school is successfully onboarded 🎉',
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear Administrator,</p>
      <p style="margin:0 0 16px;">Congratulations! 🎉 <strong>${escapeHtml(data.schoolName)}</strong> is now registered on ${BRAND_NAME}.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;border:1px solid #dbe4f5;border-radius:10px;background:#f9fbff;">
        <tr><td style="padding:14px;">
          <p style="margin:0 0 6px;"><strong>Trial Period:</strong> ${trialDays} days</p>
          <p style="margin:0 0 6px;"><strong>Starts:</strong> ${escapeHtml(data.trialStartsAt.toDateString())}</p>
          <p style="margin:0;"><strong>Ends:</strong> ${escapeHtml(data.trialEndsAt.toDateString())}</p>
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;border:1px solid #dbe4f5;border-radius:10px;background:#f9fbff;">
        <tr><td style="padding:14px;">
          <p style="margin:0 0 6px;"><strong>Login URL:</strong> <a href="${ADMIN_LOGIN_URL}" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8;text-decoration:none;">admin.makemyschool.com</a></p>
          <p style="margin:0 0 6px;"><strong>Email:</strong> ${escapeHtml(data.adminEmail)}</p>
          <p style="margin:0;"><strong>Password:</strong> ${data.adminPassword ? escapeHtml(data.adminPassword) : 'Set via secure password setup link below'}</p>
        </td></tr>
      </table>
      <p style="margin:0 0 12px;text-align:center;">
        <a href="${data.setupUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Set Admin Password</a>
      </p>
      <p style="margin:0 0 16px;text-align:center;">
        <a href="${loginUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Login to Admin Panel</a>
      </p>
      <p style="margin:0;padding:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:13px;"><strong>Need assistance?</strong> Reach us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#1d4ed8;text-decoration:none;">${SUPPORT_EMAIL}</a>, <a href="mailto:${INFO_EMAIL}" style="color:#1d4ed8;text-decoration:none;">${INFO_EMAIL}</a> or call <a href="tel:${SUPPORT_PHONE}" style="color:#1d4ed8;text-decoration:none;">${SUPPORT_PHONE}</a>.</p>
    `,
  });

  await sendEmail({
    to: data.to,
    subject: `🎉 Welcome to ${BRAND_NAME} — ${data.schoolName} Onboarding Complete`,
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
  const safeUserName = userName || 'User';
  const emailHtml = buildEmailTemplate({
    title: 'Password Reset Request',
    subtitle: `${BRAND_NAME} account security`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear ${escapeHtml(safeUserName)},</p>
      <p style="margin:0 0 16px;">We received a request to reset your password. Use the button below to set a new password. This secure link expires in 1 hour.</p>
      <p style="margin:0 0 16px;text-align:center;">
        <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a>
      </p>
      <p style="margin:0;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;font-size:13px;">If you did not request this change, please ignore this email and contact us immediately.</p>
    `,
  });

  await sendEmail({
    to,
    subject: `${BRAND_NAME} Password Reset`,
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
}): Promise<void> => {
  const loginUrl = data.loginUrl || ADMIN_LOGIN_URL;
  const emailHtml = buildEmailTemplate({
    title: data.isPasswordReset ? 'Parent Account Password Reset' : 'Welcome to Make My School Parent Portal',
    subtitle: data.isPasswordReset ? 'Your login access has been refreshed' : 'Your parent account is now active',
    accentColor: '#0f766e',
    bodyHtml: `
      <p style="margin:0 0 14px;">Dear ${escapeHtml(data.parentName)},</p>
      <p style="margin:0 0 16px;">
        ${
          data.isPasswordReset
            ? 'Your parent account password setup link is ready. Please use it to secure your access.'
            : `Your parent account was created successfully for <strong>${escapeHtml(data.studentName)}</strong> (Admission No: ${escapeHtml(data.studentAdmissionNo)}).`
        }
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;border:1px solid #d1fae5;border-radius:10px;background:#f0fdfa;">
        <tr><td style="padding:14px;">
          <p style="margin:0;"><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        </td></tr>
      </table>
      <p style="margin:0 0 12px;text-align:center;">
        <a href="${data.setupUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 20px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Set Password</a>
      </p>
      <p style="margin:0 0 16px;text-align:center;">
        <a href="${loginUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:11px 20px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Login to Parent Portal</a>
      </p>
      <p style="margin:0 0 8px;"><strong>You can:</strong></p>
      <ul style="margin:0 0 16px;padding-left:20px;">
        <li>Track attendance and academics</li>
        <li>Check fees and payments</li>
        <li>View homework and timetable</li>
        <li>Access updates and notices</li>
      </ul>
      <p style="margin:0;padding:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;font-size:13px;"><strong>Important:</strong> Use the secure setup link before first login.</p>
    `,
  });

  await sendEmail({
    to: data.to,
    subject: data.isPasswordReset
      ? `${BRAND_NAME} - Parent Account Password Setup`
      : `Welcome to ${BRAND_NAME} Parent Portal - Set Password`,
    html: emailHtml,
    schoolId: data.schoolId,
  });
};

