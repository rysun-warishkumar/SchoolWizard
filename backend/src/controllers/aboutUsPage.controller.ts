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

// Configure multer for image uploads
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/front-cms/about-us');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `${file.fieldname}-${timestamp}${ext}`);
  },
});

const imageUpload = multer({
  storage: imageStorage,
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

// ========== Mission & Vision ==========

export const getMissionVision = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const [data] = await db.execute('SELECT * FROM front_cms_about_us_mission_vision LIMIT 1');

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return res.json({
        success: true,
        data: {
          mission_content: '',
          vision_content: '',
        },
      });
    }

    res.json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const updateMissionVision = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { mission_content, vision_content } = req.body;

    const [existing] = await db.execute('SELECT id FROM front_cms_about_us_mission_vision LIMIT 1');
    const exists = Array.isArray(existing) && existing.length > 0;

    if (exists) {
      await db.execute(
        'UPDATE front_cms_about_us_mission_vision SET mission_content = ?, vision_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM (SELECT id FROM front_cms_about_us_mission_vision LIMIT 1) AS temp)',
        [mission_content || '', vision_content || '']
      );
    } else {
      await db.execute(
        'INSERT INTO front_cms_about_us_mission_vision (mission_content, vision_content) VALUES (?, ?)',
        [mission_content || '', vision_content || '']
      );
    }

    const [updated] = await db.execute('SELECT * FROM front_cms_about_us_mission_vision LIMIT 1');
    res.json({ success: true, message: 'Mission & Vision updated successfully', data: Array.isArray(updated) ? updated[0] : updated });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

// ========== Counters ==========

export const getCounters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const [counters] = await db.execute(
      'SELECT * FROM front_cms_about_us_counters ORDER BY sort_order ASC, created_at ASC'
    );

    res.json({ success: true, data: Array.isArray(counters) ? counters : [] });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const createCounter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { counter_number, counter_label, sort_order, is_active } = req.body;

    const [result] = await db.execute(
      'INSERT INTO front_cms_about_us_counters (counter_number, counter_label, sort_order, is_active) VALUES (?, ?, ?, ?)',
      [counter_number, counter_label, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true]
    );

    const insertResult = result as any;
    const [counter] = await db.execute('SELECT * FROM front_cms_about_us_counters WHERE id = ?', [String(insertResult.insertId)]);

    res.status(201).json({ success: true, message: 'Counter created successfully', data: Array.isArray(counter) ? counter[0] : counter });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const updateCounter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { counter_number, counter_label, sort_order, is_active } = req.body;

    await db.execute(
      'UPDATE front_cms_about_us_counters SET counter_number = ?, counter_label = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [counter_number, counter_label, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true, String(id)]
    );

    const [updated] = await db.execute('SELECT * FROM front_cms_about_us_counters WHERE id = ?', [String(id)]);
    res.json({ success: true, message: 'Counter updated successfully', data: Array.isArray(updated) ? updated[0] : updated });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const deleteCounter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    await db.execute('DELETE FROM front_cms_about_us_counters WHERE id = ?', [String(id)]);

    res.json({ success: true, message: 'Counter deleted successfully' });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

// ========== History ==========

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const [data] = await db.execute('SELECT * FROM front_cms_about_us_history LIMIT 1');

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return res.json({
        success: true,
        data: {
          history_content: '',
          history_image: null,
        },
      });
    }

    res.json({ success: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const updateHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { history_content } = req.body;

    let history_image = null;
    if (req.file) {
      history_image = `/uploads/front-cms/about-us/${req.file.filename}`;
    } else if (req.body.history_image && req.body.history_image !== 'null') {
      history_image = req.body.history_image;
    }

    const [existing] = await db.execute('SELECT id, history_image FROM front_cms_about_us_history LIMIT 1') as any[];
    const exists = Array.isArray(existing) && existing.length > 0;
    const existingImage = exists ? (existing[0] as any)?.history_image : null;

    if (req.file && existingImage && existingImage !== history_image) {
      const oldImagePath = path.join(__dirname, '../../', existingImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    if (exists) {
      await db.execute(
        'UPDATE front_cms_about_us_history SET history_content = ?, history_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM (SELECT id FROM front_cms_about_us_history LIMIT 1) AS temp)',
        [history_content || '', history_image]
      );
    } else {
      await db.execute(
        'INSERT INTO front_cms_about_us_history (history_content, history_image) VALUES (?, ?)',
        [history_content || '', history_image]
      );
    }

    const [updated] = await db.execute('SELECT * FROM front_cms_about_us_history LIMIT 1');
    res.json({ success: true, message: 'History updated successfully', data: Array.isArray(updated) ? updated[0] : updated });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

// ========== Core Values ==========

export const getValues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const [values] = await db.execute(
      'SELECT * FROM front_cms_about_us_values ORDER BY sort_order ASC, created_at ASC'
    );

    res.json({ success: true, data: Array.isArray(values) ? values : [] });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const createValue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { icon_class, title, description, sort_order, is_active } = req.body;

    const [result] = await db.execute(
      'INSERT INTO front_cms_about_us_values (icon_class, title, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [icon_class, title, description, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true]
    );

    const insertResult = result as any;
    const [value] = await db.execute('SELECT * FROM front_cms_about_us_values WHERE id = ?', [insertResult.insertId]);

    res.status(201).json({ success: true, message: 'Value created successfully', data: Array.isArray(value) ? value[0] : value });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const updateValue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { icon_class, title, description, sort_order, is_active } = req.body;

    await db.execute(
      'UPDATE front_cms_about_us_values SET icon_class = ?, title = ?, description = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [icon_class, title, description, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true, id]
    );

    const [updated] = await db.execute('SELECT * FROM front_cms_about_us_values WHERE id = ?', [String(id)]);
    res.json({ success: true, message: 'Value updated successfully', data: Array.isArray(updated) ? updated[0] : updated });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const deleteValue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    await db.execute('DELETE FROM front_cms_about_us_values WHERE id = ?', [String(id)]);

    res.json({ success: true, message: 'Value deleted successfully' });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

// ========== Achievements ==========

export const getAchievements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const [achievements] = await db.execute(
      'SELECT * FROM front_cms_about_us_achievements ORDER BY sort_order ASC, created_at ASC'
    );

    res.json({ success: true, data: Array.isArray(achievements) ? achievements : [] });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const createAchievement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { achievement_year, achievement_title, achievement_description, sort_order, is_active } = req.body;

    const [result] = await db.execute(
      'INSERT INTO front_cms_about_us_achievements (achievement_year, achievement_title, achievement_description, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [achievement_year, achievement_title, achievement_description, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true]
    );

    const insertResult = result as any;
    const [achievement] = await db.execute('SELECT * FROM front_cms_about_us_achievements WHERE id = ?', [String(insertResult.insertId)]);

    res.status(201).json({ success: true, message: 'Achievement created successfully', data: Array.isArray(achievement) ? achievement[0] : achievement });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const updateAchievement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { achievement_year, achievement_title, achievement_description, sort_order, is_active } = req.body;

    await db.execute(
      'UPDATE front_cms_about_us_achievements SET achievement_year = ?, achievement_title = ?, achievement_description = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [achievement_year, achievement_title, achievement_description, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true, id]
    );

    const [updated] = await db.execute('SELECT * FROM front_cms_about_us_achievements WHERE id = ?', [String(id)]);
    res.json({ success: true, message: 'Achievement updated successfully', data: Array.isArray(updated) ? updated[0] : updated });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const deleteAchievement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    await db.execute('DELETE FROM front_cms_about_us_achievements WHERE id = ?', [String(id)]);

    res.json({ success: true, message: 'Achievement deleted successfully' });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

// ========== Leadership ==========

export const getLeadership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const [leadership] = await db.execute(
      'SELECT * FROM front_cms_about_us_leadership ORDER BY sort_order ASC, created_at ASC'
    );

    res.json({ success: true, data: Array.isArray(leadership) ? leadership : [] });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const createLeader = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { leader_name, leader_role, leader_bio, sort_order, is_active } = req.body;

    let leader_image = null;
    if (req.file) {
      leader_image = `/uploads/front-cms/about-us/${req.file.filename}`;
    }

    const [result] = await db.execute(
      'INSERT INTO front_cms_about_us_leadership (leader_name, leader_role, leader_bio, leader_image, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [leader_name, leader_role, leader_bio, leader_image, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true]
    );

    const insertResult = result as any;
    const [leader] = await db.execute('SELECT * FROM front_cms_about_us_leadership WHERE id = ?', [insertResult.insertId]);

    res.status(201).json({ success: true, message: 'Leader created successfully', data: Array.isArray(leader) ? leader[0] : leader });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const updateLeader = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { leader_name, leader_role, leader_bio, sort_order, is_active } = req.body;

    const [existing] = await db.execute('SELECT leader_image FROM front_cms_about_us_leadership WHERE id = ?', [String(id)]) as any[];
    const existingImage = existing[0]?.leader_image;

    let leader_image = existingImage;
    if (req.file) {
      leader_image = `/uploads/front-cms/about-us/${req.file.filename}`;
      if (existingImage) {
        const oldImagePath = path.join(__dirname, '../../', existingImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    } else if (req.body.leader_image === 'null' || req.body.leader_image === '') {
      leader_image = null;
      if (existingImage) {
        const oldImagePath = path.join(__dirname, '../../', existingImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    await db.execute(
      'UPDATE front_cms_about_us_leadership SET leader_name = ?, leader_role = ?, leader_bio = ?, leader_image = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [leader_name, leader_role, leader_bio, leader_image, sort_order || 0, parseBoolean(is_active) !== undefined ? parseBoolean(is_active) : true, String(id)]
    );

    const [updated] = await db.execute('SELECT * FROM front_cms_about_us_leadership WHERE id = ?', [String(id)]);
    res.json({ success: true, message: 'Leader updated successfully', data: Array.isArray(updated) ? updated[0] : updated });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

export const deleteLeader = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const [leader] = await db.execute('SELECT leader_image FROM front_cms_about_us_leadership WHERE id = ?', [String(id)]) as any[];
    const leaderImage = leader[0]?.leader_image;

    if (leaderImage) {
      const imagePath = path.join(__dirname, '../../', leaderImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.execute('DELETE FROM front_cms_about_us_leadership WHERE id = ?', [String(id)]);

    res.json({ success: true, message: 'Leader deleted successfully' });
  } catch (error: any) {
    next(createError(error.message, 500));
  }
};

// Export multer middleware
export const uploadHistoryImage = imageUpload.single('history_image');
export const uploadLeaderImage = imageUpload.single('leader_image');

