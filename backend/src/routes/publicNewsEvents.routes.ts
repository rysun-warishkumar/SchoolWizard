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
    next(createError(500, error.message));
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
    
    const [articles] = await db.execute(query, [identifier]);
    
    if (!articles || (Array.isArray(articles) && articles.length === 0)) {
      return next(createError(404, 'News article not found'));
    }
    
    const article = Array.isArray(articles) ? articles[0] : articles;
    
    // Increment views count
    await db.execute('UPDATE news_articles SET views_count = views_count + 1 WHERE id = ?', [article.id]);
    
    res.json({ success: true, data: article });
  } catch (error: any) {
    next(createError(500, error.message));
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
    next(createError(500, error.message));
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
    
    const [events] = await db.execute(query, [identifier]);
    
    if (!events || (Array.isArray(events) && events.length === 0)) {
      return next(createError(404, 'Event not found'));
    }
    
    res.json({ success: true, data: Array.isArray(events) ? events[0] : events });
  } catch (error: any) {
    next(createError(500, error.message));
  }
});

export default router;

