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
}

let transporter: nodemailer.Transporter | null = null;
let emailConfig: EmailConfig | null = null;

/**
 * Initialize email transporter with SMTP configuration
 */
export const initializeEmailService = async (config: EmailConfig): Promise<void> => {
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

    emailConfig = config;
    transporter = nodemailer.createTransport({
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
    await transporter.verify();
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
export const getEmailConfig = async (): Promise<EmailConfig | null> => {
  try {
    const { getDatabase } = await import('../config/database.js');
    const db = getDatabase();

    const [settings] = await db.execute(
      `SELECT 
        smtp_host,
        smtp_port,
        smtp_secure,
        smtp_username,
        smtp_password
      FROM email_settings 
      WHERE is_enabled = 1 
      LIMIT 1`
    ) as any[];

    if (settings.length === 0) {
      return null;
    }

    const setting = settings[0];
    return {
      host: setting.smtp_host,
      port: setting.smtp_port || 587,
      secure: setting.smtp_secure === 1 || setting.smtp_port === 465,
      auth: {
        user: setting.smtp_username,
        pass: setting.smtp_password,
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

    // Get email config if not initialized
    if (!transporter || !emailConfig) {
      const config = await getEmailConfig();
      if (!config) {
        throw new Error('Email service is not configured. Please configure SMTP settings in System Settings.');
      }
      await initializeEmailService(config);
    }

    if (!transporter || !emailConfig) {
      throw new Error('Email transporter is not initialized');
    }

    // Get from_email and from_name from database if available
    let fromEmail = emailConfig.auth.user;
    let fromName = 'SchoolWizard';

    try {
      const { getDatabase } = await import('../config/database.js');
      const db = getDatabase();
      const [settings] = await db.execute(
        `SELECT from_email, from_name 
         FROM email_settings 
         WHERE is_enabled = 1 
         LIMIT 1`
      ) as any[];

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

    const info = await transporter.sendMail(mailOptions);
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
  password: string,
  loginUrl?: string
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
          <h1>Welcome to SchoolWizard!</h1>
        </div>
        <div class="content">
          <p>Dear ${studentName},</p>
          <p>Congratulations! Your admission has been confirmed. Your student account has been created successfully.</p>
          
          <div class="credentials">
            <h3>Your Login Credentials:</h3>
            <div class="credentials-item">
              <span class="credentials-label">Admission Number:</span>
              <div class="credentials-value">${admissionNo}</div>
            </div>
            <div class="credentials-item">
              <span class="credentials-label">Email:</span>
              <div class="credentials-value">${studentEmail}</div>
            </div>
            <div class="credentials-item">
              <span class="credentials-label">Password:</span>
              <div class="credentials-value">${password}</div>
            </div>
          </div>

          ${loginUrl ? `
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to Student Portal</a>
          </div>
          ` : ''}

          <div class="warning">
            <strong>Important:</strong> Please change your password after your first login for security purposes.
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
    subject: 'Welcome to SchoolWizard - Your Login Credentials',
    html: emailHtml,
  });
};

/**
 * Send parent account email with login credentials
 */
export const sendParentAccountEmail = async (data: {
  to: string;
  parentName: string;
  studentName: string;
  studentAdmissionNo: string;
  email: string;
  password: string;
  isPasswordReset?: boolean;
  loginUrl?: string;
}): Promise<void> => {
  // Use default login URL if not provided
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
          <h1>${data.isPasswordReset ? 'Password Reset - SchoolWizard' : 'Welcome to SchoolWizard Parent Portal!'}</h1>
        </div>
        <div class="content">
          <p>Dear ${data.parentName},</p>
          <p>${
            data.isPasswordReset
              ? 'Your parent account password has been reset. Please find your new login credentials below.'
              : `Your parent account has been created successfully. You can now access the Parent Portal to view information about your child: <strong>${data.studentName}</strong> (Admission No: ${data.studentAdmissionNo}).`
          }</p>
          
          <div class="credentials">
            <h3>Your Login Credentials:</h3>
            <div class="credentials-item">
              <span class="credentials-label">Email:</span>
              <div class="credentials-value">${data.email}</div>
            </div>
            <div class="credentials-item">
              <span class="credentials-label">Password:</span>
              <div class="credentials-value">${data.password}</div>
            </div>
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
            <strong>Important:</strong> Please change your password after your first login for security purposes.
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
      ? 'SchoolWizard - Parent Account Password Reset'
      : 'Welcome to SchoolWizard Parent Portal - Your Login Credentials',
    html: emailHtml,
  });
};

