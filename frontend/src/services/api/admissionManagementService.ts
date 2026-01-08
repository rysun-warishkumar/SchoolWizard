import { apiClient } from './apiClient';

export interface AdmissionInquiry {
  id?: number;
  student_name: string;
  parent_name: string;
  email: string;
  phone: string;
  grade: string;
  previous_school?: string | null;
  address: string;
  message?: string | null;
  status: 'pending' | 'contacted' | 'approved' | 'rejected';
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ImportantDate {
  id?: number;
  title: string;
  date_value: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ContactDetails {
  id?: number;
  call_us_numbers: string; // JSON string
  email_us_addresses: string; // JSON string
  visit_us_address?: string | null;
  office_hours?: string | null;
  important_dates_visible: boolean;
  contact_details_visible: boolean;
}

export const admissionManagementService = {
  // Inquiries
  getInquiries: async (status?: string): Promise<AdmissionInquiry[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/admission/inquiries', { params });
    return response.data.data;
  },
  getInquiry: async (id: number): Promise<AdmissionInquiry> => {
    const response = await apiClient.get(`/admission/inquiries/${id}`);
    return response.data.data;
  },
  updateInquiryStatus: async (id: number, data: { status: string; notes?: string }): Promise<AdmissionInquiry> => {
    const response = await apiClient.put(`/admission/inquiries/${id}/status`, data);
    return response.data.data;
  },
  deleteInquiry: async (id: number): Promise<void> => {
    await apiClient.delete(`/admission/inquiries/${id}`);
  },

  // Important Dates
  getImportantDates: async (): Promise<ImportantDate[]> => {
    const response = await apiClient.get('/admission/important-dates');
    return response.data.data;
  },
  createImportantDate: async (data: Partial<ImportantDate>): Promise<ImportantDate> => {
    const response = await apiClient.post('/admission/important-dates', data);
    return response.data.data;
  },
  updateImportantDate: async (id: number, data: Partial<ImportantDate>): Promise<ImportantDate> => {
    const response = await apiClient.put(`/admission/important-dates/${id}`, data);
    return response.data.data;
  },
  deleteImportantDate: async (id: number): Promise<void> => {
    await apiClient.delete(`/admission/important-dates/${id}`);
  },

  // Contact Details
  getContactDetails: async (): Promise<ContactDetails> => {
    const response = await apiClient.get('/admission/contact-details');
    return response.data.data;
  },
  updateContactDetails: async (data: Partial<ContactDetails>): Promise<ContactDetails> => {
    const response = await apiClient.put('/admission/contact-details', data);
    return response.data.data;
  },
};

