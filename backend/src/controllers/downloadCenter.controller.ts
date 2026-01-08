import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/downloads');
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
  fileFilter: (req, file, cb) => {
    // Allow all file types
    cb(null, true);
  },
});

// ========== Download Contents ==========

export const getDownloadContents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { content_type, available_for, class_id, section_id, search } = req.query;

    let query = `
      SELECT dc.*,
             c.name as class_name,
             s.name as section_name,
             u.name as uploaded_by_name
      FROM download_contents dc
      LEFT JOIN classes c ON dc.class_id = c.id
      LEFT JOIN sections s ON dc.section_id = s.id
      LEFT JOIN users u ON dc.uploaded_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (content_type) {
      query += ' AND dc.content_type = ?';
      params.push(content_type);
    }

    if (available_for) {
      query += ' AND (dc.available_for = ? OR dc.available_for = "both")';
      params.push(available_for);
    }

    if (class_id) {
      query += ' AND dc.class_id = ?';
      params.push(class_id);
    }

    if (section_id) {
      query += ' AND dc.section_id = ?';
      params.push(section_id);
    }

    if (search) {
      query += ' AND (dc.content_title LIKE ? OR dc.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY dc.upload_date DESC, dc.created_at DESC';

    const [contents] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: contents,
    });
  } catch (error) {
    next(error);
  }
};

export const getDownloadContentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [contents] = await db.execute(
      `SELECT dc.*,
              c.name as class_name,
              s.name as section_name,
              u.name as uploaded_by_name
       FROM download_contents dc
       LEFT JOIN classes c ON dc.class_id = c.id
       LEFT JOIN sections s ON dc.section_id = s.id
       LEFT JOIN users u ON dc.uploaded_by = u.id
       WHERE dc.id = ?`,
      [id]
    ) as any[];

    if (contents.length === 0) {
      throw createError('Download content not found', 404);
    }

    res.json({
      success: true,
      data: contents[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createDownloadContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      content_title,
      content_type,
      available_for,
      class_id,
      section_id,
      upload_date,
      description,
    } = req.body;

    if (!content_title || !content_type || !upload_date) {
      throw createError('Content title, type, and upload date are required', 400);
    }

    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    // Handle file upload
    const file = req.file;
    if (!file) {
      throw createError('File is required', 400);
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      throw createError('File size exceeds 50MB limit', 400);
    }

    // Validate class and section logic
    let finalClassId = null;
    let finalSectionId = null;

    if (available_for === 'students' || available_for === 'both') {
      // Class and section are optional for students/both
      finalClassId = class_id ? parseInt(class_id) : null;
      finalSectionId = section_id ? parseInt(section_id) : null;

      // If section is provided, class must also be provided
      if (finalSectionId && !finalClassId) {
        throw createError('Class must be selected when section is selected', 400);
      }

      // Validate that section belongs to class if both are provided
      if (finalClassId && finalSectionId) {
        const [classSections] = await db.execute(
          'SELECT id FROM class_sections WHERE class_id = ? AND section_id = ?',
          [finalClassId, finalSectionId]
        ) as any[];

        if (classSections.length === 0) {
          throw createError('Selected section does not belong to the selected class', 400);
        }
      }
    } else if (available_for === 'staff') {
      // For staff, class and section should be null
      finalClassId = null;
      finalSectionId = null;
    }

    const filePath = `/uploads/downloads/${file.filename}`;
    const fileSize = file.size;
    const fileType = file.mimetype;

    await db.execute(
      `INSERT INTO download_contents
       (content_title, content_type, available_for, class_id, section_id, upload_date, description,
        file_path, file_name, file_size, file_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        content_title.trim(),
        content_type,
        available_for || 'students',
        finalClassId,
        finalSectionId,
        upload_date,
        description?.trim() || null,
        filePath,
        file.originalname,
        fileSize,
        fileType,
        userId,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Download content created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateDownloadContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      content_title,
      content_type,
      available_for,
      class_id,
      section_id,
      upload_date,
      description,
    } = req.body;

    if (!content_title || !content_type || !upload_date) {
      throw createError('Content title, type, and upload date are required', 400);
    }

    const db = getDatabase();

    // Check if content exists
    const [existing] = await db.execute('SELECT file_path FROM download_contents WHERE id = ?', [id]) as any[];

    if (existing.length === 0) {
      throw createError('Download content not found', 404);
    }

    // Validate class and section logic
    let finalClassId = null;
    let finalSectionId = null;

    if (available_for === 'students' || available_for === 'both') {
      // Class and section are optional for students/both
      finalClassId = class_id ? parseInt(class_id) : null;
      finalSectionId = section_id ? parseInt(section_id) : null;

      // If section is provided, class must also be provided
      if (finalSectionId && !finalClassId) {
        throw createError('Class must be selected when section is selected', 400);
      }

      // Validate that section belongs to class if both are provided
      if (finalClassId && finalSectionId) {
        const [classSections] = await db.execute(
          'SELECT id FROM class_sections WHERE class_id = ? AND section_id = ?',
          [finalClassId, finalSectionId]
        ) as any[];

        if (classSections.length === 0) {
          throw createError('Selected section does not belong to the selected class', 400);
        }
      }
    } else if (available_for === 'staff') {
      // For staff, class and section should be null
      finalClassId = null;
      finalSectionId = null;
    }

    const updateData: any = {
      content_title: content_title.trim(),
      content_type,
      available_for: available_for || 'students',
      class_id: finalClassId,
      section_id: finalSectionId,
      upload_date,
      description: description?.trim() || null,
    };

    // Handle file upload if new file is provided
    const file = req.file;
    if (file) {
      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw createError('File size exceeds 50MB limit', 400);
      }

      // Delete old file
      const oldFilePath = path.join(__dirname, '../..', existing[0].file_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      updateData.file_path = `/uploads/downloads/${file.filename}`;
      updateData.file_name = file.originalname;
      updateData.file_size = file.size;
      updateData.file_type = file.mimetype;
    }

    const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(updateData);
    updateValues.push(id);

    await db.execute(
      `UPDATE download_contents SET ${updateFields} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Download content updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDownloadContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Get file path before deleting
    const [contents] = await db.execute('SELECT file_path FROM download_contents WHERE id = ?', [id]) as any[];

    if (contents.length === 0) {
      throw createError('Download content not found', 404);
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../..', contents[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await db.execute('DELETE FROM download_contents WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Download content deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [contents] = await db.execute(
      'SELECT file_path, file_name FROM download_contents WHERE id = ?',
      [id]
    ) as any[];

    if (contents.length === 0) {
      throw createError('Download content not found', 404);
    }

    const filePath = path.join(__dirname, '../..', contents[0].file_path);

    if (!fs.existsSync(filePath)) {
      throw createError('File not found', 404);
    }

    res.download(filePath, contents[0].file_name);
  } catch (error) {
    next(error);
  }
};

