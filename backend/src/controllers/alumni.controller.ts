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

// Configure multer for photo uploads
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/alumni');
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

const eventImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/alumni/events');
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

const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({
  storage: photoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter,
});

export const uploadEventImage = multer({
  storage: eventImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter,
});

// ========== Alumni Records ==========

export const getAlumni = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, graduation_year, class_id, status } = req.query;
    const db = getDatabase();

    let query = `
      SELECT a.*, 
             c.name as class_name_display,
             s.name as section_name_display
      FROM alumni a
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN sections s ON a.section_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (
        a.first_name LIKE ? OR 
        a.last_name LIKE ? OR 
        a.email LIKE ? OR 
        a.admission_no LIKE ? OR
        a.phone LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (graduation_year) {
      query += ' AND a.graduation_year = ?';
      params.push(graduation_year);
    }

    if (class_id) {
      query += ' AND a.class_id = ?';
      params.push(class_id);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.graduation_year DESC, a.first_name ASC';

    const [alumni] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: alumni,
    });
  } catch (error) {
    next(error);
  }
};

export const getAlumniById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [alumni] = await db.execute(
      `SELECT a.*, 
              c.name as class_name_display,
              s.name as section_name_display
       FROM alumni a
       LEFT JOIN classes c ON a.class_id = c.id
       LEFT JOIN sections s ON a.section_id = s.id
       WHERE a.id = ?`,
      [id]
    ) as any[];

    if (alumni.length === 0) {
      throw createError('Alumni not found', 404);
    }

    res.json({
      success: true,
      data: alumni[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createAlumni = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      student_id,
      admission_no,
      first_name,
      last_name,
      email,
      phone,
      alternate_phone,
      date_of_birth,
      gender,
      graduation_year,
      class_id,
      section_id,
      class_name,
      section_name,
      current_profession,
      current_company,
      current_designation,
      current_address,
      permanent_address,
      city,
      state,
      country,
      pincode,
      facebook_url,
      linkedin_url,
      twitter_url,
      instagram_url,
      achievements,
      bio,
      status,
    } = req.body;
    const db = getDatabase();

    if (!first_name || !graduation_year) {
      throw createError('First name and graduation year are required', 400);
    }

    const photo = req.file ? `/uploads/alumni/${req.file.filename}` : null;

    const [result] = await db.execute(
      `INSERT INTO alumni (
        student_id, admission_no, first_name, last_name, email, phone, alternate_phone,
        date_of_birth, gender, graduation_year, class_id, section_id, class_name, section_name,
        current_profession, current_company, current_designation,
        current_address, permanent_address, city, state, country, pincode,
        photo, facebook_url, linkedin_url, twitter_url, instagram_url,
        achievements, bio, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id || null,
        admission_no?.trim() || null,
        first_name.trim(),
        last_name?.trim() || null,
        email?.trim() || null,
        phone?.trim() || null,
        alternate_phone?.trim() || null,
        date_of_birth || null,
        gender || 'male',
        graduation_year,
        class_id || null,
        section_id || null,
        class_name?.trim() || null,
        section_name?.trim() || null,
        current_profession?.trim() || null,
        current_company?.trim() || null,
        current_designation?.trim() || null,
        current_address?.trim() || null,
        permanent_address?.trim() || null,
        city?.trim() || null,
        state?.trim() || null,
        country?.trim() || null,
        pincode?.trim() || null,
        photo,
        facebook_url?.trim() || null,
        linkedin_url?.trim() || null,
        twitter_url?.trim() || null,
        instagram_url?.trim() || null,
        achievements?.trim() || null,
        bio?.trim() || null,
        status || 'active',
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Alumni record created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAlumni = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      student_id,
      admission_no,
      first_name,
      last_name,
      email,
      phone,
      alternate_phone,
      date_of_birth,
      gender,
      graduation_year,
      class_id,
      section_id,
      class_name,
      section_name,
      current_profession,
      current_company,
      current_designation,
      current_address,
      permanent_address,
      city,
      state,
      country,
      pincode,
      facebook_url,
      linkedin_url,
      twitter_url,
      instagram_url,
      achievements,
      bio,
      status,
    } = req.body;
    const db = getDatabase();

    if (!first_name || !graduation_year) {
      throw createError('First name and graduation year are required', 400);
    }

    // Get existing alumni to check for photo
    const [existing] = await db.execute(
      'SELECT photo FROM alumni WHERE id = ?',
      [id]
    ) as any[];

    if (existing.length === 0) {
      throw createError('Alumni not found', 404);
    }

    let photo = existing[0].photo;
    if (req.file) {
      // Delete old photo if exists
      if (photo) {
        const oldPhotoPath = path.join(__dirname, '../../', photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      photo = `/uploads/alumni/${req.file.filename}`;
    }

    await db.execute(
      `UPDATE alumni SET
       student_id = ?, admission_no = ?, first_name = ?, last_name = ?, email = ?, phone = ?, alternate_phone = ?,
       date_of_birth = ?, gender = ?, graduation_year = ?, class_id = ?, section_id = ?, class_name = ?, section_name = ?,
       current_profession = ?, current_company = ?, current_designation = ?,
       current_address = ?, permanent_address = ?, city = ?, state = ?, country = ?, pincode = ?,
       photo = ?, facebook_url = ?, linkedin_url = ?, twitter_url = ?, instagram_url = ?,
       achievements = ?, bio = ?, status = ?
       WHERE id = ?`,
      [
        student_id || null,
        admission_no?.trim() || null,
        first_name.trim(),
        last_name?.trim() || null,
        email?.trim() || null,
        phone?.trim() || null,
        alternate_phone?.trim() || null,
        date_of_birth || null,
        gender || 'male',
        graduation_year,
        class_id || null,
        section_id || null,
        class_name?.trim() || null,
        section_name?.trim() || null,
        current_profession?.trim() || null,
        current_company?.trim() || null,
        current_designation?.trim() || null,
        current_address?.trim() || null,
        permanent_address?.trim() || null,
        city?.trim() || null,
        state?.trim() || null,
        country?.trim() || null,
        pincode?.trim() || null,
        photo,
        facebook_url?.trim() || null,
        linkedin_url?.trim() || null,
        twitter_url?.trim() || null,
        instagram_url?.trim() || null,
        achievements?.trim() || null,
        bio?.trim() || null,
        status || 'active',
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Alumni record updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAlumni = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Get alumni photo to delete file
    const [alumni] = await db.execute(
      'SELECT photo FROM alumni WHERE id = ?',
      [id]
    ) as any[];

    if (alumni.length > 0 && alumni[0].photo) {
      const photoPath = path.join(__dirname, '../../', alumni[0].photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await db.execute('DELETE FROM alumni WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Alumni record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Alumni Events ==========

export const getAlumniEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, event_type, status, start_date, end_date } = req.query;
    const db = getDatabase();

    let query = `
      SELECT ae.*, 
             u.name as created_by_name
      FROM alumni_events ae
      LEFT JOIN users u ON ae.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ' AND (ae.event_title LIKE ? OR ae.event_description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (event_type) {
      query += ' AND ae.event_type = ?';
      params.push(event_type);
    }

    if (status) {
      query += ' AND ae.status = ?';
      params.push(status);
    }

    if (start_date && end_date) {
      query += ' AND ae.event_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY ae.event_date DESC, ae.created_at DESC';

    const [events] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

export const getAlumniEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [events] = await db.execute(
      `SELECT ae.*, 
              u.name as created_by_name
       FROM alumni_events ae
       LEFT JOIN users u ON ae.created_by = u.id
       WHERE ae.id = ?`,
      [id]
    ) as any[];

    if (events.length === 0) {
      throw createError('Event not found', 404);
    }

    // Get registrations count
    const [registrations] = await db.execute(
      'SELECT COUNT(*) as total, SUM(CASE WHEN attendance_status = "attended" THEN 1 ELSE 0 END) as attended FROM alumni_event_registrations WHERE event_id = ?',
      [id]
    ) as any[];

    res.json({
      success: true,
      data: {
        ...events[0],
        registrations_count: registrations[0].total || 0,
        attended_count: registrations[0].attended || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createAlumniEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      event_title,
      event_description,
      event_date,
      event_time,
      event_end_date,
      event_end_time,
      event_venue,
      event_address,
      event_type,
      registration_required,
      registration_deadline,
      max_participants,
      registration_fee,
      contact_person,
      contact_email,
      contact_phone,
      status,
    } = req.body;
    const db = getDatabase();

    if (!event_title || !event_date) {
      throw createError('Event title and date are required', 400);
    }

    // Create events directory if needed
    const eventsDir = path.join(__dirname, '../../uploads/alumni/events');
    if (!fs.existsSync(eventsDir)) {
      fs.mkdirSync(eventsDir, { recursive: true });
    }
    
    const eventImage = req.file ? `/uploads/alumni/events/${req.file.filename}` : null;

    const [result] = await db.execute(
      `INSERT INTO alumni_events (
        event_title, event_description, event_date, event_time, event_end_date, event_end_time,
        event_venue, event_address, event_type, registration_required, registration_deadline,
        max_participants, registration_fee, contact_person, contact_email, contact_phone,
        event_image, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_title.trim(),
        event_description?.trim() || null,
        event_date,
        event_time || null,
        event_end_date || null,
        event_end_time || null,
        event_venue?.trim() || null,
        event_address?.trim() || null,
        event_type || 'reunion',
        registration_required || false,
        registration_deadline || null,
        max_participants || null,
        registration_fee || 0.00,
        contact_person?.trim() || null,
        contact_email?.trim() || null,
        contact_phone?.trim() || null,
        eventImage,
        status || 'upcoming',
        req.user!.id,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Alumni event created successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAlumniEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      event_title,
      event_description,
      event_date,
      event_time,
      event_end_date,
      event_end_time,
      event_venue,
      event_address,
      event_type,
      registration_required,
      registration_deadline,
      max_participants,
      registration_fee,
      contact_person,
      contact_email,
      contact_phone,
      status,
    } = req.body;
    const db = getDatabase();

    if (!event_title || !event_date) {
      throw createError('Event title and date are required', 400);
    }

    // Get existing event to check for image
    const [existing] = await db.execute(
      'SELECT event_image FROM alumni_events WHERE id = ?',
      [id]
    ) as any[];

    if (existing.length === 0) {
      throw createError('Event not found', 404);
    }

    let eventImage = existing[0].event_image;
    if (req.file) {
      // Delete old image if exists
      if (eventImage) {
        const oldImagePath = path.join(__dirname, '../../', eventImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      eventImage = `/uploads/alumni/events/${req.file.filename}`;
    }

    await db.execute(
      `UPDATE alumni_events SET
       event_title = ?, event_description = ?, event_date = ?, event_time = ?, event_end_date = ?, event_end_time = ?,
       event_venue = ?, event_address = ?, event_type = ?, registration_required = ?, registration_deadline = ?,
       max_participants = ?, registration_fee = ?, contact_person = ?, contact_email = ?, contact_phone = ?,
       event_image = ?, status = ?
       WHERE id = ?`,
      [
        event_title.trim(),
        event_description?.trim() || null,
        event_date,
        event_time || null,
        event_end_date || null,
        event_end_time || null,
        event_venue?.trim() || null,
        event_address?.trim() || null,
        event_type || 'reunion',
        registration_required || false,
        registration_deadline || null,
        max_participants || null,
        registration_fee || 0.00,
        contact_person?.trim() || null,
        contact_email?.trim() || null,
        contact_phone?.trim() || null,
        eventImage,
        status || 'upcoming',
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Alumni event updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAlumniEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Get event image to delete file
    const [event] = await db.execute(
      'SELECT event_image FROM alumni_events WHERE id = ?',
      [id]
    ) as any[];

    if (event.length > 0 && event[0].event_image) {
      const imagePath = path.join(__dirname, '../../', event[0].event_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.execute('DELETE FROM alumni_events WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Alumni event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Event Registrations ==========

export const getEventRegistrations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { event_id, alumni_id, attendance_status, payment_status } = req.query;
    const db = getDatabase();

    let query = `
      SELECT aer.*,
             a.first_name, a.last_name, a.email, a.phone, a.photo,
             ae.event_title
      FROM alumni_event_registrations aer
      LEFT JOIN alumni a ON aer.alumni_id = a.id
      LEFT JOIN alumni_events ae ON aer.event_id = ae.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (event_id) {
      query += ' AND aer.event_id = ?';
      params.push(event_id);
    }

    if (alumni_id) {
      query += ' AND aer.alumni_id = ?';
      params.push(alumni_id);
    }

    if (attendance_status) {
      query += ' AND aer.attendance_status = ?';
      params.push(attendance_status);
    }

    if (payment_status) {
      query += ' AND aer.payment_status = ?';
      params.push(payment_status);
    }

    query += ' ORDER BY aer.registration_date DESC';

    const [registrations] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    next(error);
  }
};

export const registerForEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { event_id, alumni_id, special_requirements, notes } = req.body;
    const db = getDatabase();

    if (!event_id || !alumni_id) {
      throw createError('Event ID and Alumni ID are required', 400);
    }

    // Check if event exists and get registration fee
    const [events] = await db.execute(
      'SELECT registration_fee, max_participants, registration_deadline FROM alumni_events WHERE id = ?',
      [event_id]
    ) as any[];

    if (events.length === 0) {
      throw createError('Event not found', 404);
    }

    const event = events[0];

    // Check registration deadline
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      throw createError('Registration deadline has passed', 400);
    }

    // Check max participants
    if (event.max_participants) {
      const [count] = await db.execute(
        'SELECT COUNT(*) as count FROM alumni_event_registrations WHERE event_id = ? AND attendance_status != "cancelled"',
        [event_id]
      ) as any[];
      if (count[0].count >= event.max_participants) {
        throw createError('Event is full', 400);
      }
    }

    // Check if already registered
    const [existing] = await db.execute(
      'SELECT id FROM alumni_event_registrations WHERE event_id = ? AND alumni_id = ?',
      [event_id, alumni_id]
    ) as any[];

    if (existing.length > 0) {
      throw createError('Already registered for this event', 400);
    }

    const paymentStatus = event.registration_fee > 0 ? 'pending' : 'free';

    const [result] = await db.execute(
      `INSERT INTO alumni_event_registrations (
        event_id, alumni_id, payment_status, payment_amount,
        special_requirements, notes
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        event_id,
        alumni_id,
        paymentStatus,
        event.registration_fee || 0.00,
        special_requirements?.trim() || null,
        notes?.trim() || null,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Registered for event successfully',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRegistration = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      payment_status,
      payment_amount,
      payment_date,
      attendance_status,
      attendance_marked_at,
      special_requirements,
      notes,
    } = req.body;
    const db = getDatabase();

    await db.execute(
      `UPDATE alumni_event_registrations SET
       payment_status = ?, payment_amount = ?, payment_date = ?,
       attendance_status = ?, attendance_marked_at = ?,
       special_requirements = ?, notes = ?
       WHERE id = ?`,
      [
        payment_status || null,
        payment_amount || null,
        payment_date || null,
        attendance_status || null,
        attendance_status === 'attended' ? new Date() : attendance_marked_at || null,
        special_requirements?.trim() || null,
        notes?.trim() || null,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Registration updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM alumni_event_registrations WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Registration deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

