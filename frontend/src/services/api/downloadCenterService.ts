import { apiClient } from './apiClient';

export interface DownloadContent {
  id: number;
  content_title: string;
  content_type: 'assignments' | 'study_material' | 'syllabus' | 'other_downloads';
  available_for: 'students' | 'staff' | 'both';
  class_id?: number;
  section_id?: number;
  class_name?: string;
  section_name?: string;
  upload_date: string;
  description?: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  uploaded_by: number;
  uploaded_by_name?: string;
  created_at: string;
  updated_at: string;
}

export const downloadCenterService = {
  async getDownloadContents(params?: {
    content_type?: 'assignments' | 'study_material' | 'syllabus' | 'other_downloads';
    available_for?: 'students' | 'staff' | 'both';
    class_id?: number;
    section_id?: number;
    search?: string;
  }): Promise<DownloadContent[]> {
    const response = await apiClient.get('/download-center', { params });
    return response.data.data || [];
  },

  async getDownloadContentById(id: number): Promise<DownloadContent> {
    const response = await apiClient.get(`/download-center/${id}`);
    return response.data.data;
  },

  async createDownloadContent(data: FormData): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/download-center', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateDownloadContent(id: number, data: FormData): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/download-center/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteDownloadContent(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/download-center/${id}`);
    return response.data;
  },

  async downloadFile(id: number): Promise<Blob> {
    const response = await apiClient.get(`/download-center/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

