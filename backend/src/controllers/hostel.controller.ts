import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest, getSchoolId } from '../middleware/auth';

// ========== Hostels ==========

export const getHostels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const [hostels] = await db.execute(
      'SELECT * FROM hostels WHERE school_id = ? ORDER BY name ASC',
      [schoolId]
    ) as any[];

    res.json({
      success: true,
      data: hostels,
    });
  } catch (error) {
    next(error);
  }
};

export const createHostel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { name, type, address, intake, description } = req.body;

    if (!name || !type) {
      throw createError('Hostel name and type are required', 400);
    }

    if (intake !== undefined && intake < 0) {
      throw createError('Intake must be a positive number', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO hostels (school_id, name, type, address, intake, description) VALUES (?, ?, ?, ?, ?, ?)',
      [
        schoolId,
        name.trim(),
        type,
        address?.trim() || null,
        intake || 0,
        description?.trim() || null,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Hostel created successfully',
      data: { id: result.insertId, name, type, address, intake, description },
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Hostel with this name already exists', 400);
    }
    next(error);
  }
};

export const updateHostel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const { name, type, address, intake, description } = req.body;

    if (!name || !type) {
      throw createError('Hostel name and type are required', 400);
    }

    if (intake !== undefined && intake < 0) {
      throw createError('Intake must be a positive number', 400);
    }

    const db = getDatabase();
    await db.execute(
      'UPDATE hostels SET name = ?, type = ?, address = ?, intake = ?, description = ? WHERE id = ? AND school_id = ?',
      [
        name.trim(),
        type,
        address?.trim() || null,
        intake || 0,
        description?.trim() || null,
        id,
        schoolId,
      ]
    );

    res.json({
      success: true,
      message: 'Hostel updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Hostel with this name already exists', 400);
    }
    next(error);
  }
};

export const deleteHostel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM hostels WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Hostel deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Room Types ==========

export const getRoomTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const [roomTypes] = await db.execute(
      'SELECT * FROM room_types WHERE school_id = ? ORDER BY name ASC',
      [schoolId]
    ) as any[];

    res.json({
      success: true,
      data: roomTypes,
    });
  } catch (error) {
    next(error);
  }
};

export const createRoomType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { name, description } = req.body;

    if (!name) {
      throw createError('Room type name is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO room_types (school_id, name, description) VALUES (?, ?, ?)',
      [schoolId, name.trim(), description?.trim() || null]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Room type created successfully',
      data: { id: result.insertId, name, description },
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Room type with this name already exists', 400);
    }
    next(error);
  }
};

export const updateRoomType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      throw createError('Room type name is required', 400);
    }

    const db = getDatabase();
    await db.execute(
      'UPDATE room_types SET name = ?, description = ? WHERE id = ? AND school_id = ?',
      [name.trim(), description?.trim() || null, id, schoolId]
    );

    res.json({
      success: true,
      message: 'Room type updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Room type with this name already exists', 400);
    }
    next(error);
  }
};

export const deleteRoomType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM room_types WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Room type deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Hostel Rooms ==========

export const getHostelRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const db = getDatabase();
    const { hostel_id, room_type_id } = req.query;

    let query = `
      SELECT hr.*,
             h.name as hostel_name,
             h.type as hostel_type,
             rt.name as room_type_name
      FROM hostel_rooms hr
      LEFT JOIN hostels h ON hr.hostel_id = h.id AND h.school_id = ?
      LEFT JOIN room_types rt ON hr.room_type_id = rt.id AND rt.school_id = ?
      WHERE hr.school_id = ?
    `;
    const params: any[] = [schoolId, schoolId, schoolId];

    if (hostel_id) {
      query += ' AND hr.hostel_id = ?';
      params.push(hostel_id);
    }

    if (room_type_id) {
      query += ' AND hr.room_type_id = ?';
      params.push(room_type_id);
    }

    query += ' ORDER BY h.name ASC, hr.room_no ASC';

    const [rooms] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

export const createHostelRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { hostel_id, room_type_id, room_no, no_of_bed, cost_per_bed, description } = req.body;

    if (!hostel_id || !room_type_id || !room_no || !no_of_bed || cost_per_bed === undefined) {
      throw createError('Hostel, room type, room number, number of beds, and cost per bed are required', 400);
    }

    if (no_of_bed <= 0) {
      throw createError('Number of beds must be greater than 0', 400);
    }

    if (cost_per_bed < 0) {
      throw createError('Cost per bed must be a positive number', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      `INSERT INTO hostel_rooms (school_id, hostel_id, room_type_id, room_no, no_of_bed, cost_per_bed, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        hostel_id,
        room_type_id,
        room_no.trim(),
        no_of_bed,
        cost_per_bed,
        description?.trim() || null,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Hostel room created successfully',
      data: { id: result.insertId, ...req.body },
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Room with this number already exists in this hostel', 400);
    }
    next(error);
  }
};

export const updateHostelRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const { hostel_id, room_type_id, room_no, no_of_bed, cost_per_bed, description } = req.body;

    if (!hostel_id || !room_type_id || !room_no || !no_of_bed || cost_per_bed === undefined) {
      throw createError('Hostel, room type, room number, number of beds, and cost per bed are required', 400);
    }

    if (no_of_bed <= 0) {
      throw createError('Number of beds must be greater than 0', 400);
    }

    if (cost_per_bed < 0) {
      throw createError('Cost per bed must be a positive number', 400);
    }

    const db = getDatabase();
    await db.execute(
      `UPDATE hostel_rooms 
       SET hostel_id = ?, room_type_id = ?, room_no = ?, no_of_bed = ?, cost_per_bed = ?, description = ?
       WHERE id = ? AND school_id = ?`,
      [
        hostel_id,
        room_type_id,
        room_no.trim(),
        no_of_bed,
        cost_per_bed,
        description?.trim() || null,
        id,
        schoolId,
      ]
    );

    res.json({
      success: true,
      message: 'Hostel room updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Room with this number already exists in this hostel', 400);
    }
    next(error);
  }
};

export const deleteHostelRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = getSchoolId(req as AuthRequest);
    if (schoolId == null) throw createError('School context required', 403);
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM hostel_rooms WHERE id = ? AND school_id = ?', [id, schoolId]);

    res.json({
      success: true,
      message: 'Hostel room deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

