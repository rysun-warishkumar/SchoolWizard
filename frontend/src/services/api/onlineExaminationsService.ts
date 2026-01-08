import { apiClient } from './apiClient';

export interface Question {
  id: number;
  subject_id: number;
  question: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  option_e?: string;
  correct_answer: 'A' | 'B' | 'C' | 'D' | 'E';
  marks: number;
  subject_name?: string;
  subject_code?: string;
  created_at: string;
  updated_at: string;
}

export interface OnlineExam {
  id: number;
  name: string;
  subject_id: number;
  session_id: number;
  class_id?: number;
  section_id?: number;
  exam_date?: string;
  exam_time_from?: string;
  exam_time_to?: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  instructions?: string;
  is_published: boolean;
  is_active: boolean;
  created_by?: number;
  subject_name?: string;
  subject_code?: string;
  session_name?: string;
  class_name?: string;
  section_name?: string;
  created_by_name?: string;
  questions?: OnlineExamQuestion[];
  students?: OnlineExamStudent[];
  created_at: string;
  updated_at: string;
}

export interface OnlineExamQuestion {
  id: number;
  online_exam_id: number;
  question_id: number;
  marks: number;
  display_order: number;
  question?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  option_e?: string;
  correct_answer?: 'A' | 'B' | 'C' | 'D' | 'E';
  created_at: string;
}

export interface OnlineExamStudent {
  id: number;
  online_exam_id: number;
  student_id: number;
  admission_no?: string;
  first_name?: string;
  last_name?: string;
  roll_no?: string;
  assigned_at: string;
}

export const onlineExaminationsService = {
  // Question Bank
  async getQuestionBank(subject_id?: number): Promise<Question[]> {
    const response = await apiClient.get('/online-examinations/question-bank', {
      params: subject_id ? { subject_id } : {},
    });
    return response.data.data;
  },

  async getQuestionById(id: number): Promise<Question> {
    const response = await apiClient.get(`/online-examinations/question-bank/${id}`);
    return response.data.data;
  },

  async createQuestion(data: {
    subject_id: number;
    question: string;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    option_e?: string;
    correct_answer: 'A' | 'B' | 'C' | 'D' | 'E';
    marks?: number;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/online-examinations/question-bank', data);
    return response.data;
  },

  async updateQuestion(id: number, data: Partial<Question>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/online-examinations/question-bank/${id}`, data);
    return response.data;
  },

  async deleteQuestion(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/online-examinations/question-bank/${id}`);
    return response.data;
  },

  // Online Exams
  async getOnlineExams(params?: {
    session_id?: number;
    subject_id?: number;
    class_id?: number;
    is_published?: boolean;
  }): Promise<OnlineExam[]> {
    const response = await apiClient.get('/online-examinations/online-exams', { params });
    return response.data.data;
  },

  // Get online exams for current student (student panel)
  async getMyOnlineExams(): Promise<OnlineExam[]> {
    const response = await apiClient.get('/online-examinations/my-online-exams');
    return response.data.data;
  },

  // Start exam attempt
  async startExamAttempt(online_exam_id: number): Promise<any> {
    const response = await apiClient.post(`/online-examinations/online-exams/${online_exam_id}/start`);
    return response.data.data;
  },

  // Save answer
  async saveAnswer(attempt_id: number, question_id: number, selected_answer: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/online-examinations/attempts/${attempt_id}/answers`, {
      question_id,
      selected_answer,
    });
    return response.data;
  },

  // Submit exam
  async submitExam(attempt_id: number): Promise<any> {
    const response = await apiClient.post(`/online-examinations/attempts/${attempt_id}/submit`);
    return response.data;
  },

  // Terminate exam
  async terminateExam(attempt_id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/online-examinations/attempts/${attempt_id}/terminate`);
    return response.data;
  },

  async getOnlineExamById(id: number): Promise<OnlineExam> {
    const response = await apiClient.get(`/online-examinations/online-exams/${id}`);
    return response.data.data;
  },

  async createOnlineExam(data: {
    name: string;
    subject_id: number;
    session_id: number;
    class_id?: number;
    section_id?: number;
    exam_date?: string;
    exam_time_from?: string;
    exam_time_to?: string;
    duration_minutes?: number;
    total_marks?: number;
    passing_marks?: number;
    instructions?: string;
    is_published?: boolean;
  }): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await apiClient.post('/online-examinations/online-exams', data);
    return response.data;
  },

  async updateOnlineExam(id: number, data: Partial<OnlineExam>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/online-examinations/online-exams/${id}`, data);
    return response.data;
  },

  async deleteOnlineExam(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/online-examinations/online-exams/${id}`);
    return response.data;
  },

  // Online Exam Questions
  async addQuestionToExam(online_exam_id: number, data: {
    question_id: number;
    marks?: number;
    display_order?: number;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/online-examinations/online-exams/${online_exam_id}/questions`, data);
    return response.data;
  },

  async removeQuestionFromExam(online_exam_id: number, question_id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/online-examinations/online-exams/${online_exam_id}/questions/${question_id}`);
    return response.data;
  },

  // Online Exam Students
  async assignStudentsToExam(online_exam_id: number, student_ids: number[]): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/online-examinations/online-exams/${online_exam_id}/students`, {
      online_exam_id,
      student_ids,
    });
    return response.data;
  },

  async removeStudentFromExam(online_exam_id: number, student_id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/online-examinations/online-exams/${online_exam_id}/students/${student_id}`);
    return response.data;
  },

  // Exam Results
  async getMyExamResult(online_exam_id: number): Promise<any> {
    const response = await apiClient.get(`/online-examinations/online-exams/${online_exam_id}/my-result`);
    return response.data.data;
  },

  async getExamResults(online_exam_id: number, filters?: { class_id?: number; section_id?: number }): Promise<any> {
    const params = filters || {};
    const response = await apiClient.get(`/online-examinations/online-exams/${online_exam_id}/results`, { params });
    return response.data.data;
  },

  async getStudentExamResult(online_exam_id: number, student_id: number): Promise<any> {
    const response = await apiClient.get(`/online-examinations/online-exams/${online_exam_id}/results/${student_id}`);
    return response.data.data;
  },

  async publishExamResults(online_exam_id: number, is_published: boolean): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/online-examinations/online-exams/${online_exam_id}/publish-results`, {
      is_published,
    });
    return response.data;
  },
};

