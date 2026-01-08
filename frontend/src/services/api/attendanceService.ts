import { apiClient } from './apiClient';

export interface StudentAttendanceRecord {
  student_id: number;
  admission_no: string;
  first_name: string;
  last_name?: string;
  photo?: string;
  status: 'present' | 'late' | 'absent' | 'half_day' | 'holiday' | null;
  note?: string;
  attendance_id?: number;
}

export interface AttendanceByDate {
  id: number;
  student_id: number;
  admission_no: string;
  first_name: string;
  last_name?: string;
  class_name: string;
  section_name: string;
  attendance_date: string;
  status: 'present' | 'late' | 'absent' | 'half_day' | 'holiday';
  note?: string;
}

export interface StudentLeaveRequest {
  id: number;
  student_id: number;
  class_id: number;
  section_id: number;
  session_id: number;
  apply_date: string;
  leave_date: string;
  leave_type: 'sick' | 'casual' | 'emergency' | 'other';
  reason: string;
  document_path?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  admission_no?: string;
  first_name?: string;
  last_name?: string;
  class_name?: string;
  section_name?: string;
  approved_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentAttendanceSummary {
  present_count: number;
  absent_count: number;
  late_count: number;
  half_day_count: number;
  holiday_count: number;
  total_days: number;
}

export const attendanceService = {
  async getStudentAttendance(params: {
    class_id: number;
    section_id: number;
    attendance_date: string;
    session_id: number;
  }): Promise<StudentAttendanceRecord[]> {
    const response = await apiClient.get('/attendance/student-attendance', { params });
    return response.data.data;
  },

  // Get current student's attendance summary (for student panel)
  async getMyAttendance(params: {
    month: number;
    year: number;
  }): Promise<StudentAttendanceSummary[]> {
    const response = await apiClient.get('/attendance/my-attendance', { params });
    return response.data.data;
  },

  async submitStudentAttendance(data: {
    class_id: number;
    section_id: number;
    attendance_date: string;
    session_id: number;
    attendance_records: Array<{
      student_id: number;
      status: 'present' | 'late' | 'absent' | 'half_day';
      note?: string;
    }>;
    mark_holiday?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/attendance/student-attendance', data);
    return response.data;
  },

  async getAttendanceByDate(params: {
    class_id: number;
    section_id: number;
    attendance_date: string;
    session_id?: number;
  }): Promise<AttendanceByDate[]> {
    const response = await apiClient.get('/attendance/attendance-by-date', { params });
    return response.data.data;
  },

  async getStudentLeaveRequests(params?: {
    student_id?: number;
    status?: string;
    class_id?: number;
    section_id?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: StudentLeaveRequest[]; pagination: any }> {
    const response = await apiClient.get('/attendance/student-leave-requests', { params });
    return response.data;
  },

  async getStudentLeaveRequestById(id: number): Promise<StudentLeaveRequest> {
    const response = await apiClient.get(`/attendance/student-leave-requests/${id}`);
    return response.data.data;
  },

  async createStudentLeaveRequest(data: {
    student_id: number;
    class_id: number;
    section_id: number;
    session_id: number;
    apply_date: string;
    leave_date: string;
    leave_type?: 'sick' | 'casual' | 'emergency' | 'other';
    reason: string;
    document_path?: string;
  }): Promise<StudentLeaveRequest> {
    const response = await apiClient.post('/attendance/student-leave-requests', data);
    return response.data.data;
  },

  async updateStudentLeaveRequest(
    id: number,
    data: {
      status: 'pending' | 'approved' | 'rejected';
      rejection_reason?: string;
    }
  ): Promise<StudentLeaveRequest> {
    const response = await apiClient.put(`/attendance/student-leave-requests/${id}`, data);
    return response.data.data;
  },

  async deleteStudentLeaveRequest(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/attendance/student-leave-requests/${id}`);
    return response.data;
  },
};

