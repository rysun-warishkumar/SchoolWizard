import { apiClient } from './apiClient';

export interface Class {
  id: number;
  name: string;
  numeric_value?: number;
  sections?: string;
  section_ids?: string;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: number;
  name: string;
  code?: string;
  type: 'theory' | 'practical';
  created_at: string;
  updated_at: string;
}

export interface SubjectGroup {
  id: number;
  name: string;
  class_id: number;
  section_id: number;
  class_name?: string;
  section_name?: string;
  subjects?: string;
  created_at: string;
  updated_at: string;
}

export interface ClassTeacher {
  id: number;
  class_id: number;
  section_id: number;
  teacher_id: number;
  class_name?: string;
  section_name?: string;
  teacher_name?: string;
  teacher_email?: string;
  created_at: string;
}

export interface TimetableEntry {
  id: number;
  class_id: number;
  section_id: number;
  subject_group_id?: number;
  subject_id: number;
  teacher_id?: number;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  time_from: string;
  time_to: string;
  room_no?: string;
  subject_name?: string;
  subject_code?: string;
  teacher_name?: string;
  class_name?: string;
  section_name?: string;
  created_at: string;
  updated_at: string;
}

export const academicsService = {
  // Classes
  async getClasses(): Promise<{ success: boolean; data: Class[] }> {
    const response = await apiClient.get<{ success: boolean; data: Class[] }>('/academics/classes');
    return response.data;
  },

  async createClass(data: { name: string; numeric_value?: number; section_ids?: number[] }): Promise<{ success: boolean; message: string; data: Class }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: Class }>('/academics/classes', data);
    return response.data;
  },

  async updateClass(id: string, data: Partial<Class & { section_ids?: number[] }>): Promise<{ success: boolean; message: string; data: Class }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: Class }>(`/academics/classes/${id}`, data);
    return response.data;
  },

  async deleteClass(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/academics/classes/${id}`);
    return response.data;
  },

  // Sections
  async getSections(classId?: number): Promise<{ success: boolean; data: Section[] }> {
    const params = classId ? { class_id: classId } : {};
    const response = await apiClient.get<{ success: boolean; data: Section[] }>('/academics/sections', { params });
    return response.data;
  },

  async createSection(data: { name: string }): Promise<{ success: boolean; message: string; data: Section }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: Section }>('/academics/sections', data);
    return response.data;
  },

  async updateSection(id: string, data: { name: string }): Promise<{ success: boolean; message: string; data: Section }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: Section }>(`/academics/sections/${id}`, data);
    return response.data;
  },

  async deleteSection(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/academics/sections/${id}`);
    return response.data;
  },

  // Subjects
  async getSubjects(): Promise<{ success: boolean; data: Subject[] }> {
    const response = await apiClient.get<{ success: boolean; data: Subject[] }>('/academics/subjects');
    return response.data;
  },

  async createSubject(data: { name: string; code?: string; type?: 'theory' | 'practical' }): Promise<{ success: boolean; message: string; data: Subject }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: Subject }>('/academics/subjects', data);
    return response.data;
  },

  async updateSubject(id: string, data: Partial<Subject>): Promise<{ success: boolean; message: string; data: Subject }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: Subject }>(`/academics/subjects/${id}`, data);
    return response.data;
  },

  async deleteSubject(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/academics/subjects/${id}`);
    return response.data;
  },

  // Subject Groups
  async getSubjectGroups(params?: { class_id?: number; section_id?: number }): Promise<{ success: boolean; data: SubjectGroup[] }> {
    const response = await apiClient.get<{ success: boolean; data: SubjectGroup[] }>('/academics/subject-groups', { params });
    return response.data;
  },

  async createSubjectGroup(data: { name: string; class_id: number; section_id: number; subject_ids?: number[] }): Promise<{ success: boolean; message: string; data: SubjectGroup }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: SubjectGroup }>('/academics/subject-groups', data);
    return response.data;
  },

  async updateSubjectGroup(id: string, data: { name?: string; subject_ids?: number[] }): Promise<{ success: boolean; message: string; data: SubjectGroup }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: SubjectGroup }>(`/academics/subject-groups/${id}`, data);
    return response.data;
  },

  async deleteSubjectGroup(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/academics/subject-groups/${id}`);
    return response.data;
  },

  // Class Teachers
  async getClassTeachers(params?: { class_id?: number; section_id?: number }): Promise<{ success: boolean; data: ClassTeacher[] }> {
    const response = await apiClient.get<{ success: boolean; data: ClassTeacher[] }>('/academics/class-teachers', { params });
    return response.data;
  },

  async assignClassTeacher(data: { class_id: number; section_id: number; teacher_id: number }): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { id: number } }>('/academics/class-teachers', data);
    return response.data;
  },

  async removeClassTeacher(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/academics/class-teachers/${id}`);
    return response.data;
  },

  // Timetable
  async getTimetable(params: { class_id: number; section_id: number }): Promise<{ success: boolean; data: TimetableEntry[] }> {
    const response = await apiClient.get<{ success: boolean; data: TimetableEntry[] }>('/academics/timetable', { params });
    return response.data;
  },

  async createTimetableEntry(data: Partial<TimetableEntry>): Promise<{ success: boolean; message: string; data: TimetableEntry }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: TimetableEntry }>('/academics/timetable', data);
    return response.data;
  },

  async updateTimetableEntry(id: string, data: Partial<TimetableEntry>): Promise<{ success: boolean; message: string; data: TimetableEntry }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: TimetableEntry }>(`/academics/timetable/${id}`, data);
    return response.data;
  },

  async deleteTimetableEntry(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/academics/timetable/${id}`);
    return response.data;
  },

  async getTeacherTimetable(params: { teacher_id: number }): Promise<{ success: boolean; data: TimetableEntry[] }> {
    const response = await apiClient.get<{ success: boolean; data: TimetableEntry[] }>('/academics/teacher-timetable', { params });
    return response.data;
  },
};

