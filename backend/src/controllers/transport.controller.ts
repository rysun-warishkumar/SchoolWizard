import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';

// ========== Routes ==========

export const getRoutes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const [routes] = await db.execute(
      'SELECT * FROM routes ORDER BY title ASC'
    ) as any[];

    res.json({
      success: true,
      data: routes,
    });
  } catch (error) {
    next(error);
  }
};

export const createRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, fare, description } = req.body;

    if (!title) {
      throw createError('Route title is required', 400);
    }

    if (fare === undefined || fare === null || fare < 0) {
      throw createError('Valid fare amount is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO routes (title, fare, description) VALUES (?, ?, ?)',
      [title.trim(), fare || 0, description?.trim() || null]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: { id: result.insertId, title, fare, description },
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Route with this title already exists', 400);
    }
    next(error);
  }
};

export const updateRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, fare, description } = req.body;

    if (!title) {
      throw createError('Route title is required', 400);
    }

    if (fare === undefined || fare === null || fare < 0) {
      throw createError('Valid fare amount is required', 400);
    }

    const db = getDatabase();
    await db.execute(
      'UPDATE routes SET title = ?, fare = ?, description = ? WHERE id = ?',
      [title.trim(), fare || 0, description?.trim() || null, id]
    );

    res.json({
      success: true,
      message: 'Route updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Route with this title already exists', 400);
    }
    next(error);
  }
};

export const deleteRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM routes WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Route deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Vehicles ==========

export const getVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const [vehicles] = await db.execute(
      'SELECT * FROM vehicles ORDER BY vehicle_no ASC'
    ) as any[];

    res.json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
};

export const createVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vehicle_no, vehicle_model, year_made, driver_name, driver_license, driver_contact, note } = req.body;

    if (!vehicle_no) {
      throw createError('Vehicle number is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      `INSERT INTO vehicles (vehicle_no, vehicle_model, year_made, driver_name, driver_license, driver_contact, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicle_no.trim(),
        vehicle_model?.trim() || null,
        year_made || null,
        driver_name?.trim() || null,
        driver_license?.trim() || null,
        driver_contact?.trim() || null,
        note?.trim() || null,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: { id: result.insertId, ...req.body },
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Vehicle with this number already exists', 400);
    }
    next(error);
  }
};

export const updateVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { vehicle_no, vehicle_model, year_made, driver_name, driver_license, driver_contact, note } = req.body;

    if (!vehicle_no) {
      throw createError('Vehicle number is required', 400);
    }

    const db = getDatabase();
    await db.execute(
      `UPDATE vehicles 
       SET vehicle_no = ?, vehicle_model = ?, year_made = ?, driver_name = ?, driver_license = ?, driver_contact = ?, note = ?
       WHERE id = ?`,
      [
        vehicle_no.trim(),
        vehicle_model?.trim() || null,
        year_made || null,
        driver_name?.trim() || null,
        driver_license?.trim() || null,
        driver_contact?.trim() || null,
        note?.trim() || null,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Vehicle with this number already exists', 400);
    }
    next(error);
  }
};

export const deleteVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM vehicles WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Vehicle Assignments ==========

export const getVehicleAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { route_id, vehicle_id } = req.query;

    let query = `
      SELECT va.*,
             r.title as route_title,
             r.fare as route_fare,
             v.vehicle_no,
             v.vehicle_model,
             v.driver_name
      FROM vehicle_assignments va
      LEFT JOIN routes r ON va.route_id = r.id
      LEFT JOIN vehicles v ON va.vehicle_id = v.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (route_id) {
      query += ' AND va.route_id = ?';
      params.push(route_id);
    }

    if (vehicle_id) {
      query += ' AND va.vehicle_id = ?';
      params.push(vehicle_id);
    }

    query += ' ORDER BY r.title ASC, v.vehicle_no ASC';

    const [assignments] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

export const createVehicleAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { route_id, vehicle_id } = req.body;

    if (!route_id || !vehicle_id) {
      throw createError('Route and vehicle are required', 400);
    }

    const db = getDatabase();

    // Check if assignment already exists
    const [existing] = await db.execute(
      'SELECT id FROM vehicle_assignments WHERE route_id = ? AND vehicle_id = ?',
      [route_id, vehicle_id]
    ) as any[];

    if (existing.length > 0) {
      throw createError('This vehicle is already assigned to this route', 400);
    }

    const [result] = await db.execute(
      'INSERT INTO vehicle_assignments (route_id, vehicle_id) VALUES (?, ?)',
      [route_id, vehicle_id]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Vehicle assigned to route successfully',
      data: { id: result.insertId, route_id, vehicle_id },
    });
  } catch (error: any) {
    if (error.message.includes('already assigned')) {
      throw error;
    }
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('This vehicle is already assigned to this route', 400);
    }
    next(error);
  }
};

export const deleteVehicleAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM vehicle_assignments WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Vehicle assignment removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

