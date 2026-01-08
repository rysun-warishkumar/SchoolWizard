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

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/certificates');
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
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ========== Certificate Templates ==========

export const getCertificateTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const [templates] = await db.execute(
      'SELECT * FROM certificate_templates ORDER BY name ASC'
    ) as any[];

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

export const getCertificateTemplateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const [templates] = await db.execute(
      'SELECT * FROM certificate_templates WHERE id = ?',
      [id]
    ) as any[];

    if (templates.length === 0) {
      throw createError('Certificate template not found', 404);
    }

    res.json({
      success: true,
      data: templates[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createCertificateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      header_left_text,
      header_center_text,
      header_right_text,
      body_text,
      footer_left_text,
      footer_center_text,
      footer_right_text,
      header_height,
      footer_height,
      body_height,
      body_width,
      student_photo_enabled,
      photo_height,
    } = req.body;

    if (!name) {
      throw createError('Certificate template name is required', 400);
    }

    const db = getDatabase();

    // Handle background image upload
    let backgroundImage = null;
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const file = req.files[0] as Express.Multer.File;
      backgroundImage = `/uploads/certificates/${file.filename}`;
    }

    const [result] = await db.execute(
      `INSERT INTO certificate_templates 
       (name, header_left_text, header_center_text, header_right_text, body_text,
        footer_left_text, footer_center_text, footer_right_text, header_height,
        footer_height, body_height, body_width, student_photo_enabled, photo_height, background_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        header_left_text?.trim() || null,
        header_center_text?.trim() || null,
        header_right_text?.trim() || null,
        body_text?.trim() || null,
        footer_left_text?.trim() || null,
        footer_center_text?.trim() || null,
        footer_right_text?.trim() || null,
        header_height ? parseInt(header_height) : 100,
        footer_height ? parseInt(footer_height) : 100,
        body_height ? parseInt(body_height) : 400,
        body_width ? parseInt(body_width) : 800,
        student_photo_enabled === 'true' || student_photo_enabled === true,
        photo_height ? parseInt(photo_height) : 100,
        backgroundImage,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Certificate template created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCertificateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      header_left_text,
      header_center_text,
      header_right_text,
      body_text,
      footer_left_text,
      footer_center_text,
      footer_right_text,
      header_height,
      footer_height,
      body_height,
      body_width,
      student_photo_enabled,
      photo_height,
    } = req.body;

    const db = getDatabase();

    // Check if template exists
    const [existing] = await db.execute(
      'SELECT * FROM certificate_templates WHERE id = ?',
      [id]
    ) as any[];

    if (existing.length === 0) {
      throw createError('Certificate template not found', 404);
    }

    // Handle background image upload
    let backgroundImage = existing[0].background_image;
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const file = req.files[0] as Express.Multer.File;
      
      // Delete old background image if exists
      if (backgroundImage) {
        const oldFilePath = path.join(__dirname, '../..', backgroundImage);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      backgroundImage = `/uploads/certificates/${file.filename}`;
    }

    await db.execute(
      `UPDATE certificate_templates SET
       name = ?, header_left_text = ?, header_center_text = ?, header_right_text = ?,
       body_text = ?, footer_left_text = ?, footer_center_text = ?, footer_right_text = ?,
       header_height = ?, footer_height = ?, body_height = ?, body_width = ?,
       student_photo_enabled = ?, photo_height = ?, background_image = ?
       WHERE id = ?`,
      [
        name?.trim() || existing[0].name,
        header_left_text?.trim() || null,
        header_center_text?.trim() || null,
        header_right_text?.trim() || null,
        body_text?.trim() || null,
        footer_left_text?.trim() || null,
        footer_center_text?.trim() || null,
        footer_right_text?.trim() || null,
        header_height ? parseInt(header_height) : existing[0].header_height,
        footer_height ? parseInt(footer_height) : existing[0].footer_height,
        body_height ? parseInt(body_height) : existing[0].body_height,
        body_width ? parseInt(body_width) : existing[0].body_width,
        student_photo_enabled !== undefined 
          ? (student_photo_enabled === 'true' || student_photo_enabled === true)
          : existing[0].student_photo_enabled,
        photo_height ? parseInt(photo_height) : existing[0].photo_height,
        backgroundImage,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Certificate template updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCertificateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if template exists
    const [existing] = await db.execute(
      'SELECT * FROM certificate_templates WHERE id = ?',
      [id]
    ) as any[];

    if (existing.length === 0) {
      throw createError('Certificate template not found', 404);
    }

    // Delete background image if exists
    if (existing[0].background_image) {
      const filePath = path.join(__dirname, '../..', existing[0].background_image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db.execute('DELETE FROM certificate_templates WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Certificate template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== ID Card Templates ==========

export const getIdCardTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const [templates] = await db.execute(
      'SELECT * FROM id_card_templates ORDER BY name ASC'
    ) as any[];

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

export const getIdCardTemplateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const [templates] = await db.execute(
      'SELECT * FROM id_card_templates WHERE id = ?',
      [id]
    ) as any[];

    if (templates.length === 0) {
      throw createError('ID card template not found', 404);
    }

    res.json({
      success: true,
      data: templates[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createIdCardTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      school_name,
      address,
      phone,
      email,
      id_card_title,
      header_color,
      admission_number_enabled,
      student_name_enabled,
      class_enabled,
      father_name_enabled,
      mother_name_enabled,
      student_address_enabled,
      phone_enabled,
      date_of_birth_enabled,
      blood_group_enabled,
    } = req.body;

    if (!name) {
      throw createError('ID card template name is required', 400);
    }

    const db = getDatabase();

    // Handle file uploads (background_image, logo, signature)
    let backgroundImage = null;
    let logo = null;
    let signature = null;

    if (req.files && Array.isArray(req.files)) {
      const files = req.files as Express.Multer.File[];
      // Assuming files are uploaded in order: background_image, logo, signature
      // Or use field names to identify them
      files.forEach((file, index) => {
        const filePath = `/uploads/certificates/${file.filename}`;
        if (file.fieldname === 'background_image' || (index === 0 && !backgroundImage)) {
          backgroundImage = filePath;
        } else if (file.fieldname === 'logo' || (index === 1 && !logo)) {
          logo = filePath;
        } else if (file.fieldname === 'signature' || (index === 2 && !signature)) {
          signature = filePath;
        }
      });
    }

    const [result] = await db.execute(
      `INSERT INTO id_card_templates 
       (name, background_image, logo, signature, school_name, address, phone, email,
        id_card_title, header_color, admission_number_enabled, student_name_enabled,
        class_enabled, father_name_enabled, mother_name_enabled, student_address_enabled,
        phone_enabled, date_of_birth_enabled, blood_group_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        backgroundImage,
        logo,
        signature,
        school_name?.trim() || null,
        address?.trim() || null,
        phone?.trim() || null,
        email?.trim() || null,
        id_card_title?.trim() || null,
        header_color || '#000000',
        admission_number_enabled === 'true' || admission_number_enabled === true,
        student_name_enabled === 'true' || student_name_enabled === true,
        class_enabled === 'true' || class_enabled === true,
        father_name_enabled === 'true' || father_name_enabled === true,
        mother_name_enabled === 'true' || mother_name_enabled === true,
        student_address_enabled === 'true' || student_address_enabled === true,
        phone_enabled === 'true' || phone_enabled === true,
        date_of_birth_enabled === 'true' || date_of_birth_enabled === true,
        blood_group_enabled === 'true' || blood_group_enabled === true,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'ID card template created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateIdCardTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      school_name,
      address,
      phone,
      email,
      id_card_title,
      header_color,
      admission_number_enabled,
      student_name_enabled,
      class_enabled,
      father_name_enabled,
      mother_name_enabled,
      student_address_enabled,
      phone_enabled,
      date_of_birth_enabled,
      blood_group_enabled,
    } = req.body;

    const db = getDatabase();

    // Check if template exists
    const [existing] = await db.execute(
      'SELECT * FROM id_card_templates WHERE id = ?',
      [id]
    ) as any[];

    if (existing.length === 0) {
      throw createError('ID card template not found', 404);
    }

    // Handle file uploads
    let backgroundImage = existing[0].background_image;
    let logo = existing[0].logo;
    let signature = existing[0].signature;

    if (req.files && Array.isArray(req.files)) {
      const files = req.files as Express.Multer.File[];
      files.forEach((file) => {
        const filePath = `/uploads/certificates/${file.filename}`;
        if (file.fieldname === 'background_image') {
          // Delete old background image
          if (backgroundImage) {
            const oldFilePath = path.join(__dirname, '../..', backgroundImage);
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }
          backgroundImage = filePath;
        } else if (file.fieldname === 'logo') {
          // Delete old logo
          if (logo) {
            const oldFilePath = path.join(__dirname, '../..', logo);
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }
          logo = filePath;
        } else if (file.fieldname === 'signature') {
          // Delete old signature
          if (signature) {
            const oldFilePath = path.join(__dirname, '../..', signature);
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }
          signature = filePath;
        }
      });
    }

    await db.execute(
      `UPDATE id_card_templates SET
       name = ?, background_image = ?, logo = ?, signature = ?, school_name = ?,
       address = ?, phone = ?, email = ?, id_card_title = ?, header_color = ?,
       admission_number_enabled = ?, student_name_enabled = ?, class_enabled = ?,
       father_name_enabled = ?, mother_name_enabled = ?, student_address_enabled = ?,
       phone_enabled = ?, date_of_birth_enabled = ?, blood_group_enabled = ?
       WHERE id = ?`,
      [
        name?.trim() || existing[0].name,
        backgroundImage,
        logo,
        signature,
        school_name?.trim() || existing[0].school_name,
        address?.trim() || existing[0].address,
        phone?.trim() || existing[0].phone,
        email?.trim() || existing[0].email,
        id_card_title?.trim() || existing[0].id_card_title,
        header_color || existing[0].header_color,
        admission_number_enabled !== undefined 
          ? (admission_number_enabled === 'true' || admission_number_enabled === true)
          : existing[0].admission_number_enabled,
        student_name_enabled !== undefined 
          ? (student_name_enabled === 'true' || student_name_enabled === true)
          : existing[0].student_name_enabled,
        class_enabled !== undefined 
          ? (class_enabled === 'true' || class_enabled === true)
          : existing[0].class_enabled,
        father_name_enabled !== undefined 
          ? (father_name_enabled === 'true' || father_name_enabled === true)
          : existing[0].father_name_enabled,
        mother_name_enabled !== undefined 
          ? (mother_name_enabled === 'true' || mother_name_enabled === true)
          : existing[0].mother_name_enabled,
        student_address_enabled !== undefined 
          ? (student_address_enabled === 'true' || student_address_enabled === true)
          : existing[0].student_address_enabled,
        phone_enabled !== undefined 
          ? (phone_enabled === 'true' || phone_enabled === true)
          : existing[0].phone_enabled,
        date_of_birth_enabled !== undefined 
          ? (date_of_birth_enabled === 'true' || date_of_birth_enabled === true)
          : existing[0].date_of_birth_enabled,
        blood_group_enabled !== undefined 
          ? (blood_group_enabled === 'true' || blood_group_enabled === true)
          : existing[0].blood_group_enabled,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'ID card template updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteIdCardTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if template exists
    const [existing] = await db.execute(
      'SELECT * FROM id_card_templates WHERE id = ?',
      [id]
    ) as any[];

    if (existing.length === 0) {
      throw createError('ID card template not found', 404);
    }

    // Delete uploaded files if they exist
    const filesToDelete = [
      existing[0].background_image,
      existing[0].logo,
      existing[0].signature,
    ].filter(Boolean);

    filesToDelete.forEach((filePath) => {
      const fullPath = path.join(__dirname, '../..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    await db.execute('DELETE FROM id_card_templates WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'ID card template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Generate Certificate ==========

export const generateCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { template_id, student_ids } = req.body;

    if (!template_id || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      throw createError('Template ID and student IDs are required', 400);
    }

    const db = getDatabase();

    // Get template
    const [templates] = await db.execute(
      'SELECT * FROM certificate_templates WHERE id = ?',
      [template_id]
    ) as any[];

    if (templates.length === 0) {
      throw createError('Certificate template not found', 404);
    }

    const template = templates[0];

    // Get students
    const placeholders = student_ids.map(() => '?').join(',');
    const [students] = await db.execute(
      `SELECT s.*, 
       c.name as class_name,
       sec.name as section_name,
       CONCAT(c.name, ' - ', sec.name) as class_section
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       WHERE s.id IN (${placeholders})`,
      student_ids
    ) as any[];

    if (students.length === 0) {
      throw createError('No students found', 404);
    }

    res.json({
      success: true,
      data: {
        template,
        students,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ========== Generate ID Card ==========

export const generateIdCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { template_id, student_ids } = req.body;

    if (!template_id || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      throw createError('Template ID and student IDs are required', 400);
    }

    const db = getDatabase();

    // Get template
    const [templates] = await db.execute(
      'SELECT * FROM id_card_templates WHERE id = ?',
      [template_id]
    ) as any[];

    if (templates.length === 0) {
      throw createError('ID card template not found', 404);
    }

    const template = templates[0];

    // Get students
    const placeholders = student_ids.map(() => '?').join(',');
    const [students] = await db.execute(
      `SELECT s.*, 
       c.name as class_name,
       sec.name as section_name,
       CONCAT(c.name, ' - ', sec.name) as class_section
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       WHERE s.id IN (${placeholders})`,
      student_ids
    ) as any[];

    if (students.length === 0) {
      throw createError('No students found', 404);
    }

    res.json({
      success: true,
      data: {
        template,
        students,
      },
    });
  } catch (error) {
    next(error);
  }
};

