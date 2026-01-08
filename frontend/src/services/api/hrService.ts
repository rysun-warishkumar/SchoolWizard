import { apiClient } from './apiClient';

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface Designation {
  id: number;
  name: string;
  description?: string;
}

export interface LeaveType {
  id: number;
  name: string;
  description?: string;
  max_days?: number;
  is_paid: boolean;
}

export interface Staff {
  id: number;
  staff_id: string;
  user_id?: number;
  role_id: number;
  designation_id?: number;
  department_id?: number;
  first_name: string;
  last_name?: string;
  father_name?: string;
  mother_name?: string;
  gender: 'male' | 'female' | 'other';
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  date_of_birth?: string;
  date_of_joining: string;
  phone?: string;
  emergency_contact?: string;
  email?: string;
  photo?: string;
  current_address?: string;
  permanent_address?: string;
  qualification?: string;
  work_experience?: string;
  note?: string;
  epf_no?: string;
  basic_salary?: number;
  contract_type?: 'permanent' | 'contract' | 'temporary' | 'probation';
  work_shift?: 'morning' | 'evening' | 'night' | 'flexible';
  location?: string;
  number_of_leaves?: number;
  bank_account_title?: string;
  bank_account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
  bank_branch_name?: string;
  facebook_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  is_active: boolean;
  leaving_date?: string;
  resignation_letter?: string;
  role_name?: string;
  department_name?: string;
  designation_name?: string;
  documents?: any[];
}

export const hrService = {
  // Departments
  async getDepartments(): Promise<{ success: boolean; data: Department[] }> {
    const response = await apiClient.get<{ success: boolean; data: Department[] }>('/hr/departments');
    return response.data;
  },

  async createDepartment(data: { name: string; description?: string }): Promise<{ success: boolean; message: string; data: Department }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: Department }>('/hr/departments', data);
    return response.data;
  },

  // Designations
  async getDesignations(): Promise<{ success: boolean; data: Designation[] }> {
    const response = await apiClient.get<{ success: boolean; data: Designation[] }>('/hr/designations');
    return response.data;
  },

  async createDesignation(data: { name: string; description?: string }): Promise<{ success: boolean; message: string; data: Designation }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: Designation }>('/hr/designations', data);
    return response.data;
  },

  // Leave Types
  async getLeaveTypes(): Promise<{ success: boolean; data: LeaveType[] }> {
    const response = await apiClient.get<{ success: boolean; data: LeaveType[] }>('/hr/leave-types');
    return response.data;
  },

  async createLeaveType(data: { name: string; description?: string; max_days?: number; is_paid?: boolean }): Promise<{ success: boolean; message: string; data: LeaveType }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: LeaveType }>('/hr/leave-types', data);
    return response.data;
  },

  // Staff
  async getStaff(params?: {
    role_id?: number;
    department_id?: number;
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: Staff[]; pagination: any }> {
    const response = await apiClient.get<{ success: boolean; data: Staff[]; pagination: any }>('/hr/staff', { 
      params: {
        ...params,
        is_active: params?.is_active !== undefined ? (params.is_active ? '1' : '0') : undefined,
      }
    });
    return response.data;
  },

  async getStaffById(id: string): Promise<{ success: boolean; data: Staff }> {
    const response = await apiClient.get<{ success: boolean; data: Staff }>(`/hr/staff/${id}`);
    return response.data;
  },

  async getMyStaffProfile(): Promise<{ success: boolean; data: Staff }> {
    const response = await apiClient.get<{ success: boolean; data: Staff }>('/hr/staff/my-profile');
    return response.data;
  },

  async getMyClasses(): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/hr/staff/my-classes');
    return response.data;
  },

  async getMyStudents(params?: { class_id?: number; section_id?: number }): Promise<{ success: boolean; data: any[] }> {
    const queryParams = new URLSearchParams();
    if (params?.class_id) queryParams.append('class_id', String(params.class_id));
    if (params?.section_id) queryParams.append('section_id', String(params.section_id));
    const queryString = queryParams.toString();
    const url = `/hr/staff/my-students${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get<{ success: boolean; data: any[] }>(url);
    return response.data;
  },

  async getMyTimetable(): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/hr/staff/my-timetable');
    return response.data;
  },

  async createStaff(data: Partial<Staff>): Promise<{ success: boolean; message: string; data: Staff }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: Staff }>('/hr/staff', data);
    return response.data;
  },

  async updateStaff(id: string, data: Partial<Staff>): Promise<{ success: boolean; message: string; data: Staff }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: Staff }>(`/hr/staff/${id}`, data);
    return response.data;
  },

  async deleteStaff(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/hr/staff/${id}`);
    return response.data;
  },

  async disableStaff(id: string, data?: { leaving_date?: string; resignation_letter?: string }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.patch<{ success: boolean; message: string }>(`/hr/staff/${id}/disable`, data);
    return response.data;
  },

  async enableStaff(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.patch<{ success: boolean; message: string }>(`/hr/staff/${id}/enable`);
    return response.data;
  },

  // Staff Attendance
  async getStaffAttendance(params: {
    role_id?: number;
    attendance_date: string;
  }): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/hr/staff-attendance', { params });
    return response.data;
  },

  async submitStaffAttendance(data: {
    attendance_date: string;
    is_holiday?: boolean;
    attendance_records?: Array<{
      staff_id: number;
      status: 'present' | 'late' | 'absent' | 'half_day';
      check_in_time?: string;
      check_out_time?: string;
      note?: string;
    }>;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/hr/staff-attendance', data);
    return response.data;
  },

  async getStaffAttendanceReport(params: {
    staff_id?: number;
    role_id?: number;
    month: number;
    year: number;
  }): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/hr/staff-attendance/report', { params });
    return response.data;
  },

  // Leave Requests
  async getLeaveRequests(params?: {
    staff_id?: number;
    status?: 'pending' | 'approved' | 'disapproved';
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: any[]; pagination: any }> {
    const response = await apiClient.get<{ success: boolean; data: any[]; pagination: any }>('/hr/leave-requests', { params });
    return response.data;
  },

  async getLeaveRequestById(id: string): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/hr/leave-requests/${id}`);
    return response.data;
  },

  async createLeaveRequest(data: {
    staff_id: number;
    leave_type_id: number;
    apply_date: string;
    leave_date: string;
    reason?: string;
    note?: string;
    document_path?: string;
  }): Promise<{ success: boolean; message: string; data: any }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: any }>('/hr/leave-requests', data);
    return response.data;
  },

  async updateLeaveRequest(id: string, data: {
    status: 'pending' | 'approved' | 'disapproved';
    note?: string;
    approved_by?: number;
  }): Promise<{ success: boolean; message: string; data: any }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: any }>(`/hr/leave-requests/${id}`, data);
    return response.data;
  },

  async deleteLeaveRequest(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/hr/leave-requests/${id}`);
    return response.data;
  },

  // Payroll
  async getPayroll(params: {
    role_id?: number;
    month: number;
    year: number;
    status?: 'not_generated' | 'generated' | 'paid';
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: any[]; pagination: any }> {
    const response = await apiClient.get<{ success: boolean; data: any[]; pagination: any }>('/hr/payroll', { params });
    return response.data;
  },

  async getPayrollById(id: string): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/hr/payroll/${id}`);
    return response.data;
  },

  async generatePayroll(data: {
    staff_id: number;
    month: number;
    year: number;
    basic_salary?: number;
    earnings?: Array<{ earning_type: string; amount: number }>;
    deductions?: Array<{ deduction_type: string; amount: number }>;
    tax?: number;
  }): Promise<{ success: boolean; message: string; data: any }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: any }>('/hr/payroll', data);
    return response.data;
  },

  async updatePayroll(id: string, data: {
    basic_salary?: number;
    earnings?: Array<{ earning_type: string; amount: number }>;
    deductions?: Array<{ deduction_type: string; amount: number }>;
    tax?: number;
    status?: 'not_generated' | 'generated' | 'paid';
    payment_date?: string;
    payment_mode?: 'cash' | 'cheque' | 'bank_transfer' | 'online';
    payment_note?: string;
  }): Promise<{ success: boolean; message: string; data: any }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: any }>(`/hr/payroll/${id}`, data);
    return response.data;
  },

  async revertPayrollStatus(id: string, status: 'not_generated' | 'generated'): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.patch<{ success: boolean; message: string }>(`/hr/payroll/${id}/revert`, { status });
    return response.data;
  },

  // Teacher Ratings
  async getTeacherRatings(params?: { teacher_id?: number; is_approved?: boolean; student_id?: number }): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/hr/teacher-ratings', { params });
    return response.data;
  },

  async submitTeacherRating(data: { teacher_id: number; student_id: number; rating: number; review?: string }): Promise<{ success: boolean; message: string; data: any }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: any }>('/hr/teacher-ratings', data);
    return response.data;
  },

  async approveTeacherRating(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/hr/teacher-ratings/${id}/approve`);
    return response.data;
  },

  async rejectTeacherRating(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/hr/teacher-ratings/${id}`);
    return response.data;
  },
};

