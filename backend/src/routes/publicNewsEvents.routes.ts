import express from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Get all active news articles (optionally filtered by category)
router.get('/news', async (req, res, next) => {
  try {
    const db = getDatabase();
    const { category, featured, limit } = req.query;
    
    let query = 'SELECT * FROM news_articles WHERE is_active = TRUE';
    const params: any[] = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (featured !== undefined) {
      query += ' AND is_featured = ?';
      params.push(featured === 'true' || featured === '1');
    }
    
    query += ' ORDER BY published_date DESC, created_at DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(String(parseInt(limit as string)));
    }
    
    const [articles] = await db.execute(query, params);
    res.json({ success: true, data: Array.isArray(articles) ? articles : [] });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
});

// Get single news article by ID or slug
router.get('/news/:identifier', async (req, res, next) => {
  try {
    const db = getDatabase();
    const { identifier } = req.params;
    
    // Check if identifier is a number (ID) or string (slug)
    const isId = !isNaN(parseInt(identifier));
    const query = isId 
      ? 'SELECT * FROM news_articles WHERE id = ? AND is_active = TRUE'
      : 'SELECT * FROM news_articles WHERE slug = ? AND is_active = TRUE';
    
    const [articles] = await db.execute(query, [isId ? String(identifier) : identifier]) as any[];
    
    if (!articles || (Array.isArray(articles) && articles.length === 0)) {
      return next(createError('News article not found', 404));
    }
    
    const article = articles[0] as any;
    
    // Increment views count
    const articleId = article?.id;
    if (articleId) {
      await db.execute('UPDATE news_articles SET views_count = views_count + 1 WHERE id = ?', [String(articleId)]);
    }
    
    res.json({ success: true, data: article });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
});

// Get all active events (optionally filtered by category, upcoming/past)
router.get('/events', async (req, res, next) => {
  try {
    const db = getDatabase();
    const { category, featured, upcoming, limit } = req.query;
    
    let query = 'SELECT * FROM events WHERE is_active = TRUE';
    const params: any[] = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (featured !== undefined) {
      query += ' AND is_featured = ?';
      params.push(featured === 'true' || featured === '1');
    }
    
    if (upcoming === 'true' || upcoming === '1') {
      query += ' AND event_date >= CURDATE()';
    } else if (upcoming === 'false' || upcoming === '0') {
      query += ' AND event_date < CURDATE()';
    }
    
    query += ' ORDER BY event_date ASC, event_time ASC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(String(parseInt(limit as string)));
    }
    
    const [events] = await db.execute(query, params);
    res.json({ success: true, data: Array.isArray(events) ? events : [] });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
});

// Get single event by ID or slug
router.get('/events/:identifier', async (req, res, next) => {
  try {
    const db = getDatabase();
    const { identifier } = req.params;
    
    // Check if identifier is a number (ID) or string (slug)
    const isId = !isNaN(parseInt(identifier));
    const query = isId 
      ? 'SELECT * FROM events WHERE id = ? AND is_active = TRUE'
      : 'SELECT * FROM events WHERE slug = ? AND is_active = TRUE';
    
    const [events] = await db.execute(query, [isId ? String(identifier) : identifier]);
    
    if (!events || (Array.isArray(events) && events.length === 0)) {
      return next(createError('Event not found', 404));
    }
    
    res.json({ success: true, data: Array.isArray(events) ? events[0] : events });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
});

export default router;

