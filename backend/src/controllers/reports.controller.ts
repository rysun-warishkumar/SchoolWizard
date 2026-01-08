import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// ========== Student Reports ==========

export const getStudentListReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { class_id, section_id, status, search } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        s.id,
        s.admission_no,
        s.first_name,
        s.last_name,
        s.email,
        s.student_mobile as phone,
        s.date_of_birth,
        s.gender,
        s.admission_date,
        CASE WHEN s.is_active = 1 THEN 'active' ELSE 'inactive' END as status,
        c.name as class_name,
        sec.name as section_name,
        sc.name as category_name,
        sh.name as house_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN student_categories sc ON s.category_id = sc.id
      LEFT JOIN student_houses sh ON s.house_id = sh.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(Number(class_id));
    }

    if (section_id) {
      query += ' AND s.section_id = ?';
      params.push(Number(section_id));
    }

    if (status) {
      if (status === 'active') {
        query += ' AND s.is_active = 1';
      } else if (status === 'inactive') {
        query += ' AND s.is_active = 0';
      }
    }

    if (search) {
      query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_no LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY c.name, sec.name, s.first_name';

    const [students] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: students || [],
    });
  } catch (error: any) {
    console.error('Error in getStudentListReport:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    next(error);
  }
};

export const getStudentAttendanceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { class_id, section_id, month, year, student_id } = req.query;
    const db = getDatabase();

    if (!month || !year) {
      throw createError('Month and year are required', 400);
    }

    let query = `
      SELECT 
        s.id,
        s.admission_no,
        s.first_name,
        s.last_name,
        c.name as class_name,
        sec.name as section_name,
        COUNT(CASE WHEN sa.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN sa.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN sa.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN sa.status = 'half_day' THEN 1 END) as half_day_count,
        COUNT(sa.id) as total_days,
        ROUND(
          (COUNT(CASE WHEN sa.status IN ('present', 'late', 'half_day') THEN 1 END) * 100.0 / 
           NULLIF(COUNT(sa.id), 0)), 2
        ) as attendance_percentage
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN student_attendance sa ON s.id = sa.student_id 
        AND MONTH(sa.attendance_date) = ? 
        AND YEAR(sa.attendance_date) = ?
      WHERE s.status = 'active'
    `;
    const params: any[] = [month, year];

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(class_id);
    }

    if (section_id) {
      query += ' AND s.section_id = ?';
      params.push(section_id);
    }

    if (student_id) {
      query += ' AND s.id = ?';
      params.push(student_id);
    }

    query += ' GROUP BY s.id, s.admission_no, s.first_name, s.last_name, c.name, sec.name ORDER BY c.name, sec.name, s.first_name';

    const [report] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentExamResultsReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { exam_id, class_id, section_id, student_id } = req.query;
    const db = getDatabase();

    if (!exam_id) {
      throw createError('Exam ID is required', 400);
    }

    let query = `
      SELECT 
        s.id,
        s.admission_no,
        s.first_name,
        s.last_name,
        c.name as class_name,
        sec.name as section_name,
        sub.name as subject_name,
        em.obtained_marks,
        em.max_marks,
        em.grade,
        em.remarks
      FROM exam_marks em
      INNER JOIN students s ON em.student_id = s.id
      INNER JOIN classes c ON s.class_id = c.id
      INNER JOIN sections sec ON s.section_id = sec.id
      INNER JOIN subjects sub ON em.subject_id = sub.id
      WHERE em.exam_id = ?
    `;
    const params: any[] = [exam_id];

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(class_id);
    }

    if (section_id) {
      query += ' AND s.section_id = ?';
      params.push(section_id);
    }

    if (student_id) {
      query += ' AND s.id = ?';
      params.push(student_id);
    }

    query += ' ORDER BY c.name, sec.name, s.first_name, sub.name';

    const [results] = await db.execute(query, params) as any[];

    // Calculate totals and percentages
    const studentResults: any = {};
    results.forEach((row: any) => {
      const key = `${row.id}_${row.admission_no}`;
      if (!studentResults[key]) {
        studentResults[key] = {
          student: {
            id: row.id,
            admission_no: row.admission_no,
            first_name: row.first_name,
            last_name: row.last_name,
            class_name: row.class_name,
            section_name: row.section_name,
          },
          subjects: [],
          total_obtained: 0,
          total_max: 0,
        };
      }
      studentResults[key].subjects.push({
        subject_name: row.subject_name,
        obtained_marks: row.obtained_marks,
        max_marks: row.max_marks,
        grade: row.grade,
        remarks: row.remarks,
      });
      studentResults[key].total_obtained += parseFloat(row.obtained_marks) || 0;
      studentResults[key].total_max += parseFloat(row.max_marks) || 0;
    });

    const report = Object.values(studentResults).map((result: any) => ({
      ...result,
      percentage: result.total_max > 0 ? ((result.total_obtained / result.total_max) * 100).toFixed(2) : 0,
    }));

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentFeesReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { class_id, section_id, student_id, start_date, end_date, payment_status } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        s.id,
        s.admission_no,
        s.first_name,
        s.last_name,
        c.name as class_name,
        sec.name as section_name,
        fp.payment_date,
        fp.amount,
        fp.payment_method,
        fp.payment_status,
        fm.fee_type,
        fm.fee_name,
        fm.amount as fee_amount
      FROM fee_payments fp
      INNER JOIN students s ON fp.student_id = s.id
      INNER JOIN classes c ON s.class_id = c.id
      INNER JOIN sections sec ON s.section_id = sec.id
      INNER JOIN fee_master fm ON fp.fee_master_id = fm.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(class_id);
    }

    if (section_id) {
      query += ' AND s.section_id = ?';
      params.push(section_id);
    }

    if (student_id) {
      query += ' AND s.id = ?';
      params.push(student_id);
    }

    if (start_date && end_date) {
      query += ' AND fp.payment_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (payment_status) {
      query += ' AND fp.payment_status = ?';
      params.push(payment_status);
    }

    query += ' ORDER BY fp.payment_date DESC, c.name, sec.name, s.first_name';

    const [payments] = await db.execute(query, params) as any[];

    // Calculate totals
    const totals = payments.reduce(
      (acc: any, payment: any) => {
        acc.total_amount += parseFloat(payment.amount) || 0;
        return acc;
      },
      { total_amount: 0 }
    );

    res.json({
      success: true,
      data: payments,
      totals,
    });
  } catch (error) {
    next(error);
  }
};

// ========== Staff Reports ==========

export const getStaffListReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role_id, department_id, status, search } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        s.id,
        s.staff_id,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.date_of_birth,
        s.gender,
        s.date_of_joining as joining_date,
        s.is_active,
        r.name as role_name,
        d.name as department_name,
        des.name as designation_name
      FROM staff s
      LEFT JOIN roles r ON s.role_id = r.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN designations des ON s.designation_id = des.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role_id) {
      query += ' AND s.role_id = ?';
      params.push(Number(role_id));
    }

    if (department_id) {
      query += ' AND s.department_id = ?';
      params.push(Number(department_id));
    }

    if (status !== undefined) {
      query += ' AND s.is_active = ?';
      params.push(status === 'active' ? 1 : 0);
    }

    if (search) {
      query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.staff_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY s.first_name';

    const [staff] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: staff || [],
    });
  } catch (error: any) {
    console.error('Error in getStaffListReport:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    next(error);
  }
};

export const getStaffPayrollReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { staff_id, month, year, status } = req.query;
    const db = getDatabase();

    if (!month || !year) {
      throw createError('Month and year are required', 400);
    }

    let query = `
      SELECT 
        p.id,
        p.staff_id,
        s.first_name,
        s.last_name,
        s.staff_id as staff_staff_id,
        r.name as role_name,
        d.name as department_name,
        p.month,
        p.year,
        p.basic_salary,
        p.total_earnings as allowances,
        p.total_deductions as deductions,
        p.net_salary,
        p.status as payment_status,
        p.payment_date
      FROM payroll p
      INNER JOIN staff s ON p.staff_id = s.id
      LEFT JOIN roles r ON s.role_id = r.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE p.month = ? AND p.year = ?
    `;
    const params: any[] = [Number(month), Number(year)];

    if (staff_id) {
      query += ' AND p.staff_id = ?';
      params.push(Number(staff_id));
    }

    if (status) {
      query += ' AND p.status = ?';
      params.push(String(status));
    }

    query += ' ORDER BY s.first_name';

    const [payroll] = await db.execute(query, params) as any[];

    // Calculate totals
    const totals = payroll.reduce(
      (acc: any, item: any) => {
        acc.total_basic_salary += parseFloat(item.basic_salary) || 0;
        acc.total_allowances += parseFloat(item.allowances) || 0;
        acc.total_deductions += parseFloat(item.deductions) || 0;
        acc.total_net_salary += parseFloat(item.net_salary) || 0;
        return acc;
      },
      {
        total_basic_salary: 0,
        total_allowances: 0,
        total_deductions: 0,
        total_net_salary: 0,
      }
    );

    res.json({
      success: true,
      data: payroll || [],
      totals,
    });
  } catch (error: any) {
    console.error('Error in getStaffPayrollReport:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    next(error);
  }
};

export const getStaffLeaveReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { staff_id, leave_type_id, status, start_date, end_date } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        lr.id,
        lr.staff_id,
        s.first_name,
        s.last_name,
        s.staff_id as staff_staff_id,
        lt.name as leave_type_name,
        lr.leave_date as start_date,
        lr.leave_date as end_date,
        DATEDIFF(lr.leave_date, lr.apply_date) + 1 as total_days,
        lr.reason,
        lr.status,
        lr.apply_date as applied_at,
        u.name as approved_by_name
      FROM leave_requests lr
      INNER JOIN staff s ON lr.staff_id = s.id
      INNER JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users u ON lr.approved_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (staff_id) {
      query += ' AND lr.staff_id = ?';
      params.push(Number(staff_id));
    }

    if (leave_type_id) {
      query += ' AND lr.leave_type_id = ?';
      params.push(Number(leave_type_id));
    }

    if (status) {
      query += ' AND lr.status = ?';
      params.push(String(status));
    }

    if (start_date && end_date) {
      query += ' AND lr.leave_date BETWEEN ? AND ?';
      params.push(String(start_date), String(end_date));
    }

    query += ' ORDER BY lr.apply_date DESC';

    const [leaves] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: leaves || [],
    });
  } catch (error: any) {
    console.error('Error in getStaffLeaveReport:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    next(error);
  }
};

// ========== Financial Reports ==========

export const getFeesCollectionReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start_date, end_date, fee_type, class_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        DATE(fp.payment_date) as payment_date,
        fm.fee_type,
        fm.fee_name,
        c.name as class_name,
        COUNT(DISTINCT fp.student_id) as student_count,
        COUNT(fp.id) as payment_count,
        SUM(fp.amount) as total_amount
      FROM fee_payments fp
      INNER JOIN fee_master fm ON fp.fee_master_id = fm.id
      INNER JOIN students s ON fp.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE fp.payment_status = 'paid'
    `;
    const params: any[] = [];

    if (start_date && end_date) {
      query += ' AND fp.payment_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (fee_type) {
      query += ' AND fm.fee_type = ?';
      params.push(fee_type);
    }

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(class_id);
    }

    query += ' GROUP BY DATE(fp.payment_date), fm.fee_type, fm.fee_name, c.name ORDER BY fp.payment_date DESC';

    const [report] = await db.execute(query, params) as any[];

    // Calculate grand total
    const grandTotal = report.reduce((sum: number, item: any) => sum + parseFloat(item.total_amount || 0), 0);

    res.json({
      success: true,
      data: report,
      grand_total: grandTotal,
    });
  } catch (error) {
    next(error);
  }
};

export const getIncomeReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start_date, end_date, income_head_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        i.id,
        i.income_date,
        ih.income_head,
        i.amount,
        i.invoice_number,
        i.description
      FROM income i
      INNER JOIN income_heads ih ON i.income_head_id = ih.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date && end_date) {
      query += ' AND i.income_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (income_head_id) {
      query += ' AND i.income_head_id = ?';
      params.push(income_head_id);
    }

    query += ' ORDER BY i.income_date DESC';

    const [incomes] = await db.execute(query, params) as any[];

    // Calculate totals
    const totals = incomes.reduce(
      (acc: any, income: any) => {
        acc.total_amount += parseFloat(income.amount) || 0;
        return acc;
      },
      { total_amount: 0 }
    );

    res.json({
      success: true,
      data: incomes,
      totals,
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenseReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start_date, end_date, expense_head_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        e.id,
        e.expense_date,
        eh.expense_head,
        e.expense_name,
        e.amount,
        e.invoice_number,
        e.description
      FROM expenses e
      INNER JOIN expense_heads eh ON e.expense_head_id = eh.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date && end_date) {
      query += ' AND e.expense_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (expense_head_id) {
      query += ' AND e.expense_head_id = ?';
      params.push(expense_head_id);
    }

    query += ' ORDER BY e.expense_date DESC';

    const [expenses] = await db.execute(query, params) as any[];

    // Calculate totals
    const totals = expenses.reduce(
      (acc: any, expense: any) => {
        acc.total_amount += parseFloat(expense.amount) || 0;
        return acc;
      },
      { total_amount: 0 }
    );

    res.json({
      success: true,
      data: expenses,
      totals,
    });
  } catch (error) {
    next(error);
  }
};

export const getFinancialSummaryReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;
    const db = getDatabase();

    if (!start_date || !end_date) {
      throw createError('Start date and end date are required', 400);
    }

    // Fees Collection
    const [feesResult] = await db.execute(
      `SELECT SUM(amount) as total FROM fee_payments 
       WHERE payment_status = 'paid' AND payment_date BETWEEN ? AND ?`,
      [start_date, end_date]
    ) as any[];

    // Income
    const [incomeResult] = await db.execute(
      `SELECT SUM(amount) as total FROM income 
       WHERE income_date BETWEEN ? AND ?`,
      [start_date, end_date]
    ) as any[];

    // Expenses
    const [expenseResult] = await db.execute(
      `SELECT SUM(amount) as total FROM expenses 
       WHERE expense_date BETWEEN ? AND ?`,
      [start_date, end_date]
    ) as any[];

    const feesTotal = parseFloat(feesResult[0]?.total || 0);
    const incomeTotal = parseFloat(incomeResult[0]?.total || 0);
    const expenseTotal = parseFloat(expenseResult[0]?.total || 0);
    const totalIncome = feesTotal + incomeTotal;
    const netProfit = totalIncome - expenseTotal;

    res.json({
      success: true,
      data: {
        fees_collection: feesTotal,
        other_income: incomeTotal,
        total_income: totalIncome,
        total_expenses: expenseTotal,
        net_profit: netProfit,
        period: {
          start_date,
          end_date,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ========== Library Reports ==========

export const getLibraryBookIssueReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start_date, end_date, book_id, member_id, return_status } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        bi.id,
        bi.issue_date,
        bi.due_date,
        bi.return_date,
        bi.return_status,
        b.book_title,
        b.author,
        b.isbn_no,
        lm.member_code,
        CASE 
          WHEN lm.member_type = 'student' THEN CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))
          WHEN lm.member_type = 'staff' THEN CONCAT(st.first_name, ' ', COALESCE(st.last_name, ''))
        END as member_name,
        lm.member_type
      FROM book_issues bi
      INNER JOIN books b ON bi.book_id = b.id
      INNER JOIN library_members lm ON bi.member_id = lm.id
      LEFT JOIN students s ON lm.student_id = s.id
      LEFT JOIN staff st ON lm.staff_id = st.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date && end_date) {
      query += ' AND bi.issue_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (book_id) {
      query += ' AND bi.book_id = ?';
      params.push(book_id);
    }

    if (member_id) {
      query += ' AND bi.member_id = ?';
      params.push(member_id);
    }

    if (return_status) {
      query += ' AND bi.return_status = ?';
      params.push(return_status);
    }

    query += ' ORDER BY bi.issue_date DESC';

    const [issues] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
};

// ========== Transport Reports ==========

export const getTransportReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { route_id, vehicle_id } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        va.id,
        va.student_id,
        s.admission_no,
        s.first_name,
        s.last_name,
        c.name as class_name,
        sec.name as section_name,
        r.route_name,
        r.fare,
        v.vehicle_number,
        v.vehicle_model,
        v.driver_name,
        v.driver_phone
      FROM vehicle_assignments va
      INNER JOIN students s ON va.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      INNER JOIN routes r ON va.route_id = r.id
      INNER JOIN vehicles v ON va.vehicle_id = v.id
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

    query += ' ORDER BY r.route_name, s.first_name';

    const [assignments] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

// ========== Inventory Reports ==========

export const getInventoryReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { item_id, category_id, store_id, start_date, end_date } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        ii.id,
        ii.issue_date,
        ii.quantity,
        ii.notes,
        i.item_name,
        i.item_code,
        ic.category_name,
        ist.store_name,
        s.admission_no,
        CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) as student_name,
        st.staff_id,
        CONCAT(st.first_name, ' ', COALESCE(st.last_name, '')) as staff_name
      FROM item_issues ii
      INNER JOIN items i ON ii.item_id = i.id
      LEFT JOIN item_categories ic ON i.category_id = ic.id
      LEFT JOIN item_stores ist ON i.store_id = ist.id
      LEFT JOIN students s ON ii.student_id = s.id
      LEFT JOIN staff st ON ii.staff_id = st.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (item_id) {
      query += ' AND ii.item_id = ?';
      params.push(item_id);
    }

    if (category_id) {
      query += ' AND i.category_id = ?';
      params.push(category_id);
    }

    if (store_id) {
      query += ' AND i.store_id = ?';
      params.push(store_id);
    }

    if (start_date && end_date) {
      query += ' AND ii.issue_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY ii.issue_date DESC';

    const [issues] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
};

// ========== Admission Enquiry Report ==========

export const getAdmissionEnquiryReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start_date, end_date, source, status } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        ae.id,
        ae.name,
        ae.phone,
        ae.email,
        ae.enquiry_date,
        ae.next_follow_up_date,
        ae.status,
        s.name as source_name,
        r.name as reference_name,
        u.name as assigned_to_name
      FROM admission_enquiries ae
      LEFT JOIN sources s ON ae.source_id = s.id
      LEFT JOIN front_office_references r ON ae.reference_id = r.id
      LEFT JOIN users u ON ae.assigned_to = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date && end_date) {
      query += ' AND ae.enquiry_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (source) {
      query += ' AND ae.source_id = ?';
      params.push(source);
    }

    if (status) {
      query += ' AND ae.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ae.enquiry_date DESC';

    const [enquiries] = await db.execute(query, params) as any[];

    res.json({
      success: true,
      data: enquiries,
    });
  } catch (error) {
    next(error);
  }
};

