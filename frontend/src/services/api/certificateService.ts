import { apiClient } from './apiClient';

export interface CertificateTemplate {
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
  student_photo_enabled: boolean;
  photo_height: number;
  background_image?: string;
  created_at: string;
  updated_at: string;
}

export interface IdCardTemplate {
  id: number;
  name: string;
  background_image?: string;
  logo?: string;
  signature?: string;
  school_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  id_card_title?: string;
  header_color: string;
  admission_number_enabled: boolean;
  student_name_enabled: boolean;
  class_enabled: boolean;
  father_name_enabled: boolean;
  mother_name_enabled: boolean;
  student_address_enabled: boolean;
  phone_enabled: boolean;
  date_of_birth_enabled: boolean;
  blood_group_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface GenerateCertificateRequest {
  template_id: number;
  student_ids: number[];
}

export interface GenerateIdCardRequest {
  template_id: number;
  student_ids: number[];
}

export const certificateService = {
  // Certificate Templates
  async getCertificateTemplates(): Promise<CertificateTemplate[]> {
    const response = await apiClient.get('/certificate/certificate-templates');
    return response.data.data || [];
  },

  async getCertificateTemplateById(id: number): Promise<CertificateTemplate> {
    const response = await apiClient.get(`/certificate/certificate-templates/${id}`);
    return response.data.data;
  },

  async createCertificateTemplate(data: Partial<CertificateTemplate> & { background_image?: File }): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    
    Object.keys(data).forEach((key) => {
      if (key === 'background_image' && data.background_image && typeof File !== 'undefined' && (data.background_image as any) instanceof File) {
        formData.append('background_image', data.background_image);
      } else if (key !== 'background_image' && data[key as keyof CertificateTemplate] !== undefined) {
        formData.append(key, String(data[key as keyof CertificateTemplate]));
      }
    });

    const response = await apiClient.post('/certificate/certificate-templates', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateCertificateTemplate(id: number, data: Partial<CertificateTemplate> & { background_image?: File }): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    
    Object.keys(data).forEach((key) => {
      if (key === 'background_image' && data.background_image && typeof File !== 'undefined' && (data.background_image as any) instanceof File) {
        formData.append('background_image', data.background_image);
      } else if (key !== 'background_image' && data[key as keyof CertificateTemplate] !== undefined) {
        formData.append(key, String(data[key as keyof CertificateTemplate]));
      }
    });

    const response = await apiClient.put(`/certificate/certificate-templates/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteCertificateTemplate(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/certificate/certificate-templates/${id}`);
    return response.data;
  },

  // ID Card Templates
  async getIdCardTemplates(): Promise<IdCardTemplate[]> {
    const response = await apiClient.get('/certificate/id-card-templates');
    return response.data.data || [];
  },

  async getIdCardTemplateById(id: number): Promise<IdCardTemplate> {
    const response = await apiClient.get(`/certificate/id-card-templates/${id}`);
    return response.data.data;
  },

  async createIdCardTemplate(data: Partial<IdCardTemplate> & { 
    background_image?: File;
    logo?: File;
    signature?: File;
  }): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    
    Object.keys(data).forEach((key) => {
      if (['background_image', 'logo', 'signature'].includes(key) && data[key as keyof typeof data] && typeof File !== 'undefined' && (data[key as keyof typeof data] as any) instanceof File) {
        formData.append(key, data[key as keyof typeof data] as File);
      } else if (!['background_image', 'logo', 'signature'].includes(key) && data[key as keyof IdCardTemplate] !== undefined) {
        formData.append(key, String(data[key as keyof IdCardTemplate]));
      }
    });

    const response = await apiClient.post('/certificate/id-card-templates', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateIdCardTemplate(id: number, data: Partial<IdCardTemplate> & { 
    background_image?: File;
    logo?: File;
    signature?: File;
  }): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    
    Object.keys(data).forEach((key) => {
      if (['background_image', 'logo', 'signature'].includes(key) && data[key as keyof typeof data] && typeof File !== 'undefined' && (data[key as keyof typeof data] as any) instanceof File) {
        formData.append(key, data[key as keyof typeof data] as File);
      } else if (!['background_image', 'logo', 'signature'].includes(key) && data[key as keyof IdCardTemplate] !== undefined) {
        formData.append(key, String(data[key as keyof IdCardTemplate]));
      }
    });

    const response = await apiClient.put(`/certificate/id-card-templates/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteIdCardTemplate(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/certificate/id-card-templates/${id}`);
    return response.data;
  },

  // Generate
  async generateCertificate(data: GenerateCertificateRequest): Promise<{ success: boolean; data: { template: CertificateTemplate; students: any[] } }> {
    const response = await apiClient.post('/certificate/generate-certificate', data);
    return response.data;
  },

  async generateIdCard(data: GenerateIdCardRequest): Promise<{ success: boolean; data: { template: IdCardTemplate; students: any[] } }> {
    const response = await apiClient.post('/certificate/generate-id-card', data);
    return response.data;
  },
};

