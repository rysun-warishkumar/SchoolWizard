import { apiClient } from './apiClient';

export interface Student {
  id: number;
  admission_no: string;
  roll_no?: string;
  class_id: number;
  section_id: number;
  session_id: number;
  first_name: string;
  last_name?: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  category_id?: number;
  religion?: string;
  caste?: string;
  student_mobile?: string;
  email?: string;
  admission_date: string;
  photo?: string;
  blood_group?: string;
  house_id?: number;
  height?: string;
  weight?: string;
  father_name?: string;
  father_phone?: string;
  father_email?: string;
  mother_name?: string;
  mother_phone?: string;
  mother_email?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  is_active: boolean;
  class_name?: string;
  section_name?: string;
  category_name?: string;
  house_name?: string;
  documents?: any[];
}

export interface StudentCategory {
  id: number;
  name: string;
}

export interface StudentHouse {
  id: number;
  name: string;
}

export interface DisableReason {
  id: number;
  name: string;
}

export interface OnlineAdmission {
  id: number;
  admission_no?: string;
  first_name: string;
  last_name?: string;
  gender: string;
  date_of_birth: string;
  email?: string;
  phone?: string;
  class_id?: number;
  status: 'pending' | 'approved' | 'rejected';
  class_name?: string;
  created_at: string;
}

export const studentsService = {
  // Get current student's profile (for student panel)
  async getMyProfile(): Promise<Student> {
    const response = await apiClient.get('/students/my-profile');
    return response.data.data;
  },

  // Get all children for a parent (for parent panel)
  async getMyChildren(): Promise<{ success: boolean; data: Student[] }> {
    const response = await apiClient.get<{ success: boolean; data: Student[] }>('/students/my-children');
    return response.data;
  },

  // Students
  async getStudents(params?: {
    class_id?: number;
    section_id?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: Student[]; pagination: any }> {
    const response = await apiClient.get<{ success: boolean; data: Student[]; pagination: any }>('/students', { params });
    return response.data;
  },

  async getStudentById(id: string): Promise<{ success: boolean; data: Student }> {
    const response = await apiClient.get<{ success: boolean; data: Student }>(`/students/${id}`);
    return response.data;
  },

  async createStudent(data: Partial<Student>): Promise<{ success: boolean; message: string; data: Student }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: Student }>('/students', data);
    return response.data;
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<{ success: boolean; message: string; data: Student }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: Student }>(`/students/${id}`, data);
    return response.data;
  },

  async updateStudentWithPhoto(id: string, formData: FormData): Promise<{ success: boolean; message: string; data: Student }> {
    // Verify FormData has the file
    const photoEntry = formData.get('photo');
    if (!photoEntry || !(photoEntry && typeof photoEntry === 'object' && 'constructor' in photoEntry && (photoEntry as any).constructor.name === 'File')) {
      throw new Error('No photo file found in FormData');
    }
    
    // Don't set Content-Type - let axios set it automatically with boundary
    const response = await apiClient.put<{ success: boolean; message: string; data: Student }>(`/students/${id}`, formData);
    return response.data;
  },

  async deleteStudent(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/students/${id}`);
    return response.data;
  },

  async disableStudent(id: string, disable_reason_id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.patch<{ success: boolean; message: string }>(`/students/${id}/disable`, { disable_reason_id });
    return response.data;
  },

  // Categories
  async getCategories(): Promise<{ success: boolean; data: StudentCategory[] }> {
    const response = await apiClient.get<{ success: boolean; data: StudentCategory[] }>('/students/categories');
    return response.data;
  },

  async createCategory(data: { name: string }): Promise<{ success: boolean; message: string; data: StudentCategory }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: StudentCategory }>('/students/categories', data);
    return response.data;
  },

  // Houses
  async getHouses(): Promise<{ success: boolean; data: StudentHouse[] }> {
    const response = await apiClient.get<{ success: boolean; data: StudentHouse[] }>('/students/houses');
    return response.data;
  },

  async createHouse(data: { name: string }): Promise<{ success: boolean; message: string; data: StudentHouse }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: StudentHouse }>('/students/houses', data);
    return response.data;
  },

  // Disable Reasons
  async getDisableReasons(): Promise<{ success: boolean; data: DisableReason[] }> {
    const response = await apiClient.get<{ success: boolean; data: DisableReason[] }>('/students/disable-reasons');
    return response.data;
  },

  async createDisableReason(data: { name: string }): Promise<{ success: boolean; message: string; data: DisableReason }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: DisableReason }>('/students/disable-reasons', data);
    return response.data;
  },

  // Online Admissions
  async getOnlineAdmissions(): Promise<{ success: boolean; data: OnlineAdmission[] }> {
    const response = await apiClient.get<{ success: boolean; data: OnlineAdmission[] }>('/students/online-admissions');
    return response.data;
  },

  async approveOnlineAdmission(id: string): Promise<{ success: boolean; message: string; data: { studentId: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { studentId: number } }>(`/students/online-admissions/${id}/approve`);
    return response.data;
  },

  async rejectOnlineAdmission(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/students/online-admissions/${id}/reject`);
    return response.data;
  },

  // Promote Students
  async getStudentsForPromotion(params: { class_id: number; section_id: number }): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/students/promote', { params });
    return response.data;
  },

  async promoteStudents(data: {
    promotions: Array<{
      student_id: number;
      current_result: 'pass' | 'fail';
      next_session_status: 'continue' | 'leave';
    }>;
    target_session_id: number;
    target_class_id?: number;
    target_section_id?: number;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/students/promote', data);
    return response.data;
  },
};

