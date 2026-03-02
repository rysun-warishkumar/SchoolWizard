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

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/front-cms');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// ========== Menus ==========

export const getMenus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const [menus] = await db.execute(
      'SELECT * FROM front_cms_menus WHERE school_id = ? ORDER BY created_at DESC',
      [schoolId]
    ) as any[];

    res.json({
      success: true,
      data: menus,
    });
  } catch (error) {
    next(error);
  }
};

export const createMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { name, description } = req.body;
    const db = getDatabase();

    if (!name) {
      throw createError('Menu name is required', 400);
    }

    const [result] = await db.execute(
      'INSERT INTO front_cms_menus (school_id, name, description) VALUES (?, ?, ?)',
      [schoolId, name.trim(), description?.trim() || null]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Menu created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const { name, description } = req.body;
    const db = getDatabase();

    if (!name) {
      throw createError('Menu name is required', 400);
    }

    await db.execute(
      'UPDATE front_cms_menus SET name = ?, description = ? WHERE id = ? AND school_id = ?',
      [name.trim(), description?.trim() || null, id, schoolId]
    );

    res.json({
      success: true,
      message: 'Menu updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM front_cms_menus WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Menu deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Menu Items ==========

export const getMenuItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { menuId } = req.params;
    const db = getDatabase();

    const [items] = await db.execute(
      `SELECT mi.*, p.page_title as page_title, p.slug as slug
       FROM front_cms_menu_items mi
       LEFT JOIN front_cms_pages p ON mi.page_id = p.id AND p.school_id = ?
       WHERE mi.school_id = ? AND mi.menu_id = ?
       ORDER BY mi.sort_order ASC, mi.created_at ASC`,
      [schoolId, schoolId, menuId]
    ) as any[];

    // Build hierarchical structure
    const itemsMap = new Map();
    const rootItems: any[] = [];

    items.forEach((item: any) => {
      itemsMap.set(item.id, { ...item, children: [] });
    });

    items.forEach((item: any) => {
      const itemWithChildren = itemsMap.get(item.id);
      if (item.parent_id) {
        const parent = itemsMap.get(item.parent_id);
        if (parent) {
          parent.children.push(itemWithChildren);
        }
      } else {
        rootItems.push(itemWithChildren);
      }
    });

    res.json({
      success: true,
      data: rootItems,
    });
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { menuId } = req.params;
    const { menu_item, external_url, open_in_new_tab, page_id, parent_id, sort_order } = req.body;
    const db = getDatabase();

    if (!menu_item) {
      throw createError('Menu item name is required', 400);
    }

    if (!external_url && !page_id) {
      throw createError('Either external URL or page must be provided', 400);
    }

    const [result] = await db.execute(
      `INSERT INTO front_cms_menu_items 
       (school_id, menu_id, parent_id, menu_item, external_url, open_in_new_tab, page_id, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        menuId,
        parent_id || null,
        menu_item.trim(),
        external_url?.trim() || null,
        open_in_new_tab || false,
        page_id || null,
        sort_order || 0,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const { menu_item, external_url, open_in_new_tab, page_id, parent_id, sort_order } = req.body;
    const db = getDatabase();

    if (!menu_item) {
      throw createError('Menu item name is required', 400);
    }

    await db.execute(
      `UPDATE front_cms_menu_items SET
       menu_item = ?, external_url = ?, open_in_new_tab = ?, page_id = ?, parent_id = ?, sort_order = ?
       WHERE id = ? AND school_id = ?`,
      [
        menu_item.trim(),
        external_url?.trim() || null,
        open_in_new_tab || false,
        page_id || null,
        parent_id || null,
        sort_order || 0,
        id,
        schoolId,
      ]
    );

    res.json({
      success: true,
      message: 'Menu item updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM front_cms_menu_items WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Pages ==========

export const getPages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { page_type, search } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM front_cms_pages WHERE school_id = ?';
    const params: any[] = [schoolId];

    if (page_type) {
      query += ' AND page_type = ?';
      params.push(page_type);
    }

    if (search) {
      query += ' AND (page_title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    const [pages] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    next(error);
  }
};

export const getPageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    const [pages] = await db.execute(
      'SELECT * FROM front_cms_pages WHERE school_id = ? AND id = ?',
      [schoolId, id]
    ) as any[];

    if (pages.length === 0) {
      throw createError('Page not found', 404);
    }

    res.json({
      success: true,
      data: pages[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const {
      page_title,
      page_type,
      description,
      meta_title,
      meta_keyword,
      meta_description,
      sidebar_enabled,
      featured_image,
    } = req.body;
    const db = getDatabase();

    if (!page_title) {
      throw createError('Page title is required', 400);
    }

    const slug = generateSlug(page_title);

    const [existing] = await db.execute(
      'SELECT id FROM front_cms_pages WHERE school_id = ? AND slug = ?',
      [schoolId, slug]
    ) as any[];

    let finalSlug = slug;
    if (existing.length > 0) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    const [result] = await db.execute(
      `INSERT INTO front_cms_pages 
       (school_id, page_title, page_type, description, meta_title, meta_keyword, meta_description, sidebar_enabled, featured_image, slug)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        page_title.trim(),
        page_type || 'standard',
        description?.trim() || null,
        meta_title?.trim() || null,
        meta_keyword?.trim() || null,
        meta_description?.trim() || null,
        sidebar_enabled !== undefined ? sidebar_enabled : true,
        featured_image || null,
        finalSlug,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Page created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const {
      page_title,
      page_type,
      description,
      meta_title,
      meta_keyword,
      meta_description,
      sidebar_enabled,
      featured_image,
    } = req.body;
    const db = getDatabase();

    if (!page_title) {
      throw createError('Page title is required', 400);
    }

    const [existing] = await db.execute(
      'SELECT page_title, slug FROM front_cms_pages WHERE school_id = ? AND id = ?',
      [schoolId, id]
    ) as any[];

    if (existing.length === 0) {
      throw createError('Page not found', 404);
    }

    let slug = existing[0].slug;
    if (page_title !== existing[0].page_title) {
      slug = generateSlug(page_title);
      const [slugCheck] = await db.execute(
        'SELECT id FROM front_cms_pages WHERE school_id = ? AND slug = ? AND id != ?',
        [schoolId, slug, id]
      ) as any[];
      if (slugCheck.length > 0) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    await db.execute(
      `UPDATE front_cms_pages SET
       page_title = ?, page_type = ?, description = ?, meta_title = ?, meta_keyword = ?, 
       meta_description = ?, sidebar_enabled = ?, featured_image = ?, slug = ?
       WHERE id = ? AND school_id = ?`,
      [
        page_title.trim(),
        page_type || 'standard',
        description?.trim() || null,
        meta_title?.trim() || null,
        meta_keyword?.trim() || null,
        meta_description?.trim() || null,
        sidebar_enabled !== undefined ? sidebar_enabled : true,
        featured_image || null,
        slug,
        id,
        schoolId,
      ]
    );

    res.json({
      success: true,
      message: 'Page updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deletePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM front_cms_pages WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Events ==========

export const getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { search, start_date, end_date } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM front_cms_events WHERE school_id = ?';
    const params: any[] = [schoolId];

    if (search) {
      query += ' AND (event_title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (start_date && end_date) {
      query += ' AND event_start_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY event_start_date DESC, created_at DESC';

    const [events] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    const [events] = await db.execute(
      'SELECT * FROM front_cms_events WHERE school_id = ? AND id = ?',
      [schoolId, id]
    ) as any[];

    if (events.length === 0) {
      throw createError('Event not found', 404);
    }

    res.json({
      success: true,
      data: events[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const {
      event_title,
      event_venue,
      event_start_date,
      event_end_date,
      description,
      meta_title,
      meta_keyword,
      meta_description,
      sidebar_enabled,
      featured_image,
    } = req.body;
    const db = getDatabase();

    if (!event_title || !event_start_date) {
      throw createError('Event title and start date are required', 400);
    }

    const slug = generateSlug(event_title);

    const [existing] = await db.execute(
      'SELECT id FROM front_cms_events WHERE school_id = ? AND slug = ?',
      [schoolId, slug]
    ) as any[];

    let finalSlug = slug;
    if (existing.length > 0) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    const [result] = await db.execute(
      `INSERT INTO front_cms_events 
       (school_id, event_title, event_venue, event_start_date, event_end_date, description, 
        meta_title, meta_keyword, meta_description, sidebar_enabled, featured_image, slug)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        event_title.trim(),
        event_venue?.trim() || null,
        event_start_date,
        event_end_date || null,
        description?.trim() || null,
        meta_title?.trim() || null,
        meta_keyword?.trim() || null,
        meta_description?.trim() || null,
        sidebar_enabled !== undefined ? sidebar_enabled : true,
        featured_image || null,
        finalSlug,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const {
      event_title,
      event_venue,
      event_start_date,
      event_end_date,
      description,
      meta_title,
      meta_keyword,
      meta_description,
      sidebar_enabled,
      featured_image,
    } = req.body;
    const db = getDatabase();

    if (!event_title || !event_start_date) {
      throw createError('Event title and start date are required', 400);
    }

    const [existing] = await db.execute(
      'SELECT event_title, slug FROM front_cms_events WHERE school_id = ? AND id = ?',
      [schoolId, id]
    ) as any[];

    if (existing.length === 0) {
      throw createError('Event not found', 404);
    }

    let slug = existing[0].slug;
    if (event_title !== existing[0].event_title) {
      slug = generateSlug(event_title);
      const [slugCheck] = await db.execute(
        'SELECT id FROM front_cms_events WHERE school_id = ? AND slug = ? AND id != ?',
        [schoolId, slug, id]
      ) as any[];
      if (slugCheck.length > 0) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    await db.execute(
      `UPDATE front_cms_events SET
       event_title = ?, event_venue = ?, event_start_date = ?, event_end_date = ?, description = ?,
       meta_title = ?, meta_keyword = ?, meta_description = ?, sidebar_enabled = ?, featured_image = ?, slug = ?
       WHERE id = ? AND school_id = ?`,
      [
        event_title.trim(),
        event_venue?.trim() || null,
        event_start_date,
        event_end_date || null,
        description?.trim() || null,
        meta_title?.trim() || null,
        meta_keyword?.trim() || null,
        meta_description?.trim() || null,
        sidebar_enabled !== undefined ? sidebar_enabled : true,
        featured_image || null,
        slug,
        id,
        schoolId,
      ]
    );

    res.json({
      success: true,
      message: 'Event updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM front_cms_events WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Galleries ==========

export const getGalleries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { search } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM front_cms_galleries WHERE school_id = ?';
    const params: any[] = [schoolId];

    if (search) {
      query += ' AND (gallery_title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    const [galleries] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: galleries,
    });
  } catch (error) {
    next(error);
  }
};

export const getGalleryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    const [galleries] = await db.execute(
      'SELECT * FROM front_cms_galleries WHERE school_id = ? AND id = ?',
      [schoolId, id]
    ) as any[];

    if (galleries.length === 0) {
      throw createError('Gallery not found', 404);
    }

    const [images] = await db.execute(
      'SELECT * FROM front_cms_gallery_images WHERE school_id = ? AND gallery_id = ? ORDER BY sort_order ASC',
      [schoolId, id]
    ) as any[];

    res.json({
      success: true,
      data: {
        ...galleries[0],
        images: images,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createGallery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const {
      gallery_title,
      description,
      meta_title,
      meta_keyword,
      meta_description,
      sidebar_enabled,
      featured_image,
      images,
    } = req.body;
    const db = getDatabase();

    if (!gallery_title) {
      throw createError('Gallery title is required', 400);
    }

    const slug = generateSlug(gallery_title);

    const [existing] = await db.execute(
      'SELECT id FROM front_cms_galleries WHERE school_id = ? AND slug = ?',
      [schoolId, slug]
    ) as any[];

    let finalSlug = slug;
    if (existing.length > 0) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    const [result] = await db.execute(
      `INSERT INTO front_cms_galleries 
       (school_id, gallery_title, description, meta_title, meta_keyword, meta_description, sidebar_enabled, featured_image, slug)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        gallery_title.trim(),
        description?.trim() || null,
        meta_title?.trim() || null,
        meta_keyword?.trim() || null,
        meta_description?.trim() || null,
        sidebar_enabled !== undefined ? sidebar_enabled : true,
        featured_image || null,
        finalSlug,
      ]
    ) as any;

    const galleryId = result.insertId;

    if (images && Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        await db.execute(
          'INSERT INTO front_cms_gallery_images (school_id, gallery_id, image_path, image_title, sort_order) VALUES (?, ?, ?, ?, ?)',
          [schoolId, galleryId, image.path, image.title || null, i]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Gallery created successfully',
      data: { id: galleryId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateGallery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const {
      gallery_title,
      description,
      meta_title,
      meta_keyword,
      meta_description,
      sidebar_enabled,
      featured_image,
      images,
    } = req.body;
    const db = getDatabase();

    if (!gallery_title) {
      throw createError('Gallery title is required', 400);
    }

    const [existing] = await db.execute(
      'SELECT gallery_title, slug FROM front_cms_galleries WHERE school_id = ? AND id = ?',
      [schoolId, id]
    ) as any[];

    if (existing.length === 0) {
      throw createError('Gallery not found', 404);
    }

    let slug = existing[0].slug;
    if (gallery_title !== existing[0].gallery_title) {
      slug = generateSlug(gallery_title);
      const [slugCheck] = await db.execute(
        'SELECT id FROM front_cms_galleries WHERE school_id = ? AND slug = ? AND id != ?',
        [schoolId, slug, id]
      ) as any[];
      if (slugCheck.length > 0) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    await db.execute(
      `UPDATE front_cms_galleries SET
       gallery_title = ?, description = ?, meta_title = ?, meta_keyword = ?, meta_description = ?,
       sidebar_enabled = ?, featured_image = ?, slug = ?
       WHERE id = ? AND school_id = ?`,
      [
        gallery_title.trim(),
        description?.trim() || null,
        meta_title?.trim() || null,
        meta_keyword?.trim() || null,
        meta_description?.trim() || null,
        sidebar_enabled !== undefined ? sidebar_enabled : true,
        featured_image || null,
        slug,
        id,
        schoolId,
      ]
    );

    if (images && Array.isArray(images)) {
      await db.execute('DELETE FROM front_cms_gallery_images WHERE school_id = ? AND gallery_id = ?', [schoolId, id]);

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        await db.execute(
          'INSERT INTO front_cms_gallery_images (school_id, gallery_id, image_path, image_title, sort_order) VALUES (?, ?, ?, ?, ?)',
          [schoolId, id, image.path, image.title || null, i]
        );
      }
    }

    res.json({
      success: true,
      message: 'Gallery updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGallery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM front_cms_galleries WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Gallery deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== News ==========

export const getNews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { search, start_date, end_date } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM front_cms_news WHERE school_id = ?';
    const params: any[] = [schoolId];

    if (search) {
      query += ' AND (news_title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (start_date && end_date) {
      query += ' AND news_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY news_date DESC, created_at DESC';

    const [news] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: news,
    });
  } catch (error) {
    next(error);
  }
};

export const getNewsById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    const [news] = await db.execute(
      'SELECT * FROM front_cms_news WHERE school_id = ? AND id = ?',
      [schoolId, id]
    ) as any[];

    if (news.length === 0) {
      throw createError('News not found', 404);
    }

    res.json({
      success: true,
      data: news[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createNews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const {
      news_title,
      news_date,
      description,
      meta_title,
      meta_keyword,
      meta_description,
      sidebar_enabled,
      featured_image,
    } = req.body;
    const db = getDatabase();

    if (!news_title || !news_date) {
      throw createError('News title and date are required', 400);
    }

    const slug = generateSlug(news_title);

    const [existing] = await db.execute(
      'SELECT id FROM front_cms_news WHERE school_id = ? AND slug = ?',
      [schoolId, slug]
    ) as any[];

    let finalSlug = slug;
    if (existing.length > 0) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    const [result] = await db.execute(
      `INSERT INTO front_cms_news 
       (school_id, news_title, news_date, description, meta_title, meta_keyword, meta_description, 
        sidebar_enabled, featured_image, slug)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        news_title.trim(),
        news_date,
        description?.trim() || null,
        meta_title?.trim() || null,
        meta_keyword?.trim() || null,
        meta_description?.trim() || null,
        sidebar_enabled !== undefined ? sidebar_enabled : true,
        featured_image || null,
        finalSlug,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'News created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateNews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const {
      news_title,
      news_date,
      description,
      meta_title,
      meta_keyword,
      meta_description,
      sidebar_enabled,
      featured_image,
    } = req.body;
    const db = getDatabase();

    if (!news_title || !news_date) {
      throw createError('News title and date are required', 400);
    }

    const [existing] = await db.execute(
      'SELECT news_title, slug FROM front_cms_news WHERE school_id = ? AND id = ?',
      [schoolId, id]
    ) as any[];

    if (existing.length === 0) {
      throw createError('News not found', 404);
    }

    let slug = existing[0].slug;
    if (news_title !== existing[0].news_title) {
      slug = generateSlug(news_title);
      const [slugCheck] = await db.execute(
        'SELECT id FROM front_cms_news WHERE school_id = ? AND slug = ? AND id != ?',
        [schoolId, slug, id]
      ) as any[];
      if (slugCheck.length > 0) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    await db.execute(
      `UPDATE front_cms_news SET
       news_title = ?, news_date = ?, description = ?, meta_title = ?, meta_keyword = ?, 
       meta_description = ?, sidebar_enabled = ?, featured_image = ?, slug = ?
       WHERE id = ? AND school_id = ?`,
      [
        news_title.trim(),
        news_date,
        description?.trim() || null,
        meta_title?.trim() || null,
        meta_keyword?.trim() || null,
        meta_description?.trim() || null,
        sidebar_enabled !== undefined ? sidebar_enabled : true,
        featured_image || null,
        slug,
        id,
        schoolId,
      ]
    );

    res.json({
      success: true,
      message: 'News updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM front_cms_news WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'News deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Media ==========

export const getMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { file_type, search } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM front_cms_media WHERE school_id = ?';
    const params: any[] = [schoolId];

    if (file_type) {
      query += ' AND file_type = ?';
      params.push(file_type);
    }

    if (search) {
      query += ' AND file_name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [media] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: media,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const file = req.file;
    const { alt_text, youtube_url } = req.body;
    const db = getDatabase();

    if (!file && !youtube_url) {
      throw createError('File or YouTube URL is required', 400);
    }

    if (youtube_url) {
      const [result] = await db.execute(
        `INSERT INTO front_cms_media (school_id, file_name, file_path, file_type, youtube_url, alt_text)
         VALUES (?, ?, ?, 'video', ?, ?)`,
        [schoolId, 'YouTube Video', youtube_url, youtube_url, alt_text?.trim() || null]
      ) as any;

      res.status(201).json({
        success: true,
        message: 'Media uploaded successfully',
        data: { id: result.insertId },
      });
    } else if (file) {
      const filePath = `/uploads/front-cms/${file.filename}`;
      const fileType = file.mimetype.startsWith('image/') ? 'image' : 'document';

      const [result] = await db.execute(
        `INSERT INTO front_cms_media 
         (school_id, file_name, file_path, file_type, file_size, mime_type, alt_text)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          schoolId,
          file.originalname,
          filePath,
          fileType,
          file.size,
          file.mimetype,
          alt_text?.trim() || null,
        ]
      ) as any;

      res.status(201).json({
        success: true,
        message: 'Media uploaded successfully',
        data: { id: result.insertId },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const deleteMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    const [media] = await db.execute(
      'SELECT file_path FROM front_cms_media WHERE id = ? AND school_id = ?',
      [id, schoolId]
    ) as any[];

    if (media.length > 0 && media[0].file_path && !media[0].file_path.includes('youtube.com')) {
      const filePath = path.join(__dirname, '../../', media[0].file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db.execute('DELETE FROM front_cms_media WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Banner Images ==========

export const getBannerImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const [banners] = await db.execute(
      'SELECT * FROM front_cms_banner_images WHERE school_id = ? ORDER BY sort_order ASC, created_at DESC',
      [schoolId]
    ) as any[];

    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

export const createBannerImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { image_path, image_title, image_link, sort_order, is_active } = req.body;
    const db = getDatabase();

    if (!image_path) {
      throw createError('Image path is required', 400);
    }

    const [result] = await db.execute(
      `INSERT INTO front_cms_banner_images 
       (school_id, image_path, image_title, image_link, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        image_path,
        image_title?.trim() || null,
        image_link || null,
        sort_order || 0,
        is_active !== undefined ? is_active : true,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Banner image added successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateBannerImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const { image_path, image_title, image_link, sort_order, is_active } = req.body;
    const db = getDatabase();

    await db.execute(
      `UPDATE front_cms_banner_images SET
       image_path = ?, image_title = ?, image_link = ?, sort_order = ?, is_active = ?
       WHERE id = ? AND school_id = ?`,
      [
        image_path,
        image_title?.trim() || null,
        image_link || null,
        sort_order || 0,
        is_active !== undefined ? is_active : true,
        id,
        schoolId,
      ]
    );

    res.json({
      success: true,
      message: 'Banner image updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBannerImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    // Get banner info to delete file
    const [banner] = await db.execute(
      'SELECT image_path FROM front_cms_banner_images WHERE id = ?',
      [id]
    ) as any[];

    if (banner.length > 0 && banner[0].image_path) {
      const filePath = path.join(__dirname, '../../', banner[0].image_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db.execute('DELETE FROM front_cms_banner_images WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Banner image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

