import express from 'express';
import {
  getPages,
  getPageById,
  getEvents,
  getEventById,
  getGalleries,
  getGalleryById,
  getNews,
  getNewsById,
  getBannerImages,
  getMenus,
  getMenuItems,
} from '../controllers/frontCms.controller';
import { getFrontCMSSettings } from '../controllers/settings.controller';
import { getDatabase } from '../config/database';
import { resolvePublicSchoolContext } from '../middleware/publicSchoolContext';

const router = express.Router();

// Middleware to check if CMS is enabled
const checkCMSEnabled = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const schoolId = Number(req.query.school_id ?? (req as any).user?.schoolId);
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: 'Valid school_id is required for public school content',
      });
    }

    const db = getDatabase();
    // Check front_cms_settings table for is_enabled in the requested school
    const [settings] = await db.execute(
      'SELECT is_enabled FROM front_cms_settings WHERE school_id = ? ORDER BY id DESC LIMIT 1',
      [schoolId]
    ) as any[];

    // If no settings exist, allow access (default to enabled)
    const isEnabled = settings.length === 0 || settings[0].is_enabled === 1;
    
    if (!isEnabled) {
      return res.status(404).json({
        success: false,
        message: 'CMS is not enabled',
      });
    }
    
    next();
  } catch (error) {
    // Fail closed for public CMS if validation/check fails.
    console.error('Error checking CMS enabled status:', error);
    return res.status(503).json({
      success: false,
      message: 'Public CMS is temporarily unavailable',
    });
  }
};

// Public routes - no authentication required
// All routes check if CMS is enabled

// CMS Settings (public)
router.get('/settings', resolvePublicSchoolContext, checkCMSEnabled, getFrontCMSSettings);

// Menus (public)
router.get('/menus', resolvePublicSchoolContext, checkCMSEnabled, getMenus);
router.get('/menus/:menuId/items', resolvePublicSchoolContext, checkCMSEnabled, getMenuItems);

// Pages (public)
router.get('/pages', resolvePublicSchoolContext, checkCMSEnabled, getPages);
router.get('/pages/:id', resolvePublicSchoolContext, checkCMSEnabled, getPageById);

// Get page by slug (public)
router.get('/pages/slug/:slug', resolvePublicSchoolContext, checkCMSEnabled, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const schoolId = Number(req.query.school_id ?? (req as any).user?.schoolId);
    const db = getDatabase();

    const [pages] = await db.execute(
      'SELECT * FROM front_cms_pages WHERE school_id = ? AND slug = ?',
      [schoolId, slug]
    ) as any[];

    if (pages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    return res.json({
      success: true,
      data: pages[0],
    });
  } catch (error) {
    return next(error);
  }
});

// Events (public)
router.get('/events', resolvePublicSchoolContext, checkCMSEnabled, getEvents);
router.get('/events/:id', resolvePublicSchoolContext, checkCMSEnabled, getEventById);

// Get event by slug (public)
router.get('/events/slug/:slug', resolvePublicSchoolContext, checkCMSEnabled, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const schoolId = Number(req.query.school_id ?? (req as any).user?.schoolId);
    const db = getDatabase();

    const [events] = await db.execute(
      'SELECT * FROM front_cms_events WHERE school_id = ? AND slug = ?',
      [schoolId, slug]
    ) as any[];

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    return res.json({
      success: true,
      data: events[0],
    });
  } catch (error) {
    return next(error);
  }
});

// Galleries (public)
router.get('/galleries', resolvePublicSchoolContext, checkCMSEnabled, getGalleries);
router.get('/galleries/:id', resolvePublicSchoolContext, checkCMSEnabled, getGalleryById);

// Get gallery by slug (public)
router.get('/galleries/slug/:slug', resolvePublicSchoolContext, checkCMSEnabled, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const schoolId = Number(req.query.school_id ?? (req as any).user?.schoolId);
    const db = getDatabase();

    const [galleries] = await db.execute(
      'SELECT * FROM front_cms_galleries WHERE school_id = ? AND slug = ?',
      [schoolId, slug]
    ) as any[];

    if (galleries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found',
      });
    }

    // Get gallery images
    const [images] = await db.execute(
      'SELECT * FROM front_cms_gallery_images WHERE school_id = ? AND gallery_id = ? ORDER BY sort_order ASC',
      [schoolId, galleries[0].id]
    ) as any[];

    galleries[0].images = images;

    return res.json({
      success: true,
      data: galleries[0],
    });
  } catch (error) {
    return next(error);
  }
});

// News (public)
router.get('/news', resolvePublicSchoolContext, checkCMSEnabled, getNews);
router.get('/news/:id', resolvePublicSchoolContext, checkCMSEnabled, getNewsById);

// Get news by slug (public)
router.get('/news/slug/:slug', resolvePublicSchoolContext, checkCMSEnabled, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const schoolId = Number(req.query.school_id ?? (req as any).user?.schoolId);
    const db = getDatabase();

    const [news] = await db.execute(
      'SELECT * FROM front_cms_news WHERE school_id = ? AND slug = ?',
      [schoolId, slug]
    ) as any[];

    if (news.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'News not found',
      });
    }

    return res.json({
      success: true,
      data: news[0],
    });
  } catch (error) {
    return next(error);
  }
});

// Banner Images (public)
router.get('/banner-images', resolvePublicSchoolContext, checkCMSEnabled, getBannerImages);

export default router;

