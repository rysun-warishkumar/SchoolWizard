import { apiClient } from './apiClient';

export interface Homework {
  id: number;
  class_id: number;
  section_id: number;
  subject_group_id?: number;
  subject_id: number;
  homework_date: string;
  submission_date: string;
  title: string;
  description?: string;
  attachment_url?: string;
  created_by?: number;
  class_name?: string;
  section_name?: string;
  subject_name?: string;
  subject_code?: string;
  subject_group_name?: string;
  created_by_name?: string;
  evaluations?: HomeworkEvaluation[];
  created_at: string;
  updated_at: string;
}

export interface HomeworkEvaluation {
  id: number;
  homework_id: number;
  student_id: number;
  is_completed: boolean;
  evaluation_date?: string;
  remarks?: string;
  marks?: number;
  evaluated_by?: number;
  admission_no?: string;
  first_name?: string;
  last_name?: string;
  roll_no?: string;
  evaluated_by_name?: string;
  created_at: string;
  updated_at: string;
}

export const homeworkService = {
  async getHomework(params?: {
    class_id?: number;
    section_id?: number;
    subject_id?: number;
    session_id?: number;
    student_id?: number;
  }): Promise<Homework[]> {
    const response = await apiClient.get('/homework', { params });
    return response.data.data;
  },

  async getHomeworkById(id: number): Promise<Homework> {
    const response = await apiClient.get(`/homework/${id}`);
    return response.data.data;
  },

  async createHomework(data: FormData | {
    class_id: number;
    section_id: number;
    subject_group_id?: number;
    subject_id: number;
    homework_date: string;
    submission_date: string;
    title: string;
    description?: string;
    attachment_url?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/homework', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  async updateHomework(id: number, data: Partial<Homework>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/homework/${id}`, data);
    return response.data;
  },

  async deleteHomework(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/homework/${id}`);
    return response.data;
  },

  async evaluateHomework(data: {
    homework_id: number;
    student_ids: number[];
    evaluation_date?: string;
    student_remarks?: Record<number, string> | Array<{ student_id: number; remarks: string }> | string;
    student_statuses?: Record<number, 'pending' | 'completed' | 'in_progress'>;
    marks?: number;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/homework/${data.homework_id}/evaluate`, data);
    return response.data;
  },

  async updateHomeworkEvaluation(id: number, data: {
    is_completed?: boolean;
    evaluation_date?: string;
    remarks?: string;
    marks?: number;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/homework/evaluations/${id}`, data);
    return response.data;
  },
};

