import express from 'express';
import { getDatabase } from '../config/database';

const router = express.Router();

// Public routes - no authentication required
// Get Website Settings (Public)
router.get('/website-settings', async (_req, res, _next) => {
  try {
    const db = getDatabase();
    const [settings] = await db.execute(
      'SELECT * FROM front_cms_website_settings LIMIT 1'
    );

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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get Active Banners (Public)
router.get('/banners', async (_req, res, _next) => {
  try {
    const db = getDatabase();
    const [banners] = await db.execute(
      'SELECT * FROM front_cms_banners WHERE is_active = TRUE ORDER BY sort_order ASC, created_at ASC'
    );

    res.json({
      success: true,
      data: Array.isArray(banners) ? banners : [],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

