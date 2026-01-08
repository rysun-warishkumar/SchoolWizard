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

const router = express.Router();

// Middleware to check if CMS is enabled
const checkCMSEnabled = async (_req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const db = getDatabase();
    // Check front_cms_settings table for is_enabled
    const [settings] = await db.execute(
      'SELECT is_enabled FROM front_cms_settings ORDER BY id DESC LIMIT 1'
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
    // On error, allow access (fail open for public routes)
    console.error('Error checking CMS enabled status:', error);
    next();
  }
};

// Public routes - no authentication required
// All routes check if CMS is enabled

// CMS Settings (public)
router.get('/settings', checkCMSEnabled, getFrontCMSSettings);

// Menus (public)
router.get('/menus', checkCMSEnabled, getMenus);
router.get('/menus/:menuId/items', checkCMSEnabled, getMenuItems);

// Pages (public)
router.get('/pages', checkCMSEnabled, getPages);
router.get('/pages/:id', checkCMSEnabled, getPageById);

// Get page by slug (public)
router.get('/pages/slug/:slug', checkCMSEnabled, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const db = getDatabase();

    const [pages] = await db.execute(
      'SELECT * FROM front_cms_pages WHERE slug = ?',
      [slug]
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
router.get('/events', checkCMSEnabled, getEvents);
router.get('/events/:id', checkCMSEnabled, getEventById);

// Get event by slug (public)
router.get('/events/slug/:slug', checkCMSEnabled, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const db = getDatabase();

    const [events] = await db.execute(
      'SELECT * FROM front_cms_events WHERE slug = ?',
      [slug]
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
router.get('/galleries', checkCMSEnabled, getGalleries);
router.get('/galleries/:id', checkCMSEnabled, getGalleryById);

// Get gallery by slug (public)
router.get('/galleries/slug/:slug', checkCMSEnabled, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const db = getDatabase();

    const [galleries] = await db.execute(
      'SELECT * FROM front_cms_galleries WHERE slug = ?',
      [slug]
    ) as any[];

    if (galleries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found',
      });
    }

    // Get gallery images
    const [images] = await db.execute(
      'SELECT * FROM front_cms_gallery_images WHERE gallery_id = ? ORDER BY sort_order ASC',
      [galleries[0].id]
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
router.get('/news', checkCMSEnabled, getNews);
router.get('/news/:id', checkCMSEnabled, getNewsById);

// Get news by slug (public)
router.get('/news/slug/:slug', checkCMSEnabled, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const db = getDatabase();

    const [news] = await db.execute(
      'SELECT * FROM front_cms_news WHERE slug = ?',
      [slug]
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
router.get('/banner-images', checkCMSEnabled, getBannerImages);

export default router;

