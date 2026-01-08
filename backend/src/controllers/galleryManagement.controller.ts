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

// Configure multer for gallery image uploads
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/front-cms/gallery');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `gallery-${timestamp}-${Math.round(Math.random() * 1E9)}${ext}`);
  },
});

export const galleryUpload = multer({
  storage: galleryStorage,
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

// ========== Gallery Categories ==========

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const [categories] = await db.execute(
      'SELECT * FROM gallery_categories ORDER BY sort_order ASC, name ASC'
    );
    res.json({ success: true, data: Array.isArray(categories) ? categories : [] });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { name, description, sort_order, is_active } = req.body;
    
    if (!name || !name.trim()) {
      return next(createError('Category name is required', 400));
    }
    
    const [result] = await db.execute(
      'INSERT INTO gallery_categories (name, description, sort_order, is_active) VALUES (?, ?, ?, ?)',
      [name.trim(), description?.trim() || null, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true]
    ) as any;
    
    const [newCategory] = await db.execute('SELECT * FROM gallery_categories WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: Array.isArray(newCategory) ? newCategory[0] : newCategory,
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return next(createError('Category name already exists', 400));
    }
    next(createError(error.message, 500));
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { name, description, sort_order, is_active } = req.body;
    
    if (!name || !name.trim()) {
      return next(createError('Category name is required', 400));
    }
    
    await db.execute(
      'UPDATE gallery_categories SET name = ?, description = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name.trim(), description?.trim() || null, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true, String(id)]
    );
    
    const [updatedCategory] = await db.execute('SELECT * FROM gallery_categories WHERE id = ?', [String(id)]);
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: Array.isArray(updatedCategory) ? updatedCategory[0] : updatedCategory,
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return next(createError('Category name already exists', 400));
    }
    next(createError(error.message, 500));
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // Check if category has images
    const [images] = await db.execute('SELECT COUNT(*) as count FROM gallery_images WHERE category_id = ?', [String(id)]) as any;
    if (images && images[0] && images[0].count > 0) {
      return next(createError('Cannot delete category with existing images. Please delete or move images first.', 400));
    }
    
    await db.execute('DELETE FROM gallery_categories WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

// ========== Gallery Images ==========

export const getImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { category_id } = req.query;
    
    let query = `
      SELECT gi.*, gc.name as category_name 
      FROM gallery_images gi
      LEFT JOIN gallery_categories gc ON gi.category_id = gc.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (category_id) {
      query += ' AND gi.category_id = ?';
      params.push(category_id);
    }
    
    query += ' ORDER BY gi.sort_order ASC, gi.created_at DESC';
    
    const [images] = await db.execute(query, params);
    res.json({ success: true, data: Array.isArray(images) ? images : [] });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const createImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const file = req.file;
    const { category_id, title, description, sort_order, is_active } = req.body;
    
    if (!file) {
      return next(createError('Image file is required', 400));
    }
    
    if (!category_id || !title || !title.trim()) {
      return next(createError('Category and title are required', 400));
    }
    
    // Verify category exists
    const [categories] = await db.execute('SELECT id FROM gallery_categories WHERE id = ?', [String(category_id)]) as any;
    if (!categories || categories.length === 0) {
      return next(createError('Category not found', 404));
    }
    
    const imagePath = `/uploads/front-cms/gallery/${file.filename}`;
    
    const [result] = await db.execute(
      'INSERT INTO gallery_images (category_id, title, description, image_path, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [category_id, title.trim(), description?.trim() || null, imagePath, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true]
    ) as any;
    
    const [newImage] = await db.execute(
      'SELECT gi.*, gc.name as category_name FROM gallery_images gi LEFT JOIN gallery_categories gc ON gi.category_id = gc.id WHERE gi.id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: Array.isArray(newImage) ? newImage[0] : newImage,
    });
  } catch (error: any) {
    // Delete uploaded file if database insert fails
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/front-cms/gallery', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(createError(error.message, 500));
  }
};

export const updateImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const file = req.file;
    const { category_id, title, description, sort_order, is_active } = req.body;
    
    if (!title || !title.trim()) {
      return next(createError('Title is required', 400));
    }
    
    // Get existing image
    const [existingImages] = await db.execute('SELECT * FROM gallery_images WHERE id = ?', [String(id)]) as any;
    if (!existingImages || existingImages.length === 0) {
      return next(createError('Image not found', 404));
    }
    const existingImage = existingImages[0];
    
    let imagePath = existingImage.image_path;
    
    // If new file uploaded, delete old file and update path
    if (file) {
      // Delete old file
      if (existingImage.image_path) {
        const oldFilePath = path.join(__dirname, '../../', existingImage.image_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      imagePath = `/uploads/front-cms/gallery/${file.filename}`;
    }
    
    const updateCategoryId = category_id || existingImage.category_id;
    
    await db.execute(
      'UPDATE gallery_images SET category_id = ?, title = ?, description = ?, image_path = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [String(updateCategoryId), title.trim(), description?.trim() || null, imagePath, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true, String(id)]
    );
    
    const [updatedImage] = await db.execute(
      'SELECT gi.*, gc.name as category_name FROM gallery_images gi LEFT JOIN gallery_categories gc ON gi.category_id = gc.id WHERE gi.id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Image updated successfully',
      data: Array.isArray(updatedImage) ? updatedImage[0] : updatedImage,
    });
  } catch (error: any) {
    // Delete uploaded file if database update fails
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/front-cms/gallery', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(createError(error.message, 500));
  }
};

export const deleteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // Get image to delete file
    const [images] = await db.execute('SELECT * FROM gallery_images WHERE id = ?', [id]) as any;
    if (!images || images.length === 0) {
      return next(createError('Image not found', 404));
    }
    const image = images[0];
    
    // Delete file
    if (image.image_path) {
      const filePath = path.join(__dirname, '../../', image.image_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await db.execute('DELETE FROM gallery_images WHERE id = ?', [String(id)]);
    
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

