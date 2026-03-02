import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { env } from '../config/env';

/**
 * Send enquiry to webhook URL (e.g. WordPress) - fire-and-forget, doesn't block response
 */
async function sendToWebhook(payload: Record<string, unknown>): Promise<void> {
  const url = env.inquiryWebhookUrl?.trim();
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn(`[Inquiries] Webhook responded with ${res.status}: ${url}`);
    }
  } catch (err) {
    console.warn('[Inquiries] Webhook failed:', (err as Error).message);
  }
}

/**
 * Create a marketing inquiry (Contact or Get Started form)
 * Public route - no auth required. Requires school_id or school_slug in body for multi-tenant.
 * Forwards to INQUIRY_WEBHOOK_URL (e.g. WordPress) if configured
 */
export const createInquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { name, email, subject, message, company, enquiry_type, school_id: bodySchoolId, school_slug } = req.body;

    if (!name || !email) {
      return next(createError('Name and email are required', 400));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(createError('Invalid email format', 400));
    }

    let schoolId: number | null = null;
    if (bodySchoolId != null && bodySchoolId !== '') {
      schoolId = Number(bodySchoolId);
      if (Number.isNaN(schoolId)) schoolId = null;
    }
    if (schoolId == null && school_slug) {
      const [rows] = await db.execute('SELECT id FROM schools WHERE slug = ? LIMIT 1', [String(school_slug).trim()]) as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        schoolId = Number(rows[0].id);
      }
    }
    if (schoolId == null) {
      return next(createError('School is required (provide school_id or school_slug)', 400));
    }

    const type = ['contact', 'get_started'].includes(enquiry_type) ? enquiry_type : 'contact';

    const [result] = await db.execute(
      `INSERT INTO marketing_inquiries (school_id, name, email, subject, message, company, enquiry_type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [schoolId, name, email, subject || null, message || null, company || null, type]
    );

    const insertResult = result as { insertId: number };
    const [newInquiry] = await db.execute(
      'SELECT * FROM marketing_inquiries WHERE id = ? AND school_id = ?',
      [String(insertResult.insertId), schoolId]
    );

    const inquiryData = Array.isArray(newInquiry) ? newInquiry[0] : newInquiry;

    // Fire-and-forget: send to WordPress webhook if configured
    sendToWebhook({
      source: 'make_my_school_marketing',
      action: 'new_inquiry',
      inquiry: inquiryData,
      received_at: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out. We will get back to you soon.',
      data: inquiryData,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    next(createError(err?.message || 'Failed to create inquiry', 500));
  }
};
