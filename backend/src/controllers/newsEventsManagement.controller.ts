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

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Configure multer for news/events image uploads
const newsEventsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/front-cms/news-events');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `news-events-${timestamp}-${Math.round(Math.random() * 1E9)}${ext}`);
  },
});

export const newsEventsUpload = multer({
  storage: newsEventsStorage,
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

// Helper function to convert string boolean to boolean
const parseBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value === 'true' || value === '1' || value === 'on';
  }
  return false;
};

// ========== News Articles ==========

export const getNewsArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { category, featured, limit } = req.query;
    
    let query = 'SELECT * FROM news_articles WHERE 1=1';
    const params: any[] = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (featured !== undefined) {
      query += ' AND is_featured = ?';
      params.push(parseBoolean(featured));
    }
    
    query += ' ORDER BY published_date DESC, created_at DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit as string));
    }
    
    const [articles] = await db.execute(query, params);
    res.json({ success: true, data: Array.isArray(articles) ? articles : [] });
  } catch (error: any) {
    // Pass MySQL errors directly to error handler
    if (error.code && error.code.startsWith('ER_')) {
      return next(error);
    }
    next(createError(error.message, 500));
  }
};

export const getNewsArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const [articles] = await db.execute('SELECT * FROM news_articles WHERE id = ?', [String(id)]);
    
    if (!articles || (Array.isArray(articles) && articles.length === 0)) {
      return next(createError('News article not found', 404));
    }
    
    const article = Array.isArray(articles) ? articles[0] : articles;
    
    // Increment views count
    await db.execute('UPDATE news_articles SET views_count = views_count + 1 WHERE id = ?', [String(id)]);
    
    res.json({ success: true, data: article });
  } catch (error: any) {
    // Pass MySQL errors directly to error handler
    if (error.code && error.code.startsWith('ER_')) {
      return next(error);
    }
    next(createError(error.message, 500));
  }
};

export const createNewsArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const file = req.file;
    const { title, excerpt, content, category, author, published_date, is_featured, is_active } = req.body;
    
    if (!title || !content || !published_date) {
      return next(createError('Title, content, and published date are required', 400));
    }
    
    const slug = generateSlug(title);
    
    // Check if slug already exists
    const [existing] = await db.execute('SELECT id FROM news_articles WHERE slug = ?', [slug]) as any;
    if (existing && existing.length > 0) {
      return next(createError('A news article with a similar title already exists', 400));
    }
    
    const featuredImage = file ? `/uploads/front-cms/news-events/${file.filename}` : null;
    
    const [result] = await db.execute(
      'INSERT INTO news_articles (title, slug, excerpt, content, category, featured_image, author, published_date, is_featured, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        title.trim(),
        slug,
        excerpt?.trim() || null,
        content.trim(),
        category || 'general',
        featuredImage,
        author?.trim() || null,
        published_date,
        parseBoolean(is_featured) !== undefined ? parseBoolean(is_featured) : false,
        parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true,
      ]
    ) as any;
    
    const [newArticle] = await db.execute('SELECT * FROM news_articles WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'News article created successfully',
      data: Array.isArray(newArticle) ? newArticle[0] : newArticle,
    });
  } catch (error: any) {
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/front-cms/news-events', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return next(createError('A news article with this title already exists', 400));
    }
    next(createError(error.message, 500));
  }
};

export const updateNewsArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const file = req.file;
    const { title, excerpt, content, category, author, published_date, is_featured, is_active } = req.body;
    
    if (!title || !content || !published_date) {
      return next(createError('Title, content, and published date are required', 400));
    }
    
    // Get existing article
    const [existingArticles] = await db.execute('SELECT * FROM news_articles WHERE id = ?', [String(id)]) as any;
    if (!existingArticles || existingArticles.length === 0) {
      return next(createError('News article not found', 404));
    }
    const existingArticle = existingArticles[0];
    
    let slug = existingArticle.slug;
    // Generate new slug if title changed
    if (title !== existingArticle.title) {
      slug = generateSlug(title);
      // Check if new slug already exists
      const [slugCheck] = await db.execute('SELECT id FROM news_articles WHERE slug = ? AND id != ?', [slug, String(id)]) as any;
      if (slugCheck && slugCheck.length > 0) {
        return next(createError('A news article with a similar title already exists', 400));
      }
    }
    
    let featuredImage = existingArticle.featured_image;
    
    // If new file uploaded, delete old file and update path
    if (file) {
      if (existingArticle.featured_image) {
        const oldFilePath = path.join(__dirname, '../../', existingArticle.featured_image);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      featuredImage = `/uploads/front-cms/news-events/${file.filename}`;
    }
    
    await db.execute(
      'UPDATE news_articles SET title = ?, slug = ?, excerpt = ?, content = ?, category = ?, featured_image = ?, author = ?, published_date = ?, is_featured = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        title.trim(),
        slug,
        excerpt?.trim() || null,
        content.trim(),
        category || 'general',
        featuredImage,
        author?.trim() || null,
        published_date,
        parseBoolean(is_featured) !== undefined ? parseBoolean(is_featured) : false,
        parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true,
        String(id),
      ]
    );
    
    const [updatedArticle] = await db.execute('SELECT * FROM news_articles WHERE id = ?', [String(id)]);
    
    res.json({
      success: true,
      message: 'News article updated successfully',
      data: Array.isArray(updatedArticle) ? updatedArticle[0] : updatedArticle,
    });
  } catch (error: any) {
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/front-cms/news-events', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(createError(error.message, 500));
  }
};

export const deleteNewsArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // Get article to delete file
    const [articles] = await db.execute('SELECT * FROM news_articles WHERE id = ?', [String(id)]) as any;
    if (!articles || articles.length === 0) {
      return next(createError('News article not found', 404));
    }
    const article = articles[0];
    
    // Delete file
    if (article.featured_image) {
      const filePath = path.join(__dirname, '../../', article.featured_image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await db.execute('DELETE FROM news_articles WHERE id = ?', [String(id)]);
    
    res.json({ success: true, message: 'News article deleted successfully' });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

// ========== Events ==========

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { category, featured, upcoming, limit } = req.query;
    
    let query = 'SELECT * FROM events WHERE 1=1';
    const params: any[] = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (featured !== undefined) {
      query += ' AND is_featured = ?';
      params.push(parseBoolean(featured));
    }
    
    if (upcoming !== undefined && parseBoolean(upcoming)) {
      query += ' AND event_date >= CURDATE()';
    } else if (upcoming !== undefined && !parseBoolean(upcoming)) {
      query += ' AND event_date < CURDATE()';
    }
    
    query += ' ORDER BY event_date ASC, event_time ASC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit as string));
    }
    
    const [events] = await db.execute(query, params);
    res.json({ success: true, data: Array.isArray(events) ? events : [] });
  } catch (error: any) {
    // Pass MySQL errors directly to error handler
    if (error.code && error.code.startsWith('ER_')) {
      return next(error);
    }
    next(createError(error.message, 500));
  }
};

export const getEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const [events] = await db.execute('SELECT * FROM events WHERE id = ?', [String(id)]);
    
    if (!events || (Array.isArray(events) && events.length === 0)) {
      return next(createError('Event not found', 404));
    }
    
    res.json({ success: true, data: Array.isArray(events) ? events[0] : events });
  } catch (error: any) {
    // Pass MySQL errors directly to error handler
    if (error.code && error.code.startsWith('ER_')) {
      return next(error);
    }
    next(createError(error.message, 500));
  }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const file = req.file;
    const { title, description, category, event_date, event_time, end_date, end_time, venue, is_featured, is_active } = req.body;
    
    if (!title || !description || !event_date) {
      return next(createError('Title, description, and event date are required', 400));
    }
    
    const slug = generateSlug(title);
    
    // Check if slug already exists
    const [existing] = await db.execute('SELECT id FROM events WHERE slug = ?', [slug]) as any;
    if (existing && existing.length > 0) {
      return next(createError('An event with a similar title already exists', 400));
    }
    
    const featuredImage = file ? `/uploads/front-cms/news-events/${file.filename}` : null;
    
    const [result] = await db.execute(
      'INSERT INTO events (title, slug, description, category, event_date, event_time, end_date, end_time, venue, featured_image, is_featured, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        title.trim(),
        slug,
        description.trim(),
        category || 'general',
        event_date,
        event_time || null,
        end_date || null,
        end_time || null,
        venue?.trim() || null,
        featuredImage,
        parseBoolean(is_featured) !== undefined ? parseBoolean(is_featured) : false,
        parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true,
      ]
    ) as any;
    
    const [newEvent] = await db.execute('SELECT * FROM events WHERE id = ?', [String(result.insertId)]);
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: Array.isArray(newEvent) ? newEvent[0] : newEvent,
    });
  } catch (error: any) {
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/front-cms/news-events', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return next(createError('An event with this title already exists', 400));
    }
    next(createError(error.message, 500));
  }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const file = req.file;
    const { title, description, category, event_date, event_time, end_date, end_time, venue, is_featured, is_active } = req.body;
    
    if (!title || !description || !event_date) {
      return next(createError('Title, description, and event date are required', 400));
    }
    
    // Get existing event
    const [existingEvents] = await db.execute('SELECT * FROM events WHERE id = ?', [String(id)]) as any;
    if (!existingEvents || existingEvents.length === 0) {
      return next(createError('Event not found', 404));
    }
    const existingEvent = existingEvents[0];
    
    let slug = existingEvent.slug;
    // Generate new slug if title changed
    if (title !== existingEvent.title) {
      slug = generateSlug(title);
      // Check if new slug already exists
      const [slugCheck] = await db.execute('SELECT id FROM events WHERE slug = ? AND id != ?', [slug, String(id)]) as any;
      if (slugCheck && slugCheck.length > 0) {
        return next(createError('An event with a similar title already exists', 400));
      }
    }
    
    let featuredImage = existingEvent.featured_image;
    
    // If new file uploaded, delete old file and update path
    if (file) {
      if (existingEvent.featured_image) {
        const oldFilePath = path.join(__dirname, '../../', existingEvent.featured_image);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      featuredImage = `/uploads/front-cms/news-events/${file.filename}`;
    }
    
    await db.execute(
      'UPDATE events SET title = ?, slug = ?, description = ?, category = ?, event_date = ?, event_time = ?, end_date = ?, end_time = ?, venue = ?, featured_image = ?, is_featured = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        title.trim(),
        slug,
        description.trim(),
        category || 'general',
        event_date,
        event_time || null,
        end_date || null,
        end_time || null,
        venue?.trim() || null,
        featuredImage,
        parseBoolean(is_featured) !== undefined ? parseBoolean(is_featured) : false,
        parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true,
        String(id),
      ]
    );
    
    const [updatedEvent] = await db.execute('SELECT * FROM events WHERE id = ?', [String(id)]);
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      data: Array.isArray(updatedEvent) ? updatedEvent[0] : updatedEvent,
    });
  } catch (error: any) {
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/front-cms/news-events', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(createError(error.message, 500));
  }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // Get event to delete file
    const [events] = await db.execute('SELECT * FROM events WHERE id = ?', [String(id)]) as any;
    if (!events || events.length === 0) {
      return next(createError('Event not found', 404));
    }
    const event = events[0];
    
    // Delete file
    if (event.featured_image) {
      const filePath = path.join(__dirname, '../../', event.featured_image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await db.execute('DELETE FROM events WHERE id = ?', [String(id)]);
    
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    // Pass MySQL errors directly to error handler
    if (error.code && error.code.startsWith('ER_')) {
      return next(error);
    }
    next(createError(error.message, 500));
  }
};

