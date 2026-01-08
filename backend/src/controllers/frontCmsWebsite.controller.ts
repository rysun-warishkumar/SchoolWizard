import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for website logo uploads
const websiteStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/front-cms/website');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const websiteUpload = multer({
  storage: websiteStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// Configure multer for banner images
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/front-cms/banners');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `banner-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  },
});

const bannerUpload = multer({
  storage: bannerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// Get Website Settings
export const getWebsiteSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await getDatabase();
    const [settings] = await db.execute(
      'SELECT * FROM front_cms_website_settings LIMIT 1'
    );

    if (!settings || (Array.isArray(settings) && settings.length === 0)) {
      // Return default settings if none exist
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
    res.json({ success: true, data: setting });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

// Helper function to convert string boolean to boolean
const parseBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value === 'true' || value === '1' || value === 'on';
  }
  return false;
};

// Update Website Settings
export const updateWebsiteSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    
    // Parse FormData values - booleans come as strings from FormData
    const school_name = req.body.school_name;
    const tag_line = req.body.tag_line !== undefined && req.body.tag_line !== '' ? req.body.tag_line : null;
    const tag_line_visible = req.body.tag_line_visible !== undefined ? parseBoolean(req.body.tag_line_visible) : undefined;
    const contact_email = req.body.contact_email !== undefined && req.body.contact_email !== '' ? req.body.contact_email : null;
    const contact_phone = req.body.contact_phone !== undefined && req.body.contact_phone !== '' ? req.body.contact_phone : null;
    
    // Social media URLs
    const facebook_url = req.body.facebook_url !== undefined && req.body.facebook_url !== '' ? req.body.facebook_url : null;
    const facebook_enabled = req.body.facebook_enabled !== undefined ? parseBoolean(req.body.facebook_enabled) : undefined;
    const twitter_url = req.body.twitter_url !== undefined && req.body.twitter_url !== '' ? req.body.twitter_url : null;
    const twitter_enabled = req.body.twitter_enabled !== undefined ? parseBoolean(req.body.twitter_enabled) : undefined;
    const youtube_url = req.body.youtube_url !== undefined && req.body.youtube_url !== '' ? req.body.youtube_url : null;
    const youtube_enabled = req.body.youtube_enabled !== undefined ? parseBoolean(req.body.youtube_enabled) : undefined;
    const instagram_url = req.body.instagram_url !== undefined && req.body.instagram_url !== '' ? req.body.instagram_url : null;
    const instagram_enabled = req.body.instagram_enabled !== undefined ? parseBoolean(req.body.instagram_enabled) : undefined;
    const linkedin_url = req.body.linkedin_url !== undefined && req.body.linkedin_url !== '' ? req.body.linkedin_url : null;
    const linkedin_enabled = req.body.linkedin_enabled !== undefined ? parseBoolean(req.body.linkedin_enabled) : undefined;
    const whatsapp_url = req.body.whatsapp_url !== undefined && req.body.whatsapp_url !== '' ? req.body.whatsapp_url : null;
    const whatsapp_enabled = req.body.whatsapp_enabled !== undefined ? parseBoolean(req.body.whatsapp_enabled) : undefined;

    // Handle logo upload
    let website_logo = null;
    if (req.file) {
      website_logo = `/uploads/front-cms/website/${req.file.filename}`;
    } else if (req.body.website_logo && req.body.website_logo !== 'null' && req.body.website_logo !== '') {
      website_logo = req.body.website_logo;
    }

    // Check if settings exist
    const [existing] = await db.execute('SELECT id FROM front_cms_website_settings LIMIT 1');
    const exists = Array.isArray(existing) && existing.length > 0;
    const existingId = exists ? (Array.isArray(existing) ? existing[0].id : (existing as any).id) : null;

    if (exists && existingId) {
      // Update existing settings - build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];

      if (school_name !== undefined) {
        updateFields.push('school_name = ?');
        values.push(school_name);
      }
      if (tag_line !== undefined) {
        updateFields.push('tag_line = ?');
        values.push(tag_line);
      }
      if (tag_line_visible !== undefined) {
        updateFields.push('tag_line_visible = ?');
        values.push(tag_line_visible);
      }
      if (contact_email !== undefined) {
        updateFields.push('contact_email = ?');
        values.push(contact_email);
      }
      if (contact_phone !== undefined) {
        updateFields.push('contact_phone = ?');
        values.push(contact_phone);
      }
      if (website_logo !== undefined && website_logo !== null) {
        updateFields.push('website_logo = ?');
        values.push(website_logo);
      }
      if (facebook_url !== undefined) {
        updateFields.push('facebook_url = ?');
        values.push(facebook_url);
      }
      if (facebook_enabled !== undefined) {
        updateFields.push('facebook_enabled = ?');
        values.push(facebook_enabled);
      }
      if (twitter_url !== undefined) {
        updateFields.push('twitter_url = ?');
        values.push(twitter_url);
      }
      if (twitter_enabled !== undefined) {
        updateFields.push('twitter_enabled = ?');
        values.push(twitter_enabled);
      }
      if (youtube_url !== undefined) {
        updateFields.push('youtube_url = ?');
        values.push(youtube_url);
      }
      if (youtube_enabled !== undefined) {
        updateFields.push('youtube_enabled = ?');
        values.push(youtube_enabled);
      }
      if (instagram_url !== undefined) {
        updateFields.push('instagram_url = ?');
        values.push(instagram_url);
      }
      if (instagram_enabled !== undefined) {
        updateFields.push('instagram_enabled = ?');
        values.push(instagram_enabled);
      }
      if (linkedin_url !== undefined) {
        updateFields.push('linkedin_url = ?');
        values.push(linkedin_url);
      }
      if (linkedin_enabled !== undefined) {
        updateFields.push('linkedin_enabled = ?');
        values.push(linkedin_enabled);
      }
      if (whatsapp_url !== undefined) {
        updateFields.push('whatsapp_url = ?');
        values.push(whatsapp_url);
      }
      if (whatsapp_enabled !== undefined) {
        updateFields.push('whatsapp_enabled = ?');
        values.push(whatsapp_enabled);
      }

      if (updateFields.length > 0) {
        values.push(existingId);
        await db.execute(
          `UPDATE front_cms_website_settings SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          values
        );
      }
    } else {
      // Insert new settings
      await db.execute(
        `INSERT INTO front_cms_website_settings (
          school_name, tag_line, tag_line_visible, contact_email, contact_phone,
          website_logo, facebook_url, facebook_enabled, twitter_url, twitter_enabled,
          youtube_url, youtube_enabled, instagram_url, instagram_enabled,
          linkedin_url, linkedin_enabled, whatsapp_url, whatsapp_enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          school_name || 'School Name',
          tag_line || null,
          tag_line_visible !== undefined ? tag_line_visible : true,
          contact_email || null,
          contact_phone || null,
          website_logo || null,
          facebook_url || null,
          facebook_enabled !== undefined ? facebook_enabled : false,
          twitter_url || null,
          twitter_enabled !== undefined ? twitter_enabled : false,
          youtube_url || null,
          youtube_enabled !== undefined ? youtube_enabled : false,
          instagram_url || null,
          instagram_enabled !== undefined ? instagram_enabled : false,
          linkedin_url || null,
          linkedin_enabled !== undefined ? linkedin_enabled : false,
          whatsapp_url || null,
          whatsapp_enabled !== undefined ? whatsapp_enabled : false,
        ]
      );
    }

    // Get updated settings
    const [updated] = await db.execute('SELECT * FROM front_cms_website_settings LIMIT 1');
    const setting = Array.isArray(updated) ? updated[0] : updated;

    res.json({
      success: true,
      message: 'Website settings updated successfully',
      data: setting,
    });
  } catch (error: any) {
    console.error('Error updating website settings:', error);
    next(createError(500, error.message));
  }
};

// Get All Banners
export const getBanners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const [banners] = await db.execute(
      'SELECT * FROM front_cms_banners ORDER BY sort_order ASC, created_at ASC'
    );

    res.json({
      success: true,
      data: Array.isArray(banners) ? banners : [],
    });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

// Get Single Banner
export const getBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const [banners] = await db.execute('SELECT * FROM front_cms_banners WHERE id = ?', [id]);

    if (!Array.isArray(banners) || banners.length === 0) {
      return next(createError(404, 'Banner not found'));
    }

    res.json({ success: true, data: banners[0] });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

// Create Banner
export const createBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    
    // Parse FormData values
    const title = req.body.title;
    const description = req.body.description !== undefined && req.body.description !== '' ? req.body.description : null;
    const button_text = req.body.button_text !== undefined && req.body.button_text !== '' ? req.body.button_text : null;
    const button_url = req.body.button_url !== undefined && req.body.button_url !== '' ? req.body.button_url : null;
    const sort_order = req.body.sort_order !== undefined ? parseInt(req.body.sort_order) || 0 : 0;
    const is_active = req.body.is_active !== undefined ? parseBoolean(req.body.is_active) : true;

    if (!title || !req.file) {
      return next(createError(400, 'Title and image are required'));
    }

    const image_path = `/uploads/front-cms/banners/${req.file.filename}`;

    const [result] = await db.execute(
      `INSERT INTO front_cms_banners (title, description, image_path, button_text, button_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        image_path,
        button_text,
        button_url,
        sort_order,
        is_active,
      ]
    );

    const insertResult = result as any;
    const [banners] = await db.execute('SELECT * FROM front_cms_banners WHERE id = ?', [
      insertResult.insertId,
    ]);

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: Array.isArray(banners) ? banners[0] : banners,
    });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

// Update Banner
export const updateBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // Parse FormData values
    const title = req.body.title;
    const description = req.body.description !== undefined && req.body.description !== '' ? req.body.description : null;
    const button_text = req.body.button_text !== undefined && req.body.button_text !== '' ? req.body.button_text : null;
    const button_url = req.body.button_url !== undefined && req.body.button_url !== '' ? req.body.button_url : null;
    const sort_order = req.body.sort_order !== undefined ? parseInt(req.body.sort_order) : undefined;
    const is_active = req.body.is_active !== undefined ? parseBoolean(req.body.is_active) : undefined;

    // Check if banner exists
    const [existing] = await db.execute('SELECT * FROM front_cms_banners WHERE id = ?', [id]);
    if (!Array.isArray(existing) || existing.length === 0) {
      return next(createError(404, 'Banner not found'));
    }

    const existingBanner = existing[0] as any;

    // Handle image upload
    let image_path = existingBanner.image_path;
    if (req.file) {
      // Delete old image if exists
      if (existingBanner.image_path) {
        const oldImagePath = path.join(__dirname, '../../', existingBanner.image_path);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image_path = `/uploads/front-cms/banners/${req.file.filename}`;
    }

    await db.execute(
      `UPDATE front_cms_banners 
       SET title = ?, description = ?, image_path = ?, button_text = ?, button_url = ?, 
           sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title !== undefined ? title : existingBanner.title,
        description !== undefined ? description : existingBanner.description,
        image_path,
        button_text !== undefined ? button_text : existingBanner.button_text,
        button_url !== undefined ? button_url : existingBanner.button_url,
        sort_order !== undefined ? sort_order : existingBanner.sort_order,
        is_active !== undefined ? is_active : existingBanner.is_active,
        id,
      ]
    );

    const [updated] = await db.execute('SELECT * FROM front_cms_banners WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: Array.isArray(updated) ? updated[0] : updated,
    });
  } catch (error: any) {
    console.error('Error updating banner:', error);
    next(createError(500, error.message));
  }
};

// Delete Banner
export const deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    // Get banner to delete image
    const [banners] = await db.execute('SELECT image_path FROM front_cms_banners WHERE id = ?', [
      id,
    ]);

    if (!Array.isArray(banners) || banners.length === 0) {
      return next(createError(404, 'Banner not found'));
    }

    const banner = banners[0] as any;

    // Delete banner from database
    await db.execute('DELETE FROM front_cms_banners WHERE id = ?', [id]);

    // Delete image file
    if (banner.image_path) {
      const imagePath = path.join(__dirname, '../../', banner.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error: any) {
    next(createError(500, error.message));
  }
};

// Export multer middleware
export const uploadWebsiteLogo = websiteUpload.single('website_logo');
export const uploadBannerImage = bannerUpload.single('banner_image');

