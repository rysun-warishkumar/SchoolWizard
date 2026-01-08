import { apiClient } from './apiClient';

// ========== Types ==========

export interface SubjectStatus {
  id: number;
  class_id: number;
  section_id: number;
  subject_id: number;
  teacher_id?: number;
  topic_name: string;
  start_date?: string;
  completion_date?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completion_percentage: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  class_name?: string;
  section_name?: string;
  subject_name?: string;
  subject_code?: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
}

export interface LessonPlan {
  id: number;
  class_id: number;
  section_id: number;
  subject_id: number;
  teacher_id?: number;
  lesson_title: string;
  lesson_date: string;
  topic?: string;
  learning_objectives?: string;
  teaching_methods?: string;
  materials_needed?: string;
  activities?: string;
  homework?: string;
  assessment?: string;
  notes?: string;
  status: 'draft' | 'published' | 'completed';
  created_at: string;
  updated_at: string;
  class_name?: string;
  section_name?: string;
  subject_name?: string;
  subject_code?: string;
  teacher_first_name?: string;
  teacher_last_name?: string;
  topics_count?: number;
  attachments_count?: number;
  topics?: LessonPlanTopic[];
  attachments?: LessonPlanAttachment[];
}

export interface LessonPlanTopic {
  id: number;
  lesson_plan_id: number;
  topic_name: string;
  topic_order: number;
  estimated_duration?: number;
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
  created_at: string;
}

export interface LessonPlanAttachment {
  id: number;
  lesson_plan_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_at: string;
}

// ========== Service Object ==========

export const lessonPlanService = {
  // ========== Subject Status ==========
  async getSubjectStatus(params?: {
    class_id?: number;
    section_id?: number;
    subject_id?: number;
    teacher_id?: number;
    status?: string;
  }): Promise<SubjectStatus[]> {
    const response = await apiClient.get('/lesson-plan/subject-status', { params });
    return response.data.data;
  },

  async getSubjectStatusById(id: number): Promise<SubjectStatus> {
    const response = await apiClient.get(`/lesson-plan/subject-status/${id}`);
    return response.data.data;
  },

  async createSubjectStatus(data: {
    class_id: number;
    section_id: number;
    subject_id: number;
    teacher_id?: number;
    topic_name: string;
    start_date?: string;
    completion_date?: string;
    status?: 'not_started' | 'in_progress' | 'completed';
    completion_percentage?: number;
    notes?: string;
  }): Promise<{ id: number }> {
    const response = await apiClient.post('/lesson-plan/subject-status', data);
    return response.data.data;
  },

  async updateSubjectStatus(id: number, data: Partial<SubjectStatus>): Promise<void> {
    await apiClient.put(`/lesson-plan/subject-status/${id}`, data);
  },

  async deleteSubjectStatus(id: number): Promise<void> {
    await apiClient.delete(`/lesson-plan/subject-status/${id}`);
  },

  // ========== Lesson Plans ==========
  async getLessonPlans(params?: {
    class_id?: number;
    section_id?: number;
    subject_id?: number;
    teacher_id?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<LessonPlan[]> {
    const response = await apiClient.get('/lesson-plan/lesson-plans', { params });
    return response.data.data;
  },

  async getLessonPlanById(id: number): Promise<LessonPlan> {
    const response = await apiClient.get(`/lesson-plan/lesson-plans/${id}`);
    return response.data.data;
  },

  async createLessonPlan(data: {
    class_id: number;
    section_id: number;
    subject_id: number;
    teacher_id?: number;
    lesson_title: string;
    lesson_date: string;
    topic?: string;
    learning_objectives?: string;
    teaching_methods?: string;
    materials_needed?: string;
    activities?: string;
    homework?: string;
    assessment?: string;
    notes?: string;
    status?: 'draft' | 'published' | 'completed';
  }): Promise<{ id: number }> {
    const response = await apiClient.post('/lesson-plan/lesson-plans', data);
    return response.data.data;
  },

  async updateLessonPlan(id: number, data: Partial<LessonPlan>): Promise<void> {
    await apiClient.put(`/lesson-plan/lesson-plans/${id}`, data);
  },

  async deleteLessonPlan(id: number): Promise<void> {
    await apiClient.delete(`/lesson-plan/lesson-plans/${id}`);
  },

  // ========== Lesson Plan Topics ==========
  async getLessonPlanTopics(lesson_plan_id?: number): Promise<LessonPlanTopic[]> {
    const response = await apiClient.get('/lesson-plan/topics', {
      params: lesson_plan_id ? { lesson_plan_id } : {},
    });
    return response.data.data;
  },

  async createLessonPlanTopic(data: {
    lesson_plan_id: number;
    topic_name: string;
    topic_order?: number;
    estimated_duration?: number;
    status?: 'pending' | 'in_progress' | 'completed';
    notes?: string;
  }): Promise<{ id: number }> {
    const response = await apiClient.post('/lesson-plan/topics', data);
    return response.data.data;
  },

  async updateLessonPlanTopic(id: number, data: Partial<LessonPlanTopic>): Promise<void> {
    await apiClient.put(`/lesson-plan/topics/${id}`, data);
  },

  async deleteLessonPlanTopic(id: number): Promise<void> {
    await apiClient.delete(`/lesson-plan/topics/${id}`);
  },

  // ========== Lesson Plan Attachments ==========
  async uploadAttachment(lesson_plan_id: number, file: File): Promise<{ id: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lesson_plan_id', lesson_plan_id.toString());

    const response = await apiClient.post('/lesson-plan/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async deleteAttachment(id: number): Promise<void> {
    await apiClient.delete(`/lesson-plan/attachments/${id}`);
  },
};

