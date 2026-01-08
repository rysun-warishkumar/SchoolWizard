import { apiClient } from './apiClient';

export interface MarksGrade {
  id: number;
  exam_type: 'general_purpose' | 'school_based' | 'college_based' | 'gpa';
  grade_name: string;
  percent_from: number;
  percent_upto: number;
  grade_point?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamGroup {
  id: number;
  name: string;
  exam_type: 'general_purpose' | 'school_based' | 'college_based' | 'gpa';
  description?: string;
  created_at: string;
  updated_at: string;
  exams?: Exam[];
}

export interface Exam {
  id: number;
  exam_group_id: number;
  name: string;
  session_id: number;
  is_published: boolean;
  description?: string;
  exam_group_name?: string;
  exam_type?: string;
  session_name?: string;
  subjects?: ExamSubject[];
  students?: ExamStudent[];
  created_at: string;
  updated_at: string;
}

export interface ExamSubject {
  id: number;
  exam_id: number;
  subject_id: number;
  exam_date?: string;
  exam_time_from?: string;
  exam_time_to?: string;
  room_number?: string;
  credit_hours: number;
  max_marks: number;
  passing_marks: number;
  subject_name?: string;
  subject_code?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamStudent {
  id: number;
  exam_id: number;
  student_id: number;
  roll_number?: string;
  admission_no?: string;
  first_name?: string;
  last_name?: string;
  photo?: string;
  created_at: string;
}

export interface ExamMark {
  id: number;
  exam_id: number;
  exam_subject_id: number;
  student_id: number;
  marks_obtained: number;
  grade?: string;
  grade_point?: number;
  note?: string;
  admission_no?: string;
  first_name?: string;
  last_name?: string;
  max_marks?: number;
  passing_marks?: number;
  subject_name?: string;
  created_at: string;
  updated_at: string;
}

export const examinationsService = {
  // Marks Grades
  async getMarksGrades(exam_type?: string): Promise<MarksGrade[]> {
    const response = await apiClient.get('/examinations/marks-grades', {
      params: exam_type ? { exam_type } : {},
    });
    return response.data.data;
  },

  async createMarksGrade(data: {
    exam_type: 'general_purpose' | 'school_based' | 'college_based' | 'gpa';
    grade_name: string;
    percent_from: number;
    percent_upto: number;
    grade_point?: number;
    description?: string;
  }): Promise<MarksGrade> {
    const response = await apiClient.post('/examinations/marks-grades', data);
    return response.data.data;
  },

  // Exam Groups
  async getExamGroups(): Promise<ExamGroup[]> {
    const response = await apiClient.get('/examinations/exam-groups');
    return response.data.data;
  },

  async getExamGroupById(id: number): Promise<ExamGroup> {
    const response = await apiClient.get(`/examinations/exam-groups/${id}`);
    return response.data.data;
  },

  async createExamGroup(data: {
    name: string;
    exam_type?: 'general_purpose' | 'school_based' | 'college_based' | 'gpa';
    description?: string;
  }): Promise<ExamGroup> {
    const response = await apiClient.post('/examinations/exam-groups', data);
    return response.data.data;
  },

  // Exams
  async getExams(params?: {
    exam_group_id?: number;
    session_id?: number;
  }): Promise<Exam[]> {
    const response = await apiClient.get('/examinations/exams', { params });
    return response.data.data;
  },

  async getExamById(id: number): Promise<Exam> {
    const response = await apiClient.get(`/examinations/exams/${id}`);
    return response.data.data;
  },

  async createExam(data: {
    exam_group_id: number;
    name: string;
    session_id: number;
    is_published?: boolean;
    description?: string;
  }): Promise<Exam> {
    const response = await apiClient.post('/examinations/exams', data);
    return response.data.data;
  },

  async updateExam(id: number, data: {
    name?: string;
    is_published?: boolean;
    description?: string;
  }): Promise<Exam> {
    const response = await apiClient.put(`/examinations/exams/${id}`, data);
    return response.data.data;
  },

  async deleteExam(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/examinations/exams/${id}`);
    return response.data;
  },

  // Exam Subjects
  async getExamSubjects(exam_id: number): Promise<ExamSubject[]> {
    const response = await apiClient.get('/examinations/exam-subjects', {
      params: { exam_id },
    });
    return response.data.data;
  },

  async createExamSubject(data: {
    exam_id: number;
    subject_id: number;
    exam_date?: string;
    exam_time_from?: string;
    exam_time_to?: string;
    room_number?: string;
    credit_hours?: number;
    max_marks: number;
    passing_marks?: number;
  }): Promise<ExamSubject> {
    const response = await apiClient.post('/examinations/exam-subjects', data);
    return response.data.data;
  },

  // Exam Marks
  async getExamMarks(params?: {
    exam_id?: number;
    exam_subject_id?: number;
    student_id?: number;
  }): Promise<ExamMark[]> {
    const response = await apiClient.get('/examinations/exam-marks', { params });
    return response.data.data;
  },

  async submitExamMarks(data: {
    exam_id: number;
    exam_subject_id: number;
    marks_records: Array<{
      student_id: number;
      marks_obtained: number;
      note?: string;
    }>;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/examinations/exam-marks', data);
    return response.data;
  },

  // Exam Students
  async assignExamStudents(exam_id: number, student_ids: number[]): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/examinations/exams/${exam_id}/assign-students`, {
      exam_id,
      student_ids,
    });
    return response.data;
  },

  // Exam Results
  async getExamResults(params: {
    exam_id: number;
    class_id: number;
    section_id: number;
    session_id: number;
  }): Promise<{
    success: boolean;
    data: {
      exam: { id: number; name: string; exam_type: string };
      class_id: number;
      section_id: number;
      session_id: number;
      results: Array<{
        student_id: number;
        admission_no: string;
        roll_no?: string;
        exam_roll_number?: string;
        first_name: string;
        last_name?: string;
        photo?: string;
        subjects: Array<{
          subject_id: number;
          subject_name: string;
          subject_code?: string;
          marks_obtained: number;
          max_marks: number;
          passing_marks: number;
          grade?: string;
          grade_point?: number;
          is_pass: boolean;
        }>;
        total_marks_obtained: number;
        total_max_marks: number;
        percentage: number;
        grade?: string;
        grade_point?: number;
        is_pass: boolean;
        rank: number;
      }>;
    };
  }> {
    const response = await apiClient.get('/examinations/exam-results', { params });
    return response.data;
  },

  // Admit Card Templates
  async getAdmitCardTemplates(): Promise<AdmitCardTemplate[]> {
    const response = await apiClient.get('/examinations/admit-card-templates');
    return response.data.data;
  },

  async getAdmitCardTemplateById(id: number): Promise<AdmitCardTemplate> {
    const response = await apiClient.get(`/examinations/admit-card-templates/${id}`);
    return response.data.data;
  },

  async createAdmitCardTemplate(data: Partial<AdmitCardTemplate>): Promise<AdmitCardTemplate> {
    const response = await apiClient.post('/examinations/admit-card-templates', data);
    return response.data.data;
  },

  async updateAdmitCardTemplate(id: number, data: Partial<AdmitCardTemplate>): Promise<AdmitCardTemplate> {
    const response = await apiClient.put(`/examinations/admit-card-templates/${id}`, data);
    return response.data.data;
  },

  async deleteAdmitCardTemplate(id: number): Promise<void> {
    await apiClient.delete(`/examinations/admit-card-templates/${id}`);
  },

  // Marksheet Templates
  async getMarksheetTemplates(): Promise<MarksheetTemplate[]> {
    const response = await apiClient.get('/examinations/marksheet-templates');
    return response.data.data;
  },

  async getMarksheetTemplateById(id: number): Promise<MarksheetTemplate> {
    const response = await apiClient.get(`/examinations/marksheet-templates/${id}`);
    return response.data.data;
  },

  async createMarksheetTemplate(data: Partial<MarksheetTemplate>): Promise<MarksheetTemplate> {
    const response = await apiClient.post('/examinations/marksheet-templates', data);
    return response.data.data;
  },

  async updateMarksheetTemplate(id: number, data: Partial<MarksheetTemplate>): Promise<MarksheetTemplate> {
    const response = await apiClient.put(`/examinations/marksheet-templates/${id}`, data);
    return response.data.data;
  },
};

export interface AdmitCardTemplate {
  id: number;
  name: string;
  heading?: string;
  title?: string;
  exam_name?: string;
  header_left_text?: string;
  header_center_text?: string;
  header_right_text?: string;
  body_text?: string;
  footer_left_text?: string;
  footer_center_text?: string;
  footer_right_text?: string;
  header_height: number;
  footer_height: number;
  body_height: number;
  body_width: number;
  show_student_photo: boolean;
  photo_height: number;
  background_image?: string;
  created_at: string;
  updated_at: string;
}

export interface MarksheetTemplate {
  id: number;
  name: string;
  header_left_text?: string;
  header_center_text?: string;
  header_right_text?: string;
  body_text?: string;
  footer_left_text?: string;
  footer_center_text?: string;
  footer_right_text?: string;
  header_height: number;
  footer_height: number;
  body_height: number;
  body_width: number;
  show_student_photo: boolean;
  photo_height: number;
  background_image?: string;
  created_at: string;
  updated_at: string;
}

