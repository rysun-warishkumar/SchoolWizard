import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest, getSchoolId } from '../middleware/auth';
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
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const websiteMeta = await getWebsiteAccessMeta(db, schoolId);
    const [settings] = await db.execute(
      'SELECT * FROM front_cms_website_settings WHERE school_id = ? LIMIT 1',
      [schoolId]
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
          subdomain: websiteMeta.subdomain,
          website_url: websiteMeta.website_url,
          is_website_ready: websiteMeta.is_website_ready,
        },
      });
    }

    const setting = Array.isArray(settings) ? settings[0] : settings;
    res.json({
      success: true,
      data: {
        ...setting,
        subdomain: websiteMeta.subdomain,
        website_url: websiteMeta.website_url,
        is_website_ready: websiteMeta.is_website_ready,
      },
    });
  } catch (error: any) {
    next(createError(error.message, 500));
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

const normalizeSchoolName = (value: string): string => value.trim().replace(/\s+/g, ' ');

const getSchoolNameKey = (value: string): string => normalizeSchoolName(value).toLowerCase().replace(/\s+/g, '');

const buildSubdomainLabel = (schoolName: string): string =>
  normalizeSchoolName(schoolName)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '');

const getBaseWebsiteDomain = (): string =>
  String(process.env.PUBLIC_PORTAL_BASE_DOMAIN || process.env.FRONTCMS_BASE_DOMAIN || 'makemyschool.com')
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, '');

const buildWebsiteUrl = (subdomain: string): string => `https://${subdomain}.${getBaseWebsiteDomain()}`;

const getWebsiteAccessMeta = async (
  db: any,
  schoolId: number
): Promise<{ subdomain: string | null; website_url: string | null; is_website_ready: boolean }> => {
  let domainRows: any[] = [];
  try {
    const [rows] = await db.execute(
      `SELECT td.domain
       FROM tenant_domains td
       INNER JOIN tenants t ON t.id = td.tenant_id
       WHERE t.school_id = ?
         AND td.is_active = 1
         AND td.is_primary = 1
         AND td.verification_status = 'verified'
       ORDER BY td.id DESC
       LIMIT 1`,
      [schoolId]
    ) as any[];
    domainRows = rows || [];
  } catch (error: any) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return {
        subdomain: null,
        website_url: null,
        is_website_ready: false,
      };
    }
    throw error;
  }

  if (!Array.isArray(domainRows) || domainRows.length === 0) {
    return {
      subdomain: null,
      website_url: null,
      is_website_ready: false,
    };
  }

  const domain = String(domainRows[0]?.domain || '').trim().toLowerCase();
  const baseDomain = getBaseWebsiteDomain();
  const subdomain = domain.endsWith(`.${baseDomain}`) ? domain.slice(0, -(baseDomain.length + 1)) : null;

  return {
    subdomain,
    website_url: `https://${domain}`,
    is_website_ready: Boolean(subdomain),
  };
};

// Update Website Settings
export const updateWebsiteSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const connection = await db.getConnection();
    
    // Parse FormData values - booleans come as strings from FormData
    const rawSchoolName = req.body.school_name;
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

    if (!rawSchoolName || typeof rawSchoolName !== 'string') {
      throw createError('School name is required', 400);
    }
    const school_name = normalizeSchoolName(rawSchoolName);
    if (school_name.length < 3 || school_name.length > 60) {
      throw createError('School name must be between 3 and 60 characters', 400);
    }
    if (!/^[A-Za-z0-9 ]+$/.test(school_name)) {
      throw createError('School name can contain only letters, numbers and spaces', 400);
    }

    const schoolNameKey = getSchoolNameKey(school_name);

    try {
      await connection.beginTransaction();

      const [duplicateSchoolRows] = await connection.execute(
        `SELECT id
         FROM schools
         WHERE id <> ?
           AND LOWER(REPLACE(TRIM(name), ' ', '')) = ?
         LIMIT 1`,
        [schoolId, schoolNameKey]
      ) as any[];
      if (Array.isArray(duplicateSchoolRows) && duplicateSchoolRows.length > 0) {
        throw createError('School name already exists. Please choose a unique school name.', 409);
      }

      const baseDomain = getBaseWebsiteDomain();
      const [existingDomainRows] = await connection.execute(
        `SELECT td.domain
         FROM tenant_domains td
         INNER JOIN tenants t ON t.id = td.tenant_id
         WHERE t.school_id = ?
           AND td.domain_type = 'subdomain'
           AND td.is_active = 1
           AND td.is_primary = 1
         ORDER BY td.id DESC
         LIMIT 1`,
        [schoolId]
      ) as any[];
      const lockedDomain = Array.isArray(existingDomainRows) && existingDomainRows.length > 0
        ? String(existingDomainRows[0]?.domain || '').trim().toLowerCase()
        : '';
      const hasLockedDomain = Boolean(lockedDomain);
      let subdomain = hasLockedDomain && lockedDomain.endsWith(`.${baseDomain}`)
        ? lockedDomain.slice(0, -(baseDomain.length + 1))
        : null;
      let fullDomain = hasLockedDomain ? lockedDomain : '';

      if (!hasLockedDomain) {
        const generatedSubdomain = buildSubdomainLabel(school_name);
        if (generatedSubdomain.length < 3 || generatedSubdomain.length > 40) {
          throw createError('Generated subdomain must be between 3 and 40 characters', 400);
        }
        const generatedFullDomain = `${generatedSubdomain}.${baseDomain}`;

        const [duplicateDomainRows] = await connection.execute(
          `SELECT td.id
           FROM tenant_domains td
           INNER JOIN tenants t ON t.id = td.tenant_id
           WHERE td.domain = ?
             AND t.school_id <> ?
           LIMIT 1`,
          [generatedFullDomain, schoolId]
        ) as any[];
        if (Array.isArray(duplicateDomainRows) && duplicateDomainRows.length > 0) {
          throw createError('Subdomain already in use. Please choose a different school name.', 409);
        }

        subdomain = generatedSubdomain;
        fullDomain = generatedFullDomain;
      }

      const [existing] = await connection.execute(
        'SELECT id FROM front_cms_website_settings WHERE school_id = ? LIMIT 1',
        [schoolId]
      ) as any[];
      const exists = Array.isArray(existing) && existing.length > 0;
      const existingId = exists ? (existing[0] as any)?.id : null;

      if (exists && existingId) {
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
          values.push(String(existingId), schoolId);
          await connection.execute(
            `UPDATE front_cms_website_settings SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND school_id = ?`,
            values
          );
        }
      } else {
        await connection.execute(
          `INSERT INTO front_cms_website_settings (
            school_id, school_name, tag_line, tag_line_visible, contact_email, contact_phone,
            website_logo, facebook_url, facebook_enabled, twitter_url, twitter_enabled,
            youtube_url, youtube_enabled, instagram_url, instagram_enabled,
            linkedin_url, linkedin_enabled, whatsapp_url, whatsapp_enabled
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            schoolId,
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

      if (hasLockedDomain) {
        await connection.execute(
          'UPDATE schools SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [school_name, schoolId]
        );
      } else {
        await connection.execute(
          'UPDATE schools SET name = ?, slug = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [school_name, subdomain, schoolId]
        );
      }

      let tenantId: number | null = null;
      const [tenantRows] = await connection.execute(
        'SELECT id FROM tenants WHERE school_id = ? LIMIT 1',
        [schoolId]
      ) as any[];
      if (Array.isArray(tenantRows) && tenantRows.length > 0) {
        tenantId = Number(tenantRows[0].id || 0) || null;
      }

      if (!tenantId) {
        const [tenantInsert] = await connection.execute(
          `INSERT INTO tenants (tenant_key, school_id, lifecycle_status, runtime_mode, is_readonly_freeze, created_at, updated_at)
           VALUES (?, ?, 'active_shared', 'shared', 0, NOW(), NOW())`,
          [`tenant_${schoolId}`, schoolId]
        ) as any;
        tenantId = Number(tenantInsert?.insertId || 0) || null;
      }

      if (!tenantId) {
        throw createError('Unable to map school tenant for website domain', 500);
      }

      if (!hasLockedDomain) {
        await connection.execute(
          `UPDATE tenant_domains
           SET is_primary = 0, is_active = 0, updated_at = NOW()
           WHERE tenant_id = ? AND domain_type = 'subdomain'`,
          [tenantId]
        );

        await connection.execute(
          `INSERT INTO tenant_domains (
             tenant_id, domain, domain_type, verification_status, dns_target, ssl_status,
             is_primary, is_active, verified_at, created_at, updated_at
           ) VALUES (?, ?, 'subdomain', 'verified', NULL, 'pending', 1, 1, NOW(), NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             tenant_id = VALUES(tenant_id),
             domain_type = 'subdomain',
             verification_status = 'verified',
             ssl_status = 'pending',
             is_primary = 1,
             is_active = 1,
             verified_at = NOW(),
             updated_at = NOW()`,
          [tenantId, fullDomain]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const [updated] = await db.execute('SELECT * FROM front_cms_website_settings WHERE school_id = ? LIMIT 1', [schoolId]) as any[];
    const setting = Array.isArray(updated) ? updated[0] : updated;
    const websiteMeta = await getWebsiteAccessMeta(db, schoolId);

    res.json({
      success: true,
      message: websiteMeta.website_url ? 'Website settings updated successfully' : 'Website settings and subdomain updated successfully',
      data: {
        ...setting,
        subdomain: websiteMeta.subdomain,
        website_url: websiteMeta.website_url || (setting?.slug ? buildWebsiteUrl(String(setting.slug)) : null),
        is_website_ready: websiteMeta.is_website_ready,
      },
    });
  } catch (error: any) {
    console.error('Error updating website settings:', error);
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      next(createError('Control-plane tables are not ready. Please run migrations for tenants and tenant_domains.', 503));
      return;
    }
    next(error);
  }
};

// Get All Banners
export const getBanners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const [banners] = await db.execute(
      'SELECT * FROM front_cms_banners WHERE school_id = ? ORDER BY sort_order ASC, created_at ASC',
      [schoolId]
    );

    res.json({
      success: true,
      data: Array.isArray(banners) ? banners : [],
    });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

// Get Single Banner
export const getBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const { id } = req.params;

    const [banners] = await db.execute('SELECT * FROM front_cms_banners WHERE school_id = ? AND id = ?', [schoolId, String(id)]);

    if (!Array.isArray(banners) || banners.length === 0) {
      return next(createError('Banner not found', 404));
    }

    res.json({ success: true, data: banners[0] });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

// Create Banner
export const createBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    
    const title = req.body.title;
    const description = req.body.description !== undefined && req.body.description !== '' ? req.body.description : null;
    const button_text = req.body.button_text !== undefined && req.body.button_text !== '' ? req.body.button_text : null;
    const button_url = req.body.button_url !== undefined && req.body.button_url !== '' ? req.body.button_url : null;
    const sort_order = req.body.sort_order !== undefined ? parseInt(req.body.sort_order) || 0 : 0;
    const is_active = req.body.is_active !== undefined ? parseBoolean(req.body.is_active) : true;

    if (!title || !req.file) {
      return next(createError('Title and image are required', 400));
    }

    const image_path = `/uploads/front-cms/banners/${req.file.filename}`;

    const [result] = await db.execute(
      `INSERT INTO front_cms_banners (school_id, title, description, image_path, button_text, button_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
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
    const [banners] = await db.execute('SELECT * FROM front_cms_banners WHERE school_id = ? AND id = ?', [
      schoolId,
      String(insertResult.insertId),
    ]);

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: Array.isArray(banners) ? banners[0] : banners,
    });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

// Update Banner
export const updateBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const { id } = req.params;
    
    const title = req.body.title;
    const description = req.body.description !== undefined && req.body.description !== '' ? req.body.description : null;
    const button_text = req.body.button_text !== undefined && req.body.button_text !== '' ? req.body.button_text : null;
    const button_url = req.body.button_url !== undefined && req.body.button_url !== '' ? req.body.button_url : null;
    const sort_order = req.body.sort_order !== undefined ? parseInt(req.body.sort_order) : undefined;
    const is_active = req.body.is_active !== undefined ? parseBoolean(req.body.is_active) : undefined;

    const [existing] = await db.execute('SELECT * FROM front_cms_banners WHERE school_id = ? AND id = ?', [schoolId, String(id)]);
    if (!Array.isArray(existing) || existing.length === 0) {
      return next(createError('Banner not found', 404));
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
       WHERE id = ? AND school_id = ?`,
      [
        title !== undefined ? title : existingBanner.title,
        description !== undefined ? description : existingBanner.description,
        image_path,
        button_text !== undefined ? button_text : existingBanner.button_text,
        button_url !== undefined ? button_url : existingBanner.button_url,
        sort_order !== undefined ? sort_order : existingBanner.sort_order,
        is_active !== undefined ? is_active : existingBanner.is_active,
        String(id),
        schoolId,
      ]
    );

    const [updated] = await db.execute('SELECT * FROM front_cms_banners WHERE school_id = ? AND id = ?', [schoolId, String(id)]);

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: Array.isArray(updated) ? updated[0] : updated,
    });
  } catch (error: any) {
    console.error('Error updating banner:', error);
    next(createError(error.message, 500));
  }
};

// Delete Banner
export const deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const { id } = req.params;

    const [banners] = await db.execute('SELECT image_path FROM front_cms_banners WHERE school_id = ? AND id = ?', [
      schoolId,
      String(id),
    ]);

    if (!Array.isArray(banners) || banners.length === 0) {
      return next(createError('Banner not found', 404));
    }

    const banner = banners[0] as any;

    await db.execute('DELETE FROM front_cms_banners WHERE id = ? AND school_id = ?', [String(id), schoolId]);

    // Delete image file
    if (banner.image_path) {
      const imagePath = path.join(__dirname, '../../', banner.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

// Export multer middleware
export const uploadWebsiteLogo = websiteUpload.single('website_logo');
export const uploadBannerImage = bannerUpload.single('banner_image');

