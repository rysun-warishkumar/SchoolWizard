import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';

// ========== Setup ==========
export const getPurposes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const [purposes] = await db.execute('SELECT * FROM front_office_purposes ORDER BY name ASC') as any[];
    res.json({ success: true, data: purposes });
  } catch (error) {
    next(error);
  }
};

export const createPurpose = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) throw createError('Purpose name is required', 400);
    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO front_office_purposes (name, description, created_at) VALUES (?, ?, NOW())',
      [name, description || null]
    ) as any[];
    res.status(201).json({ success: true, message: 'Purpose created successfully', data: { id: result.insertId, name, description } });
  } catch (error) {
    next(error);
  }
};

export const getComplainTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const [types] = await db.execute('SELECT * FROM front_office_complain_types ORDER BY name ASC') as any[];
    res.json({ success: true, data: types });
  } catch (error) {
    next(error);
  }
};

export const createComplainType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) throw createError('Complain type name is required', 400);
    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO front_office_complain_types (name, description, created_at) VALUES (?, ?, NOW())',
      [name, description || null]
    ) as any[];
    res.status(201).json({ success: true, message: 'Complain type created successfully', data: { id: result.insertId, name, description } });
  } catch (error) {
    next(error);
  }
};

export const getSources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const [sources] = await db.execute('SELECT * FROM front_office_sources ORDER BY name ASC') as any[];
    res.json({ success: true, data: sources });
  } catch (error) {
    next(error);
  }
};

export const createSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) throw createError('Source name is required', 400);
    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO front_office_sources (name, description, created_at) VALUES (?, ?, NOW())',
      [name, description || null]
    ) as any[];
    res.status(201).json({ success: true, message: 'Source created successfully', data: { id: result.insertId, name, description } });
  } catch (error) {
    next(error);
  }
};

export const getReferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const [references] = await db.execute('SELECT * FROM front_office_references ORDER BY name ASC') as any[];
    res.json({ success: true, data: references });
  } catch (error) {
    next(error);
  }
};

export const createReference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) throw createError('Reference name is required', 400);
    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO front_office_references (name, description, created_at) VALUES (?, ?, NOW())',
      [name, description || null]
    ) as any[];
    res.status(201).json({ success: true, message: 'Reference created successfully', data: { id: result.insertId, name, description } });
  } catch (error) {
    next(error);
  }
};

// ========== Admission Enquiry ==========
export const getAdmissionEnquiries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, source_id, search } = req.query;
    const db = getDatabase();
    let query = `
      SELECT ae.*, 
       c.name as class_name, s.name as source_name, r.name as reference_name,
       u.name as assigned_name
       FROM admission_enquiries ae
       LEFT JOIN classes c ON ae.class_id = c.id
       LEFT JOIN front_office_sources s ON ae.source_id = s.id
       LEFT JOIN front_office_references r ON ae.reference_id = r.id
       LEFT JOIN users u ON ae.assigned_to = u.id
       WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND ae.status = ?';
      params.push(status);
    }
    if (source_id) {
      query += ' AND ae.source_id = ?';
      params.push(source_id);
    }
    if (search) {
      query += ' AND (ae.name LIKE ? OR ae.phone LIKE ? OR ae.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY ae.enquiry_date DESC, ae.next_follow_up_date ASC';

    const [enquiries] = await db.execute(query, params) as any[];

    res.json({ success: true, data: enquiries });
  } catch (error) {
    next(error);
  }
};

export const createAdmissionEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name, phone, email, address, description, note, enquiry_date, next_follow_up_date,
      assigned_to, reference_id, source_id, class_id, number_of_child, status
    } = req.body;

    if (!name || !enquiry_date) {
      throw createError('Name and enquiry date are required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      `INSERT INTO admission_enquiries (
        name, phone, email, address, description, note, enquiry_date, next_follow_up_date,
        assigned_to, reference_id, source_id, class_id, number_of_child, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name, phone || null, email || null, address || null, description || null, note || null,
        enquiry_date, next_follow_up_date || null, assigned_to || null, reference_id || null,
        source_id || null, class_id || null, number_of_child || 1, status || 'pending'
      ]
    ) as any[];

    res.status(201).json({ success: true, message: 'Admission enquiry created successfully', data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

export const updateAdmissionEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const db = getDatabase();

    const allowedFields = [
      'name', 'phone', 'email', 'address', 'description', 'note', 'enquiry_date',
      'next_follow_up_date', 'assigned_to', 'reference_id', 'source_id', 'class_id',
      'number_of_child', 'status'
    ];

    const updateFields: string[] = [];
    const params: any[] = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      throw createError('No fields to update', 400);
    }

    updateFields.push('updated_at = NOW()');
    params.push(id);

    await db.execute(`UPDATE admission_enquiries SET ${updateFields.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Admission enquiry updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteAdmissionEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    await db.execute('DELETE FROM admission_enquiries WHERE id = ?', [id]);
    res.json({ success: true, message: 'Admission enquiry deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addEnquiryFollowUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { follow_up_date, next_follow_up_date, response, note } = req.body;

    if (!follow_up_date) {
      throw createError('Follow up date is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO enquiry_follow_ups (enquiry_id, follow_up_date, next_follow_up_date, response, note, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [id, follow_up_date, next_follow_up_date || null, response || null, note || null]
    ) as any[];

    // Update enquiry next follow up date
    if (next_follow_up_date) {
      await db.execute(
        'UPDATE admission_enquiries SET next_follow_up_date = ? WHERE id = ?',
        [next_follow_up_date, id]
      );
    }

    res.status(201).json({ success: true, message: 'Follow up added successfully', data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

// ========== Visitor Book ==========
export const getVisitors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, search } = req.query;
    const db = getDatabase();
    let query = `
      SELECT v.*, p.name as purpose_name
       FROM visitors v
       LEFT JOIN front_office_purposes p ON v.purpose_id = p.id
       WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      query += ' AND v.visit_date = ?';
      params.push(date);
    }
    if (search) {
      query += ' AND (v.name LIKE ? OR v.phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY v.visit_date DESC, v.in_time DESC';

    const [visitors] = await db.execute(query, params) as any[];
    res.json({ success: true, data: visitors });
  } catch (error) {
    next(error);
  }
};

export const createVisitor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { purpose_id, name, phone, id_card, number_of_person, visit_date, in_time, out_time, note } = req.body;

    if (!name || !visit_date || !in_time) {
      throw createError('Name, visit date, and in time are required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      `INSERT INTO visitors (
        purpose_id, name, phone, id_card, number_of_person, visit_date, in_time, out_time, note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        purpose_id || null, name, phone || null, id_card || null, number_of_person || 1,
        visit_date, in_time, out_time || null, note || null
      ]
    ) as any[];

    res.status(201).json({ success: true, message: 'Visitor recorded successfully', data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

export const updateVisitor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { out_time } = req.body;
    const db = getDatabase();

    await db.execute('UPDATE visitors SET out_time = ? WHERE id = ?', [out_time, id]);

    res.json({ success: true, message: 'Visitor updated successfully' });
  } catch (error) {
    next(error);
  }
};

// ========== Phone Call Log ==========
export const getPhoneCallLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, call_type, search } = req.query;
    const db = getDatabase();
    let query = 'SELECT * FROM phone_call_logs WHERE 1=1';
    const params: any[] = [];

    if (date) {
      query += ' AND call_date = ?';
      params.push(date);
    }
    if (call_type) {
      query += ' AND call_type = ?';
      params.push(call_type);
    }
    if (search) {
      query += ' AND (name LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY call_date DESC, call_time DESC';

    const [logs] = await db.execute(query, params) as any[];
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

export const createPhoneCallLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, phone, call_date, call_time, description, next_follow_up_date, call_duration, note, call_type } = req.body;

    if (!name || !phone || !call_date) {
      throw createError('Name, phone, and call date are required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      `INSERT INTO phone_call_logs (
        name, phone, call_date, call_time, description, next_follow_up_date, call_duration, note, call_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name, phone, call_date, call_time || null, description || null,
        next_follow_up_date || null, call_duration || null, note || null, call_type || 'incoming'
      ]
    ) as any[];

    res.status(201).json({ success: true, message: 'Phone call logged successfully', data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

// ========== Postal Dispatch ==========
export const getPostalDispatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, search } = req.query;
    const db = getDatabase();
    let query = 'SELECT * FROM postal_dispatch WHERE 1=1';
    const params: any[] = [];

    if (date) {
      query += ' AND dispatch_date = ?';
      params.push(date);
    }
    if (search) {
      query += ' AND (to_title LIKE ? OR reference_no LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY dispatch_date DESC';

    const [dispatch] = await db.execute(query, params) as any[];
    res.json({ success: true, data: dispatch });
  } catch (error) {
    next(error);
  }
};

export const createPostalDispatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { to_title, reference_no, address, note, from_title, dispatch_date } = req.body;

    if (!to_title || !dispatch_date) {
      throw createError('To title and dispatch date are required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      `INSERT INTO postal_dispatch (
        to_title, reference_no, address, note, from_title, dispatch_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [to_title, reference_no || null, address || null, note || null, from_title || null, dispatch_date]
    ) as any[];

    res.status(201).json({ success: true, message: 'Postal dispatch recorded successfully', data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

// ========== Postal Receive ==========
export const getPostalReceive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, search } = req.query;
    const db = getDatabase();
    let query = 'SELECT * FROM postal_receive WHERE 1=1';
    const params: any[] = [];

    if (date) {
      query += ' AND receive_date = ?';
      params.push(date);
    }
    if (search) {
      query += ' AND (from_title LIKE ? OR reference_no LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY receive_date DESC';

    const [receive] = await db.execute(query, params) as any[];
    res.json({ success: true, data: receive });
  } catch (error) {
    next(error);
  }
};

export const createPostalReceive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from_title, reference_no, address, note, to_title, receive_date } = req.body;

    if (!from_title || !receive_date) {
      throw createError('From title and receive date are required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      `INSERT INTO postal_receive (
        from_title, reference_no, address, note, to_title, receive_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [from_title, reference_no || null, address || null, note || null, to_title || null, receive_date]
    ) as any[];

    res.status(201).json({ success: true, message: 'Postal receive recorded successfully', data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

// ========== Complain ==========
export const getComplains = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, complain_type_id, source_id, search } = req.query;
    const db = getDatabase();
    let query = `
      SELECT c.*, 
       ct.name as complain_type_name, s.name as source_name,
       u.name as assigned_name
       FROM complains c
       LEFT JOIN front_office_complain_types ct ON c.complain_type_id = ct.id
       LEFT JOIN front_office_sources s ON c.source_id = s.id
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    if (complain_type_id) {
      query += ' AND c.complain_type_id = ?';
      params.push(complain_type_id);
    }
    if (source_id) {
      query += ' AND c.source_id = ?';
      params.push(source_id);
    }
    if (search) {
      query += ' AND (c.complain_by LIKE ? OR c.phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY c.complain_date DESC';

    const [complains] = await db.execute(query, params) as any[];
    res.json({ success: true, data: complains });
  } catch (error) {
    next(error);
  }
};

export const createComplain = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      complain_type_id, source_id, complain_by, phone, complain_date, description,
      action_taken, assigned_to, note, status
    } = req.body;

    if (!complain_by || !complain_date || !description) {
      throw createError('Complain by, date, and description are required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      `INSERT INTO complains (
        complain_type_id, source_id, complain_by, phone, complain_date, description,
        action_taken, assigned_to, note, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        complain_type_id || null, source_id || null, complain_by, phone || null,
        complain_date, description, action_taken || null, assigned_to || null,
        note || null, status || 'pending'
      ]
    ) as any[];

    res.status(201).json({ success: true, message: 'Complain recorded successfully', data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

export const updateComplain = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const db = getDatabase();

    const allowedFields = [
      'complain_type_id', 'source_id', 'complain_by', 'phone', 'complain_date',
      'description', 'action_taken', 'assigned_to', 'note', 'status'
    ];

    const updateFields: string[] = [];
    const params: any[] = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      throw createError('No fields to update', 400);
    }

    updateFields.push('updated_at = NOW()');
    params.push(id);

    await db.execute(`UPDATE complains SET ${updateFields.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Complain updated successfully' });
  } catch (error) {
    next(error);
  }
};

