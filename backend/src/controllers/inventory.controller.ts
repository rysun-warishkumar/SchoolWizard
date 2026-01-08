import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// ========== Item Categories ==========

export const getItemCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const [categories] = await db.execute(
      'SELECT * FROM item_categories ORDER BY name ASC'
    ) as any[];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const createItemCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw createError('Category name is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO item_categories (name, description) VALUES (?, ?)',
      [name.trim(), description?.trim() || null]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Item category created successfully',
      data: { id: result.insertId, name, description },
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Item category with this name already exists', 400);
    }
    next(error);
  }
};

export const updateItemCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      throw createError('Category name is required', 400);
    }

    const db = getDatabase();
    await db.execute(
      'UPDATE item_categories SET name = ?, description = ? WHERE id = ?',
      [name.trim(), description?.trim() || null, id]
    );

    res.json({
      success: true,
      message: 'Item category updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Item category with this name already exists', 400);
    }
    next(error);
  }
};

export const deleteItemCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM item_categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Item category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Item Stores ==========

export const getItemStores = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const [stores] = await db.execute(
      'SELECT * FROM item_stores ORDER BY name ASC'
    ) as any[];

    res.json({
      success: true,
      data: stores,
    });
  } catch (error) {
    next(error);
  }
};

export const createItemStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, stock_code, description } = req.body;

    if (!name || !stock_code) {
      throw createError('Store name and stock code are required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO item_stores (name, stock_code, description) VALUES (?, ?, ?)',
      [name.trim(), stock_code.trim(), description?.trim() || null]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Item store created successfully',
      data: { id: result.insertId, name, stock_code, description },
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Item store with this stock code already exists', 400);
    }
    next(error);
  }
};

export const updateItemStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, stock_code, description } = req.body;

    if (!name || !stock_code) {
      throw createError('Store name and stock code are required', 400);
    }

    const db = getDatabase();
    await db.execute(
      'UPDATE item_stores SET name = ?, stock_code = ?, description = ? WHERE id = ?',
      [name.trim(), stock_code.trim(), description?.trim() || null, id]
    );

    res.json({
      success: true,
      message: 'Item store updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createError('Item store with this stock code already exists', 400);
    }
    next(error);
  }
};

export const deleteItemStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM item_stores WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Item store deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Item Suppliers ==========

export const getItemSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const [suppliers] = await db.execute(
      'SELECT * FROM item_suppliers ORDER BY name ASC'
    ) as any[];

    res.json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};

export const createItemSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      phone,
      email,
      address,
      contact_person_name,
      contact_person_phone,
      contact_person_email,
      description,
    } = req.body;

    if (!name) {
      throw createError('Supplier name is required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      `INSERT INTO item_suppliers 
       (name, phone, email, address, contact_person_name, contact_person_phone, contact_person_email, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
        contact_person_name?.trim() || null,
        contact_person_phone?.trim() || null,
        contact_person_email?.trim() || null,
        description?.trim() || null,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Item supplier created successfully',
      data: { id: result.insertId, ...req.body },
    });
  } catch (error) {
    next(error);
  }
};

export const updateItemSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      address,
      contact_person_name,
      contact_person_phone,
      contact_person_email,
      description,
    } = req.body;

    if (!name) {
      throw createError('Supplier name is required', 400);
    }

    const db = getDatabase();
    await db.execute(
      `UPDATE item_suppliers 
       SET name = ?, phone = ?, email = ?, address = ?, contact_person_name = ?, 
           contact_person_phone = ?, contact_person_email = ?, description = ?
       WHERE id = ?`,
      [
        name.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
        contact_person_name?.trim() || null,
        contact_person_phone?.trim() || null,
        contact_person_email?.trim() || null,
        description?.trim() || null,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Item supplier updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteItemSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM item_suppliers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Item supplier deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Items ==========

export const getItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { category_id, search } = req.query;

    let query = `
      SELECT i.*, ic.name as category_name
      FROM items i
      LEFT JOIN item_categories ic ON i.category_id = ic.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category_id) {
      query += ' AND i.category_id = ?';
      params.push(category_id);
    }

    if (search) {
      query += ' AND (i.name LIKE ? OR i.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY i.name ASC';

    const [items] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const createItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, category_id, description } = req.body;

    if (!name || !category_id) {
      throw createError('Item name and category are required', 400);
    }

    const db = getDatabase();
    const [result] = await db.execute(
      'INSERT INTO items (name, category_id, description) VALUES (?, ?, ?)',
      [name.trim(), category_id, description?.trim() || null]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: { id: result.insertId, name, category_id, description },
    });
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, category_id, description } = req.body;

    if (!name || !category_id) {
      throw createError('Item name and category are required', 400);
    }

    const db = getDatabase();
    await db.execute(
      'UPDATE items SET name = ?, category_id = ?, description = ? WHERE id = ?',
      [name.trim(), category_id, description?.trim() || null, id]
    );

    res.json({
      success: true,
      message: 'Item updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM items WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Item Stocks ==========

export const getItemStocks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { item_id, category_id, store_id, date_from, date_to } = req.query;

    let query = `
      SELECT ist.*,
             i.name as item_name,
             ic.name as category_name,
             isp.name as supplier_name,
             ist_store.name as store_name,
             u.name as created_by_name
      FROM item_stocks ist
      LEFT JOIN items i ON ist.item_id = i.id
      LEFT JOIN item_categories ic ON ist.category_id = ic.id
      LEFT JOIN item_suppliers isp ON ist.supplier_id = isp.id
      LEFT JOIN item_stores ist_store ON ist.store_id = ist_store.id
      LEFT JOIN users u ON ist.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (item_id) {
      query += ' AND ist.item_id = ?';
      params.push(item_id);
    }

    if (category_id) {
      query += ' AND ist.category_id = ?';
      params.push(category_id);
    }

    if (store_id) {
      query += ' AND ist.store_id = ?';
      params.push(store_id);
    }

    if (date_from) {
      query += ' AND ist.stock_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND ist.stock_date <= ?';
      params.push(date_to);
    }

    query += ' ORDER BY ist.stock_date DESC, ist.created_at DESC';

    const [stocks] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: stocks,
    });
  } catch (error) {
    next(error);
  }
};

export const createItemStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { item_id, category_id, supplier_id, store_id, quantity, stock_date, description } = req.body;

    if (!item_id || !category_id || !store_id || !quantity || !stock_date) {
      throw createError('Item, category, store, quantity, and stock date are required', 400);
    }

    if (quantity <= 0) {
      throw createError('Quantity must be greater than 0', 400);
    }

    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    const [result] = await db.execute(
      `INSERT INTO item_stocks 
       (item_id, category_id, supplier_id, store_id, quantity, stock_date, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item_id,
        category_id,
        supplier_id || null,
        store_id,
        quantity,
        stock_date,
        description?.trim() || null,
        userId || null,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Item stock added successfully',
      data: { id: result.insertId, ...req.body },
    });
  } catch (error) {
    next(error);
  }
};

export const updateItemStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { item_id, category_id, supplier_id, store_id, quantity, stock_date, description } = req.body;

    if (!item_id || !category_id || !store_id || !quantity || !stock_date) {
      throw createError('Item, category, store, quantity, and stock date are required', 400);
    }

    if (quantity <= 0) {
      throw createError('Quantity must be greater than 0', 400);
    }

    const db = getDatabase();
    await db.execute(
      `UPDATE item_stocks 
       SET item_id = ?, category_id = ?, supplier_id = ?, store_id = ?, quantity = ?, stock_date = ?, description = ?
       WHERE id = ?`,
      [
        item_id,
        category_id,
        supplier_id || null,
        store_id,
        quantity,
        stock_date,
        description?.trim() || null,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Item stock updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteItemStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM item_stocks WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Item stock deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Item Issues ==========

export const getItemIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { item_id, category_id, user_type, user_id, status, date_from, date_to } = req.query;

    let query = `
      SELECT ii.*,
             i.name as item_name,
             ic.name as category_name,
             u.name as created_by_name
      FROM item_issues ii
      LEFT JOIN items i ON ii.item_id = i.id
      LEFT JOIN item_categories ic ON ii.category_id = ic.id
      LEFT JOIN users u ON ii.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (item_id) {
      query += ' AND ii.item_id = ?';
      params.push(item_id);
    }

    if (category_id) {
      query += ' AND ii.category_id = ?';
      params.push(category_id);
    }

    if (user_type) {
      query += ' AND ii.user_type = ?';
      params.push(user_type);
    }

    if (user_id) {
      query += ' AND ii.user_id = ?';
      params.push(user_id);
    }

    if (status) {
      query += ' AND ii.status = ?';
      params.push(status);
    }

    if (date_from) {
      query += ' AND ii.issue_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND ii.issue_date <= ?';
      params.push(date_to);
    }

    query += ' ORDER BY ii.issue_date DESC, ii.created_at DESC';

    const [issues] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
};

export const createItemIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { item_id, category_id, user_type, user_id, issue_by, issue_date, return_date, quantity, note } = req.body;

    if (!item_id || !category_id || !user_type || !user_id || !issue_by || !issue_date || !quantity) {
      throw createError('All required fields must be provided', 400);
    }

    if (quantity <= 0) {
      throw createError('Quantity must be greater than 0', 400);
    }

    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    // Check available stock
    const [stocks] = await db.execute(
      `SELECT COALESCE(SUM(ist.quantity), 0) as total_stock,
              COALESCE(SUM(CASE WHEN ii.status = 'issued' THEN ii.quantity ELSE 0 END), 0) as issued_stock
       FROM item_stocks ist
       LEFT JOIN item_issues ii ON ist.item_id = ii.item_id AND ii.status = 'issued'
       WHERE ist.item_id = ?
       GROUP BY ist.item_id`,
      [item_id]
    ) as any[];

    const availableStock = stocks.length > 0 ? stocks[0].total_stock - stocks[0].issued_stock : 0;

    if (availableStock < quantity) {
      throw createError(`Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`, 400);
    }

    const [result] = await db.execute(
      `INSERT INTO item_issues 
       (item_id, category_id, user_type, user_id, issue_by, issue_date, return_date, quantity, note, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item_id,
        category_id,
        user_type,
        user_id,
        issue_by.trim(),
        issue_date,
        return_date || null,
        quantity,
        note?.trim() || null,
        userId || null,
      ]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Item issued successfully',
      data: { id: result.insertId, ...req.body },
    });
  } catch (error: any) {
    if (error.message.includes('Insufficient stock')) {
      throw error;
    }
    next(error);
  }
};

export const returnItemIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if issue exists and is not already returned
    const [issues] = await db.execute(
      'SELECT * FROM item_issues WHERE id = ?',
      [id]
    ) as any[];

    if (issues.length === 0) {
      throw createError('Item issue not found', 404);
    }

    if (issues[0].status === 'returned') {
      throw createError('Item has already been returned', 400);
    }

    await db.execute(
      'UPDATE item_issues SET status = "returned", returned_at = NOW() WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Item returned successfully',
    });
  } catch (error: any) {
    if (error.message.includes('already been returned') || error.message.includes('not found')) {
      throw error;
    }
    next(error);
  }
};

export const deleteItemIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    await db.execute('DELETE FROM item_issues WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Item issue deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Get Available Stock for Item ==========

export const getAvailableStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { item_id } = req.params;
    const db = getDatabase();

    const [stocks] = await db.execute(
      `SELECT 
        COALESCE(SUM(ist.quantity), 0) as total_stock,
        COALESCE(SUM(CASE WHEN ii.status = 'issued' THEN ii.quantity ELSE 0 END), 0) as issued_stock,
        COALESCE(SUM(ist.quantity), 0) - COALESCE(SUM(CASE WHEN ii.status = 'issued' THEN ii.quantity ELSE 0 END), 0) as available_stock
       FROM item_stocks ist
       LEFT JOIN item_issues ii ON ist.item_id = ii.item_id AND ii.status = 'issued'
       WHERE ist.item_id = ?
       GROUP BY ist.item_id`,
      [item_id]
    ) as any[];

    const availableStock = stocks.length > 0 ? stocks[0].available_stock : 0;

    res.json({
      success: true,
      data: {
        item_id: Number(item_id),
        available_stock: availableStock,
      },
    });
  } catch (error) {
    next(error);
  }
};

