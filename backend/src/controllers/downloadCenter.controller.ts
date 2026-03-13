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

type AudienceScope = {
  class_id: number | null;
  section_id: number | null;
};

const getStudentParentAudienceScopes = async (
  req: AuthRequest,
  schoolId: number,
  db: any
): Promise<AudienceScope[] | null> => {
  const userRole = String(req.user?.role || '').toLowerCase();

  if (userRole === 'student') {
    const [students] = await db.execute(
      'SELECT class_id, section_id FROM students WHERE user_id = ? AND school_id = ? LIMIT 1',
      [req.user?.id, schoolId]
    ) as any[];

    if (students.length === 0) {
      throw createError('Student profile not found', 404);
    }

    return [
      {
        class_id: students[0].class_id != null ? Number(students[0].class_id) : null,
        section_id: students[0].section_id != null ? Number(students[0].section_id) : null,
      },
    ];
  }

  if (userRole === 'parent') {
    const parentEmail = req.user?.email;
    if (!parentEmail) {
      throw createError('Parent email is required to access downloads', 400);
    }

    const [children] = await db.execute(
      `SELECT DISTINCT class_id, section_id
       FROM students
       WHERE school_id = ?
         AND (father_email = ? OR mother_email = ? OR guardian_email = ?)`,
      [schoolId, parentEmail, parentEmail, parentEmail]
    ) as any[];

    const unique = new Map<string, AudienceScope>();
    children.forEach((child: any) => {
      const classId = child.class_id != null ? Number(child.class_id) : null;
      const sectionId = child.section_id != null ? Number(child.section_id) : null;
      const key = `${classId ?? 'null'}_${sectionId ?? 'null'}`;
      if (!unique.has(key)) {
        unique.set(key, { class_id: classId, section_id: sectionId });
      }
    });

    return Array.from(unique.values());
  }

  return null;
};

const appendAudienceScopeFilter = (
  query: string,
  params: any[],
  scopes: AudienceScope[] | null,
  alias: string
): string => {
  if (scopes === null) return query;

  // Student/parent can only view content intended for students/both.
  query += ` AND (${alias}.available_for = 'students' OR ${alias}.available_for = 'both')`;

  // No linked class/section scope => no accessible content.
  if (scopes.length === 0) {
    query += ' AND 1 = 0';
    return query;
  }

  query += ` AND (${alias}.class_id IS NULL`;
  scopes.forEach((scope) => {
    if (scope.class_id != null) {
      if (scope.section_id == null) {
        query += ` OR (${alias}.class_id = ? AND ${alias}.section_id IS NULL)`;
        params.push(scope.class_id);
      } else {
        query += ` OR (${alias}.class_id = ? AND (${alias}.section_id IS NULL OR ${alias}.section_id = ?))`;
        params.push(scope.class_id, scope.section_id);
      }
    }
  });
  query += ')';

  return query;
};

// ========== Download Contents ==========

export const getDownloadContents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const schoolId = getSchoolId(authReq);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const { content_type, available_for, class_id, section_id, search } = req.query;
    const audienceScopes = await getStudentParentAudienceScopes(authReq, schoolId, db);

    let query = `
      SELECT dc.*,
             c.name as class_name,
             s.name as section_name,
             u.name as uploaded_by_name
      FROM download_contents dc
      LEFT JOIN classes c ON dc.class_id = c.id AND c.school_id = ?
      LEFT JOIN sections s ON dc.section_id = s.id AND s.school_id = ?
      LEFT JOIN users u ON dc.uploaded_by = u.id
      WHERE dc.school_id = ?
    `;
    const params: any[] = [schoolId, schoolId, schoolId];

    query = appendAudienceScopeFilter(query, params, audienceScopes, 'dc');

    if (content_type) {
      query += ' AND dc.content_type = ?';
      params.push(content_type);
    }

    if (available_for && audienceScopes === null) {
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
    const authReq = req as AuthRequest;
    const schoolId = getSchoolId(authReq);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();
    const audienceScopes = await getStudentParentAudienceScopes(authReq, schoolId, db);

    let query = `SELECT dc.*,
            c.name as class_name,
            s.name as section_name,
            u.name as uploaded_by_name
     FROM download_contents dc
     LEFT JOIN classes c ON dc.class_id = c.id AND c.school_id = ?
     LEFT JOIN sections s ON dc.section_id = s.id AND s.school_id = ?
     LEFT JOIN users u ON dc.uploaded_by = u.id
     WHERE dc.id = ? AND dc.school_id = ?`;
    const params: any[] = [schoolId, schoolId, id, schoolId];
    query = appendAudienceScopeFilter(query, params, audienceScopes, 'dc');

    const [contents] = await db.execute(query, params) as any[];

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
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
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

      if (finalClassId && finalSectionId) {
        const [classSections] = await db.execute(
          'SELECT id FROM class_sections WHERE class_id = ? AND section_id = ? AND school_id = ?',
          [finalClassId, finalSectionId, schoolId]
        ) as any[];

        if (classSections.length === 0) {
          throw createError('Selected section does not belong to the selected class', 400);
        }
      }
    } else if (available_for === 'staff') {
      finalClassId = null;
      finalSectionId = null;
    }

    const filePath = `/uploads/downloads/${file.filename}`;
    const fileSize = file.size;
    const fileType = file.mimetype;

    await db.execute(
      `INSERT INTO download_contents
       (school_id, content_title, content_type, available_for, class_id, section_id, upload_date, description,
        file_path, file_name, file_size, file_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
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
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
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

    const [existing] = await db.execute('SELECT file_path FROM download_contents WHERE id = ? AND school_id = ?', [id, schoolId]) as any[];

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
          'SELECT id FROM class_sections WHERE class_id = ? AND section_id = ? AND school_id = ?',
          [finalClassId, finalSectionId, schoolId]
        ) as any[];

        if (classSections.length === 0) {
          throw createError('Selected section does not belong to the selected class', 400);
        }
      }
    } else if (available_for === 'staff') {
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
    updateValues.push(id, schoolId);

    await db.execute(
      `UPDATE download_contents SET ${updateFields} WHERE id = ? AND school_id = ?`,
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
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    const [contents] = await db.execute('SELECT file_path FROM download_contents WHERE id = ? AND school_id = ?', [id, schoolId]) as any[];

    if (contents.length === 0) {
      throw createError('Download content not found', 404);
    }

    const filePath = path.join(__dirname, '../..', contents[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await db.execute('DELETE FROM download_contents WHERE id = ? AND school_id = ?', [id, schoolId]);

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
    const authReq = req as AuthRequest;
    const schoolId = getSchoolId(authReq);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();
    const audienceScopes = await getStudentParentAudienceScopes(authReq, schoolId, db);

    let query = 'SELECT file_path, file_name, class_id, section_id, available_for FROM download_contents WHERE id = ? AND school_id = ?';
    const params: any[] = [id, schoolId];
    query = appendAudienceScopeFilter(query, params, audienceScopes, 'download_contents');

    const [contents] = await db.execute(query, params) as any[];

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

