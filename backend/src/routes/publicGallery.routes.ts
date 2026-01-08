import express from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Get all active categories
router.get('/categories', async (req, res, next) => {
  try {
    const db = getDatabase();
    const [categories] = await db.execute(
      'SELECT * FROM gallery_categories WHERE is_active = TRUE ORDER BY sort_order ASC, name ASC'
    );
    res.json({ success: true, data: Array.isArray(categories) ? categories : [] });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
});

// Get all active images (optionally filtered by category)
router.get('/images', async (req, res, next) => {
  try {
    const db = getDatabase();
    const { category_id } = req.query;
    
    let query = `
      SELECT gi.*, gc.name as category_name 
      FROM gallery_images gi
      LEFT JOIN gallery_categories gc ON gi.category_id = gc.id
      WHERE gi.is_active = TRUE
    `;
    const params: any[] = [];
    
    if (category_id) {
      query += ' AND gi.category_id = ?';
      params.push(String(category_id));
    }
    
    query += ' ORDER BY gi.sort_order ASC, gi.created_at DESC';
    
    const [images] = await db.execute(query, params);
    res.json({ success: true, data: Array.isArray(images) ? images : [] });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
});

export default router;

