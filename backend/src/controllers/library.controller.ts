import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// ========== Books ==========

export const getBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { search, subject_id, available_only } = req.query;

    let query = `
      SELECT b.*,
             s.name as subject_name
      FROM books b
      LEFT JOIN subjects s ON b.subject_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ' AND (b.book_title LIKE ? OR b.book_no LIKE ? OR b.isbn_no LIKE ? OR b.author LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (subject_id) {
      query += ' AND b.subject_id = ?';
      params.push(subject_id);
    }

    if (available_only === 'true') {
      query += ' AND b.available_qty > 0';
    }

    query += ' ORDER BY b.book_title ASC';

    const [books] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const [books] = await db.execute(
      `SELECT b.*,
              s.name as subject_name
       FROM books b
       LEFT JOIN subjects s ON b.subject_id = s.id
       WHERE b.id = ?`,
      [id]
    ) as any[];

    if (books.length === 0) {
      throw createError('Book not found', 404);
    }

    res.json({
      success: true,
      data: books[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      book_title,
      book_no,
      isbn_no,
      publisher,
      author,
      subject_id,
      rack_no,
      qty,
      book_price,
      inward_date,
      description,
    } = req.body;

    if (!book_title || !qty) {
      throw createError('Book title and quantity are required', 400);
    }

    const db = getDatabase();

    // Set available_qty equal to qty for new books
    const available_qty = qty;

    await db.execute(
      `INSERT INTO books
       (book_title, book_no, isbn_no, publisher, author, subject_id, rack_no, qty, available_qty, book_price, inward_date, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        book_title.trim(),
        book_no?.trim() || null,
        isbn_no?.trim() || null,
        publisher?.trim() || null,
        author?.trim() || null,
        subject_id || null,
        rack_no?.trim() || null,
        qty,
        available_qty,
        book_price || null,
        inward_date || null,
        description?.trim() || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      next(createError('Book number or ISBN already exists', 409));
    } else {
      next(error);
    }
  }
};

export const updateBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      book_title,
      book_no,
      isbn_no,
      publisher,
      author,
      subject_id,
      rack_no,
      qty,
      book_price,
      inward_date,
      description,
    } = req.body;

    if (!book_title || !qty) {
      throw createError('Book title and quantity are required', 400);
    }

    const db = getDatabase();

    // Get current book to calculate available_qty
    const [currentBook] = await db.execute('SELECT qty, available_qty FROM books WHERE id = ?', [id]) as any[];

    if (currentBook.length === 0) {
      throw createError('Book not found', 404);
    }

    const oldQty = currentBook[0].qty;
    const oldAvailableQty = currentBook[0].available_qty;
    const qtyDifference = qty - oldQty;
    const newAvailableQty = Math.max(0, oldAvailableQty + qtyDifference);

    await db.execute(
      `UPDATE books
       SET book_title = ?, book_no = ?, isbn_no = ?, publisher = ?, author = ?, subject_id = ?,
           rack_no = ?, qty = ?, available_qty = ?, book_price = ?, inward_date = ?, description = ?
       WHERE id = ?`,
      [
        book_title.trim(),
        book_no?.trim() || null,
        isbn_no?.trim() || null,
        publisher?.trim() || null,
        author?.trim() || null,
        subject_id || null,
        rack_no?.trim() || null,
        qty,
        newAvailableQty,
        book_price || null,
        inward_date || null,
        description?.trim() || null,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Book updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      next(createError('Book number or ISBN already exists', 409));
    } else {
      next(error);
    }
  }
};

export const deleteBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if book has any active issues
    const [issues] = await db.execute(
      'SELECT COUNT(*) as count FROM book_issues WHERE book_id = ? AND return_status = "issued"',
      [id]
    ) as any[];

    if (issues[0].count > 0) {
      throw createError('Cannot delete book with active issues. Please return all issued books first.', 400);
    }

    await db.execute('DELETE FROM books WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Library Members ==========

export const getLibraryMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { member_type, search } = req.query;

    let query = `
      SELECT lm.*,
             CASE 
               WHEN lm.member_type = 'student' THEN CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))
               WHEN lm.member_type = 'staff' THEN CONCAT(st.first_name, ' ', COALESCE(st.last_name, ''))
             END as member_name,
             CASE 
               WHEN lm.member_type = 'student' THEN s.admission_no
               WHEN lm.member_type = 'staff' THEN st.staff_id
             END as member_code_display,
             CASE 
               WHEN lm.member_type = 'student' THEN s.roll_no
               ELSE NULL
             END as roll_no,
             CASE 
               WHEN lm.member_type = 'student' THEN c.name
               ELSE NULL
             END as class_name,
             CASE 
               WHEN lm.member_type = 'student' THEN sec.name
               ELSE NULL
             END as section_name
      FROM library_members lm
      LEFT JOIN students s ON lm.student_id = s.id
      LEFT JOIN staff st ON lm.staff_id = st.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (member_type) {
      query += ' AND lm.member_type = ?';
      params.push(member_type);
    }

    if (search) {
      query += ` AND (
        (lm.member_type = 'student' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_no LIKE ?))
        OR (lm.member_type = 'staff' AND (st.first_name LIKE ? OR st.last_name LIKE ? OR st.staff_id LIKE ?))
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY lm.joined_date DESC';

    const [members] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

export const addStudentMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { student_id } = req.body;

    if (!student_id) {
      throw createError('Student ID is required', 400);
    }

    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    // Check if student already exists as member
    const [existing] = await db.execute(
      'SELECT id FROM library_members WHERE student_id = ?',
      [student_id]
    ) as any[];

    if (existing.length > 0) {
      throw createError('Student is already a library member', 409);
    }

    // Generate member code
    const [student] = await db.execute('SELECT admission_no FROM students WHERE id = ?', [student_id]) as any[];
    if (student.length === 0) {
      throw createError('Student not found', 404);
    }

    const memberCode = `STU-${student[0].admission_no}`;

    await db.execute(
      `INSERT INTO library_members (member_type, student_id, member_code, joined_date, status)
       VALUES ('student', ?, ?, CURDATE(), 'active')`,
      [student_id, memberCode]
    );

    res.status(201).json({
      success: true,
      message: 'Student added as library member successfully',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      next(createError('Student is already a library member', 409));
    } else {
      next(error);
    }
  }
};

export const addStaffMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { staff_id } = req.body;

    if (!staff_id) {
      throw createError('Staff ID is required', 400);
    }

    const db = getDatabase();

    // Check if staff already exists as member
    const [existing] = await db.execute(
      'SELECT id FROM library_members WHERE staff_id = ?',
      [staff_id]
    ) as any[];

    if (existing.length > 0) {
      throw createError('Staff is already a library member', 409);
    }

    // Generate member code
    const [staff] = await db.execute('SELECT staff_id FROM staff WHERE id = ?', [staff_id]) as any[];
    if (staff.length === 0) {
      throw createError('Staff not found', 404);
    }

    const memberCode = `STAFF-${staff[0].staff_id}`;

    await db.execute(
      `INSERT INTO library_members (member_type, staff_id, member_code, joined_date, status)
       VALUES ('staff', ?, ?, CURDATE(), 'active')`,
      [staff_id, memberCode]
    );

    res.status(201).json({
      success: true,
      message: 'Staff added as library member successfully',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      next(createError('Staff is already a library member', 409));
    } else {
      next(error);
    }
  }
};

export const removeLibraryMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if member has any active issues
    const [issues] = await db.execute(
      'SELECT COUNT(*) as count FROM book_issues WHERE member_id = ? AND return_status = "issued"',
      [id]
    ) as any[];

    if (issues[0].count > 0) {
      throw createError('Cannot remove member with active book issues. Please return all books first.', 400);
    }

    await db.execute('DELETE FROM library_members WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Library member removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ========== Book Issues ==========

export const getBookIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDatabase();
    const { member_id, book_id, return_status, search } = req.query;

    let query = `
      SELECT bi.*,
             b.book_title, b.book_no, b.isbn_no, b.author,
             lm.member_type, lm.member_code,
             CASE 
               WHEN lm.member_type = 'student' THEN CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))
               WHEN lm.member_type = 'staff' THEN CONCAT(st.first_name, ' ', COALESCE(st.last_name, ''))
             END as member_name,
             CASE 
               WHEN lm.member_type = 'student' THEN s.admission_no
               WHEN lm.member_type = 'staff' THEN st.staff_id
             END as member_code_display,
             u1.name as issued_by_name,
             u2.name as returned_by_name
      FROM book_issues bi
      INNER JOIN books b ON bi.book_id = b.id
      INNER JOIN library_members lm ON bi.member_id = lm.id
      LEFT JOIN students s ON lm.student_id = s.id
      LEFT JOIN staff st ON lm.staff_id = st.id
      LEFT JOIN users u1 ON bi.issued_by = u1.id
      LEFT JOIN users u2 ON bi.returned_by = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (member_id) {
      query += ' AND bi.member_id = ?';
      params.push(member_id);
    }

    if (book_id) {
      query += ' AND bi.book_id = ?';
      params.push(book_id);
    }

    if (return_status) {
      query += ' AND bi.return_status = ?';
      params.push(return_status);
    }

    if (search) {
      query += ` AND (
        b.book_title LIKE ? OR b.book_no LIKE ? OR
        (lm.member_type = 'student' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_no LIKE ?))
        OR (lm.member_type = 'staff' AND (st.first_name LIKE ? OR st.last_name LIKE ? OR st.staff_id LIKE ?))
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY bi.issue_date DESC, bi.created_at DESC';

    const [issues] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
};

export const issueBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { book_id, member_id, issue_date, due_date } = req.body;

    if (!book_id || !member_id || !issue_date || !due_date) {
      throw createError('Book ID, member ID, issue date, and due date are required', 400);
    }

    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    // Check if book is available
    const [book] = await db.execute('SELECT available_qty FROM books WHERE id = ?', [book_id]) as any[];
    if (book.length === 0) {
      throw createError('Book not found', 404);
    }
    if (book[0].available_qty <= 0) {
      throw createError('Book is not available', 400);
    }

    // Check if member exists
    const [member] = await db.execute('SELECT id FROM library_members WHERE id = ? AND status = "active"', [member_id]) as any[];
    if (member.length === 0) {
      throw createError('Library member not found or inactive', 404);
    }

    // Issue the book
    await db.execute(
      `INSERT INTO book_issues (book_id, member_id, issue_date, due_date, return_status, issued_by)
       VALUES (?, ?, ?, ?, 'issued', ?)`,
      [book_id, member_id, issue_date, due_date, userId || null]
    );

    // Decrease available quantity
    await db.execute(
      'UPDATE books SET available_qty = available_qty - 1 WHERE id = ?',
      [book_id]
    );

    res.status(201).json({
      success: true,
      message: 'Book issued successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const returnBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { return_date, return_status, fine_amount, remarks } = req.body;

    if (!return_date) {
      throw createError('Return date is required', 400);
    }

    const db = getDatabase();
    const userId = (req as AuthRequest).user?.id;

    // Get issue details
    const [issues] = await db.execute(
      'SELECT book_id, return_status FROM book_issues WHERE id = ?',
      [id]
    ) as any[];

    if (issues.length === 0) {
      throw createError('Book issue not found', 404);
    }

    if (issues[0].return_status !== 'issued') {
      throw createError('Book is already returned', 400);
    }

    const bookId = issues[0].book_id;

    // Update issue record
    await db.execute(
      `UPDATE book_issues
       SET return_date = ?, return_status = ?, fine_amount = ?, remarks = ?, returned_by = ?
       WHERE id = ?`,
      [
        return_date,
        return_status || 'returned',
        fine_amount || 0,
        remarks?.trim() || null,
        userId || null,
        id,
      ]
    );

    // Increase available quantity
    await db.execute(
      'UPDATE books SET available_qty = available_qty + 1 WHERE id = ?',
      [bookId]
    );

    res.json({
      success: true,
      message: 'Book returned successfully',
    });
  } catch (error) {
    next(error);
  }
};

