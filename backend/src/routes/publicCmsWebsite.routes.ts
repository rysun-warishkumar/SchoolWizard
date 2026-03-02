import express from 'express';
import { getDatabase } from '../config/database';

const router = express.Router();

// Public routes - no authentication required

// Get login display info (school name for login page heading - no auth)
router.get('/login-display', async (_req, res, _next) => {
  try {
    const db = getDatabase();
    try {
      const [rows] = await db.execute(
        'SELECT setting_value FROM general_settings WHERE setting_key = ?',
        ['school_name']
      ) as any[];
      const value = Array.isArray(rows) && rows.length > 0 ? (rows[0]?.setting_value || '') : '';
      const schoolName = (value && String(value).trim()) ? String(value).trim() : 'Make My School';
      return res.json({ success: true, data: { schoolName } });
    } catch (dbError: any) {
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        return res.json({ success: true, data: { schoolName: 'Make My School' } });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error in /login-display:', error);
    return res.status(500).json({ success: false, message: error.message || 'An unexpected error occurred' });
  }
});

// Get Website Settings (Public) – optionally scoped by school_id (query) for multi-tenant
router.get('/website-settings', async (req, res, _next) => {
  try {
    const db = getDatabase();
    const schoolId = req.query.school_id != null ? Number(req.query.school_id) : null;

    try {
      let settings: any[];
      if (schoolId != null && !Number.isNaN(schoolId)) {
        const [rows] = await db.execute(
          'SELECT * FROM front_cms_website_settings WHERE school_id = ? LIMIT 1',
          [schoolId]
        ) as any[];
        settings = rows;
      } else {
        const [rows] = await db.execute(
          'SELECT * FROM front_cms_website_settings LIMIT 1'
        ) as any[];
        settings = rows;
      }

      if (!settings || (Array.isArray(settings) && settings.length === 0)) {
        return res.json({
          success: true,
          data: {
            website_logo: null,
            school_name: 'School Name',
            tag_line: 'A School with a Difference',
            tag_line_visible: true,
            contact_email: null,
            contact_phone: null,
            facebook_url: null,
            facebook_enabled: false,
            twitter_url: null,
            twitter_enabled: false,
            youtube_url: null,
            youtube_enabled: false,
            instagram_url: null,
            instagram_enabled: false,
            linkedin_url: null,
            linkedin_enabled: false,
            whatsapp_url: null,
            whatsapp_enabled: false,
          },
        });
      }

      const setting = Array.isArray(settings) ? settings[0] : settings;
      return res.json({ success: true, data: setting });
    } catch (dbError: any) {
      // If table doesn't exist, return default values
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        return res.json({
          success: true,
          data: {
            website_logo: null,
            school_name: 'School Name',
            tag_line: 'A School with a Difference',
            tag_line_visible: true,
            contact_email: null,
            contact_phone: null,
            facebook_url: null,
            facebook_enabled: false,
            twitter_url: null,
            twitter_enabled: false,
            youtube_url: null,
            youtube_enabled: false,
            instagram_url: null,
            instagram_enabled: false,
            linkedin_url: null,
            linkedin_enabled: false,
            whatsapp_url: null,
            whatsapp_enabled: false,
          },
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error in /website-settings:', error);
    return res.status(500).json({ success: false, message: error.message || 'An unexpected error occurred' });
  }
});

// Get Active Banners (Public) – optionally scoped by school_id (query) for multi-tenant
router.get('/banners', async (req, res, _next) => {
  try {
    const db = getDatabase();
    const schoolId = req.query.school_id != null ? Number(req.query.school_id) : null;

    try {
      let banners: any[];
      if (schoolId != null && !Number.isNaN(schoolId)) {
        const [rows] = await db.execute(
          'SELECT * FROM front_cms_banners WHERE school_id = ? AND is_active = TRUE ORDER BY sort_order ASC, created_at ASC',
          [schoolId]
        ) as any[];
        banners = rows;
      } else {
        const [rows] = await db.execute(
          'SELECT * FROM front_cms_banners WHERE is_active = TRUE ORDER BY sort_order ASC, created_at ASC'
        ) as any[];
        banners = rows;
      }

      res.json({
        success: true,
        data: Array.isArray(banners) ? banners : [],
      });
    } catch (dbError: any) {
      // If table doesn't exist, return empty array
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        return res.json({
          success: true,
          data: [],
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error in /banners:', error);
    res.status(500).json({ success: false, message: error.message || 'An unexpected error occurred' });
  }
});

export default router;

