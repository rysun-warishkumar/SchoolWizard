import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import https from 'https';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { sendSchoolOnboardingEmail } from '../utils/emailService';
import { createPasswordSetupLink } from '../utils/passwordSetupService';

const TRIAL_DAYS = 30;

type PhonePeRegistrationConfig = {
  is_enabled: boolean;
  test_mode: boolean;
  merchant_id: string;
  salt_key: string;
  salt_index: number;
  registration_amount: number;
  currency: string;
  api_base_url: string;
  redirect_url?: string | null;
  callback_url?: string | null;
};

const resolvePhonePeRedirectUrl = (responseBody: any): string | null => {
  return (
    responseBody?.data?.instrumentResponse?.redirectInfo?.url ||
    responseBody?.data?.redirectInfo?.url ||
    responseBody?.data?.redirectUrl ||
    responseBody?.redirectUrl ||
    null
  );
};

const postJson = async (
  url: string,
  payload: Record<string, any>,
  headers: Record<string, string>
): Promise<{ statusCode: number; body: any }> => {
  const serialized = JSON.stringify(payload);
  const parsed = new URL(url);
  const options: https.RequestOptions = {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: `${parsed.pathname}${parsed.search}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(serialized),
      ...headers,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let parsedBody: any = raw;
        try {
          parsedBody = raw ? JSON.parse(raw) : {};
        } catch {
          parsedBody = { raw };
        }
        resolve({
          statusCode: Number(res.statusCode || 500),
          body: parsedBody,
        });
      });
    });
    req.on('error', reject);
    req.write(serialized);
    req.end();
  });
};

const postFormUrlEncoded = async (
  url: string,
  formData: Record<string, string>
): Promise<{ statusCode: number; body: any }> => {
  const encoded = new URLSearchParams(formData).toString();
  const parsed = new URL(url);
  const options: https.RequestOptions = {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: `${parsed.pathname}${parsed.search}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(encoded),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let parsedBody: any = raw;
        try {
          parsedBody = raw ? JSON.parse(raw) : {};
        } catch {
          parsedBody = { raw };
        }
        resolve({
          statusCode: Number(res.statusCode || 500),
          body: parsedBody,
        });
      });
    });
    req.on('error', reject);
    req.write(encoded);
    req.end();
  });
};

const getPhonePeRegistrationConfig = async (): Promise<PhonePeRegistrationConfig | null> => {
  const db = getDatabase();
  const [rows] = await db.execute(
    `SELECT is_enabled, test_mode, merchant_id, salt_key, salt_index, registration_amount, currency,
            api_base_url, redirect_url, callback_url
     FROM platform_payment_configs
     WHERE gateway_name = 'phonepe'
     LIMIT 1`
  ) as any[];

  if (!rows.length) return null;
  const row = rows[0];
  return {
    is_enabled: row.is_enabled === 1,
    test_mode: row.test_mode !== 0,
    merchant_id: String(row.merchant_id || '').trim(),
    salt_key: String(row.salt_key || '').trim(),
    salt_index: Number(row.salt_index || 1),
    registration_amount: Number(row.registration_amount ?? 1),
    currency: String(row.currency || 'INR').trim().toUpperCase(),
    api_base_url: String(row.api_base_url || 'https://api-preprod.phonepe.com/apis/pg-sandbox').trim(),
    redirect_url: row.redirect_url || null,
    callback_url: row.callback_url || null,
  };
};

const decodePhonePeResponseToken = (token: string): any | null => {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const initiatePhonePeRegistrationPayment = async (params: {
  schoolId: number;
  req: Request;
  phonepeConfig: PhonePeRegistrationConfig;
}): Promise<{
  merchantTransactionId: string;
  redirectPaymentUrl: string;
  rawResponse: any;
}> => {
  const { schoolId, req, phonepeConfig } = params;
  const merchantTransactionId = `SWREG${schoolId}${Date.now().toString().slice(-8)}`;
  const amountInPaise = Math.round(phonepeConfig.registration_amount * 100);
  const frontendBase = (process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const callbackBase = `${req.protocol}://${req.get('host')}`;
  const redirectUrl =
    phonepeConfig.redirect_url ||
    `${frontendBase}/login?registration_payment=completed&school=${schoolId}`;
  const callbackUrl =
    phonepeConfig.callback_url ||
    `${callbackBase}/api/v1/public/schools/payment/phonepe/callback`;

  const apiBase = phonepeConfig.api_base_url.replace(/\/$/, '');
  const authUrl = phonepeConfig.test_mode
    ? `${apiBase}/v1/oauth/token`
    : 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token';
  const payUrl = `${apiBase}/checkout/v2/pay`;

  // PhonePe Standard Checkout v2 auth flow (Client ID, Client Version, Client Secret)
  const authResponse = await postFormUrlEncoded(authUrl, {
    client_id: phonepeConfig.merchant_id,
    client_version: String(phonepeConfig.salt_index),
    client_secret: phonepeConfig.salt_key,
    grant_type: 'client_credentials',
  });
  const accessToken = String(authResponse.body?.access_token || '').trim();
  const tokenType = String(authResponse.body?.token_type || 'O-Bearer').trim();
  if (authResponse.statusCode < 200 || authResponse.statusCode >= 300 || !accessToken) {
    const authCode = String(authResponse.body?.code || 'AUTH_FAILED');
    const authMessage = String(authResponse.body?.message || 'Failed to fetch authorization token');
    throw createError(`PhonePe authorization failed (${authCode}): ${authMessage}`, 502);
  }

  const payload = {
    merchantOrderId: merchantTransactionId,
    amount: amountInPaise,
    paymentFlow: {
      type: 'PG_CHECKOUT',
      merchantUrls: {
        redirectUrl,
      },
    },
    metaInfo: {
      udf1: `school:${schoolId}`,
      udf2: callbackUrl,
    },
  };
  const phonePeResponse = await postJson(
    payUrl,
    payload,
    {
      Accept: 'application/json',
      Authorization: `${tokenType} ${accessToken}`,
    }
  );

  const redirectPaymentUrl = String(
    phonePeResponse.body?.redirectUrl ||
    resolvePhonePeRedirectUrl(phonePeResponse.body) ||
    ''
  ).trim() || null;
  const isSuccess = phonePeResponse.statusCode >= 200
    && phonePeResponse.statusCode < 300
    && !phonePeResponse.body?.code;

  if (!isSuccess || !redirectPaymentUrl) {
    const phonePeCode = String(phonePeResponse.body?.code || 'UNKNOWN');
    const phonePeMessage = String(phonePeResponse.body?.message || 'Payment initiation failed');
    throw createError(`PhonePe payment initiation failed (${phonePeCode}): ${phonePeMessage}`, 502);
  }

  return {
    merchantTransactionId,
    redirectPaymentUrl,
    rawResponse: phonePeResponse.body || {},
  };
};

/**
 * Slugify school name for unique URL-friendly slug.
 * Ensures uniqueness by appending -2, -3, ... if slug exists.
 */
async function getUniqueSlug(db: any, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 0;
  let [rows] = await db.execute('SELECT id FROM schools WHERE slug = ?', [slug]) as any[];
  while (rows.length > 0) {
    counter += 1;
    slug = counter === 1 ? `${baseSlug}-2` : `${baseSlug}-${counter + 1}`;
    [rows] = await db.execute('SELECT id FROM schools WHERE slug = ?', [slug]) as any[];
  }
  return slug;
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'school';
}

/**
 * POST /api/v1/public/schools/register
 * Public school registration. Creates school (trial 30 days) + admin user.
 */
export const registerSchool = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { schoolName, adminName, email, password } = req.body;
    let phonepeConfig: PhonePeRegistrationConfig | null = null;
    try {
      phonepeConfig = await getPhonePeRegistrationConfig();
    } catch (error: any) {
      if (error?.code !== 'ER_NO_SUCH_TABLE') {
        throw error;
      }
    }

    const isPhonePePaymentRequired = Boolean(phonepeConfig?.is_enabled);
    if (
      isPhonePePaymentRequired &&
      (!phonepeConfig?.merchant_id || !phonepeConfig?.salt_key || phonepeConfig.registration_amount <= 0)
    ) {
      throw createError('Registration payment is enabled but PhonePe is not fully configured. Please complete Payment Configuration.', 503);
    }

    if (!schoolName || typeof schoolName !== 'string' || !schoolName.trim()) {
      throw createError('School name is required', 400);
    }
    if (!adminName || typeof adminName !== 'string' || adminName.trim().length < 2) {
      throw createError('Admin name must be at least 2 characters', 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw createError('Valid email is required', 400);
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw createError('Password must be at least 6 characters', 400);
    }

    const db = getDatabase();
    const connection = await db.getConnection();

    let schoolId!: number;
    let adminUserId!: number;
    let slug!: string;
    let registrationPayment: {
      enabled: boolean;
      gateway: 'phonepe';
      mode: 'test' | 'live';
      amount: number;
      currency: string;
      redirectUrl: string | null;
    } | null = null;
    const trialStartsAt = new Date();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    try {
      await connection.beginTransaction();

      // Check if schools table exists (Phase 1 migration)
      const [tables] = await connection.execute(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'schools'`
      ) as any[];
      if (!tables || tables.length === 0) {
        throw createError('School registration is not available. Please contact support.', 503);
      }

      // Email unique globally
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email.trim()]
      ) as any[];
      if (existingUsers.length > 0) {
        throw createError('An account with this email already exists. Please sign in or use a different email.', 400);
      }

      const baseSlug = slugify(schoolName.trim());
      slug = await getUniqueSlug(connection, baseSlug);

      await connection.execute(
        `INSERT INTO schools (name, slug, status, trial_starts_at, trial_ends_at, created_at, updated_at)
         VALUES (?, ?, 'trial', ?, ?, NOW(), NOW())`,
        [schoolName.trim(), slug, trialStartsAt, trialEndsAt]
      );

      const [insertSchool] = await connection.execute('SELECT LAST_INSERT_ID() as id') as any[];
      schoolId = insertSchool[0].id;

      const [adminRoles] = await connection.execute(
        "SELECT id FROM roles WHERE name = 'admin' LIMIT 1"
      ) as any[];
      const adminRoleId = adminRoles.length > 0 ? adminRoles[0].id : 2;

      const hashedPassword = await bcrypt.hash(password, 10);
      const [userInsertResult] = await connection.execute(
        `INSERT INTO users (email, password, name, role_id, school_id, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [email.trim(), hashedPassword, adminName.trim(), adminRoleId, schoolId]
      ) as any;
      adminUserId = userInsertResult.insertId;

      // Optional: create default general_settings row for this school (if table has school_id)
      const [cols] = await connection.execute(
        `SELECT COLUMN_NAME FROM information_schema.columns 
         WHERE table_schema = DATABASE() AND table_name = 'general_settings' AND COLUMN_NAME = 'school_id'`
      ) as any[];
      if (cols && cols.length > 0) {
        const [existing] = await connection.execute(
          'SELECT id FROM general_settings WHERE school_id = ? LIMIT 1',
          [schoolId]
        ) as any[];
        if (existing.length === 0) {
          await connection.execute(
            `INSERT INTO general_settings (school_id, setting_key, setting_value, setting_type, description, created_at, updated_at)
             VALUES (?, 'school_name', ?, 'text', 'School Name', NOW(), NOW())`,
            [schoolId, schoolName.trim()]
          );
        }
      }

      if (isPhonePePaymentRequired && phonepeConfig) {
        const paymentInit = await initiatePhonePeRegistrationPayment({
          schoolId,
          req,
          phonepeConfig,
        });

        await connection.execute(
          `INSERT INTO registration_payments
           (school_id, gateway_name, merchant_transaction_id, amount, currency, status, phonepe_response, created_at, updated_at)
           VALUES (?, 'phonepe', ?, ?, ?, 'initiated', ?, NOW(), NOW())`,
          [
            schoolId,
            paymentInit.merchantTransactionId,
            phonepeConfig.registration_amount,
            phonepeConfig.currency,
            JSON.stringify(paymentInit.rawResponse || {}),
          ]
        );

        registrationPayment = {
          enabled: true,
          gateway: 'phonepe',
          mode: phonepeConfig.test_mode ? 'test' : 'live',
          amount: phonepeConfig.registration_amount,
          currency: phonepeConfig.currency,
          redirectUrl: paymentInit.redirectPaymentUrl,
        };
      }

      await connection.commit();
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }

    // try to fetch contact info from website settings if available
    let contactEmail: string | undefined;
    let contactPhone: string | undefined;
    try {
      const [settingsRows] = await db.execute(
        'SELECT contact_email, contact_phone FROM front_cms_website_settings WHERE school_id = ? LIMIT 1',
        [schoolId]
      ) as any[];
      if (settingsRows && settingsRows.length > 0) {
        contactEmail = settingsRows[0].contact_email || undefined;
        contactPhone = settingsRows[0].contact_phone || undefined;
      }
    } catch {
      // ignore, table might not exist yet or query fails
    }

    // send onboarding email (non-blocking)
    try {
      const setupUrl = await createPasswordSetupLink(adminUserId);
      await sendSchoolOnboardingEmail({
        to: email.trim(),
        schoolName: schoolName.trim(),
        trialStartsAt,
        trialEndsAt,
        adminEmail: email.trim(),
        setupUrl,
        loginUrl: `${req.protocol}://${req.get('host')}/login`,
        contactEmail,
        contactPhone,
      });
    } catch (emailErr) {
      console.warn('Failed to send school onboarding email:', emailErr);
    }

    res.status(201).json({
      success: true,
      message: registrationPayment?.redirectUrl
        ? 'School registered successfully. Redirecting to payment gateway...'
        : 'School registered successfully. You can now sign in.',
      school: {
        id: schoolId,
        name: schoolName.trim(),
        slug,
        status: 'trial',
        trialEndsAt: trialEndsAt.toISOString(),
      },
      registrationPayment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PhonePe callback/redirect receiver for school registration payment.
 * This endpoint is intentionally tolerant because PhonePe callback payload
 * shape can vary between integration versions.
 */
export const handlePhonePeRegistrationCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDatabase();
    const encodedResponse =
      (typeof req.body?.response === 'string' && req.body.response) ||
      (typeof req.query?.response === 'string' && req.query.response) ||
      null;

    const decoded = encodedResponse ? decodePhonePeResponseToken(encodedResponse) : null;
    const payload = decoded || req.body || {};
    const transactionId =
      payload?.data?.merchantTransactionId ||
      payload?.merchantOrderId ||
      payload?.payload?.merchantOrderId ||
      payload?.merchantTransactionId ||
      payload?.transactionId ||
      null;
    const statusRaw =
      String(payload?.code || payload?.status || payload?.data?.state || '').toUpperCase();
    const mappedStatus: 'success' | 'failed' | 'pending' =
      statusRaw.includes('SUCCESS')
        ? 'success'
        : (statusRaw.includes('FAIL') || statusRaw.includes('ERROR') ? 'failed' : 'pending');

    if (transactionId) {
      await db.execute(
        `UPDATE registration_payments
         SET status = ?, phonepe_response = ?, updated_at = NOW()
         WHERE merchant_transaction_id = ?`,
        [mappedStatus, JSON.stringify(payload), transactionId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
