import { apiClient } from './apiClient';

// ========== Types ==========

export interface StudentListReportItem {
  id: number;
  admission_no: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender: string;
  admission_date?: string;
  status: string;
  class_name?: string;
  section_name?: string;
  category_name?: string;
  house_name?: string;
}

export interface StudentAttendanceReportItem {
  id: number;
  admission_no: string;
  first_name: string;
  last_name?: string;
  class_name?: string;
  section_name?: string;
  present_count: number;
  absent_count: number;
  late_count: number;
  half_day_count: number;
  total_days: number;
  attendance_percentage: number;
}

export interface StudentExamResultsReportItem {
  student: {
    id: number;
    admission_no: string;
    first_name: string;
    last_name?: string;
    class_name?: string;
    section_name?: string;
  };
  subjects: Array<{
    subject_name: string;
    obtained_marks: number;
    max_marks: number;
    grade?: string;
    remarks?: string;
  }>;
  total_obtained: number;
  total_max: number;
  percentage: string;
}

export interface StudentFeesReportItem {
  id: number;
  admission_no: string;
  first_name: string;
  last_name?: string;
  class_name?: string;
  section_name?: string;
  payment_date: string;
  amount: number;
  payment_method?: string;
  payment_status: string;
  fee_type: string;
  fee_name: string;
  fee_amount: number;
}

export interface StaffListReportItem {
  id: number;
  staff_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender: string;
  joining_date?: string;
  is_active: boolean;
  role_name?: string;
  department_name?: string;
  designation_name?: string;
}

export interface StaffPayrollReportItem {
  id: number;
  staff_id: number;
  first_name: string;
  last_name?: string;
  staff_staff_id: string;
  role_name?: string;
  department_name?: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_status: string;
  payment_date?: string;
}

export interface StaffLeaveReportItem {
  id: number;
  staff_id: number;
  first_name: string;
  last_name?: string;
  staff_staff_id: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: string;
  applied_at: string;
  approved_by_name?: string;
}

export interface FeesCollectionReportItem {
  payment_date: string;
  fee_type: string;
  fee_name: string;
  class_name?: string;
  student_count: number;
  payment_count: number;
  total_amount: number;
}

export interface IncomeReportItem {
  id: number;
  income_date: string;
  income_head: string;
  amount: number;
  invoice_number?: string;
  description?: string;
}

export interface ExpenseReportItem {
  id: number;
  expense_date: string;
  expense_head: string;
  expense_name: string;
  amount: number;
  invoice_number?: string;
  description?: string;
}

export interface FinancialSummaryReport {
  fees_collection: number;
  other_income: number;
  total_income: number;
  total_expenses: number;
  net_profit: number;
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface LibraryBookIssueReportItem {
  id: number;
  issue_date: string;
  due_date: string;
  return_date?: string;
  return_status: string;
  book_title: string;
  author?: string;
  isbn_no?: string;
  member_code: string;
  member_name?: string;
  member_type: string;
}

export interface TransportReportItem {
  id: number;
  student_id: number;
  admission_no: string;
  first_name: string;
  last_name?: string;
  class_name?: string;
  section_name?: string;
  route_name: string;
  fare: number;
  vehicle_number: string;
  vehicle_model?: string;
  driver_name?: string;
  driver_phone?: string;
}

export interface InventoryReportItem {
  id: number;
  issue_date: string;
  quantity: number;
  notes?: string;
  item_name: string;
  item_code?: string;
  category_name?: string;
  store_name?: string;
  admission_no?: string;
  student_name?: string;
  staff_id?: string;
  staff_name?: string;
}

export interface AdmissionEnquiryReportItem {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  enquiry_date: string;
  next_follow_up_date?: string;
  status: string;
  source_name?: string;
  reference_name?: string;
  assigned_to_name?: string;
}

// ========== Service Object ==========

export const reportsService = {
  // ========== Student Reports ==========
  async getStudentListReport(params?: {
    class_id?: number;
    section_id?: number;
    status?: string;
    search?: string;
  }): Promise<StudentListReportItem[]> {
    const response = await apiClient.get('/reports/students/list', { params });
    return response.data.data;
  },

  async getStudentAttendanceReport(params: {
    month: number;
    year: number;
    class_id?: number;
    section_id?: number;
    student_id?: number;
  }): Promise<StudentAttendanceReportItem[]> {
    const response = await apiClient.get('/reports/students/attendance', { params });
    return response.data.data;
  },

  async getStudentExamResultsReport(params: {
    exam_id: number;
    class_id?: number;
    section_id?: number;
    student_id?: number;
  }): Promise<StudentExamResultsReportItem[]> {
    const response = await apiClient.get('/reports/students/exam-results', { params });
    return response.data.data;
  },

  async getStudentFeesReport(params?: {
    class_id?: number;
    section_id?: number;
    student_id?: number;
    start_date?: string;
    end_date?: string;
    payment_status?: string;
  }): Promise<{ data: StudentFeesReportItem[]; totals: { total_amount: number } }> {
    const response = await apiClient.get('/reports/students/fees', { params });
    return response.data;
  },

  // ========== Staff Reports ==========
  async getStaffListReport(params?: {
    role_id?: number;
    department_id?: number;
    status?: string;
    search?: string;
  }): Promise<StaffListReportItem[]> {
    const response = await apiClient.get('/reports/staff/list', { params });
    return response.data.data;
  },

  async getStaffPayrollReport(params: {
    month: number;
    year: number;
    staff_id?: number;
    status?: string;
  }): Promise<{
    data: StaffPayrollReportItem[];
    totals: {
      total_basic_salary: number;
      total_allowances: number;
      total_deductions: number;
      total_net_salary: number;
    };
  }> {
    const response = await apiClient.get('/reports/staff/payroll', { params });
    return response.data;
  },

  async getStaffLeaveReport(params?: {
    staff_id?: number;
    leave_type_id?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<StaffLeaveReportItem[]> {
    const response = await apiClient.get('/reports/staff/leaves', { params });
    return response.data.data;
  },

  // ========== Financial Reports ==========
  async getFeesCollectionReport(params?: {
    start_date?: string;
    end_date?: string;
    fee_type?: string;
    class_id?: number;
  }): Promise<{ data: FeesCollectionReportItem[]; grand_total: number }> {
    const response = await apiClient.get('/reports/financial/fees-collection', { params });
    return response.data;
  },

  async getIncomeReport(params?: {
    start_date?: string;
    end_date?: string;
    income_head_id?: number;
  }): Promise<{ data: IncomeReportItem[]; totals: { total_amount: number } }> {
    const response = await apiClient.get('/reports/financial/income', { params });
    return response.data;
  },

  async getExpenseReport(params?: {
    start_date?: string;
    end_date?: string;
    expense_head_id?: number;
  }): Promise<{ data: ExpenseReportItem[]; totals: { total_amount: number } }> {
    const response = await apiClient.get('/reports/financial/expenses', { params });
    return response.data;
  },

  async getFinancialSummaryReport(params: {
    start_date: string;
    end_date: string;
  }): Promise<FinancialSummaryReport> {
    const response = await apiClient.get('/reports/financial/summary', { params });
    return response.data.data;
  },

  // ========== Library Reports ==========
  async getLibraryBookIssueReport(params?: {
    start_date?: string;
    end_date?: string;
    book_id?: number;
    member_id?: number;
    return_status?: string;
  }): Promise<LibraryBookIssueReportItem[]> {
    const response = await apiClient.get('/reports/library/book-issues', { params });
    return response.data.data;
  },

  // ========== Transport Reports ==========
  async getTransportReport(params?: {
    route_id?: number;
    vehicle_id?: number;
  }): Promise<TransportReportItem[]> {
    const response = await apiClient.get('/reports/transport', { params });
    return response.data.data;
  },

  // ========== Inventory Reports ==========
  async getInventoryReport(params?: {
    item_id?: number;
    category_id?: number;
    store_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<InventoryReportItem[]> {
    const response = await apiClient.get('/reports/inventory', { params });
    return response.data.data;
  },

  // ========== Front Office Reports ==========
  async getAdmissionEnquiryReport(params?: {
    start_date?: string;
    end_date?: string;
    source?: number;
    status?: string;
  }): Promise<AdmissionEnquiryReportItem[]> {
    const response = await apiClient.get('/reports/front-office/admission-enquiry', { params });
    return response.data.data;
  },
};

