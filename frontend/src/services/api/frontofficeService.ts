import { apiClient } from './apiClient';

export interface Purpose {
  id: number;
  name: string;
  description?: string;
}

export interface ComplainType {
  id: number;
  name: string;
  description?: string;
}

export interface Source {
  id: number;
  name: string;
  description?: string;
}

export interface Reference {
  id: number;
  name: string;
  description?: string;
}

export interface AdmissionEnquiry {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  note?: string;
  enquiry_date: string;
  next_follow_up_date?: string;
  assigned_to?: number;
  reference_id?: number;
  source_id?: number;
  class_id?: number;
  number_of_child: number;
  status: 'pending' | 'contacted' | 'enrolled' | 'rejected';
  class_name?: string;
  source_name?: string;
  reference_name?: string;
  assigned_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Visitor {
  id: number;
  purpose_id?: number;
  name: string;
  phone?: string;
  id_card?: string;
  number_of_person: number;
  visit_date: string;
  in_time: string;
  out_time?: string;
  note?: string;
  purpose_name?: string;
  created_at: string;
}

export interface PhoneCallLog {
  id: number;
  name: string;
  phone: string;
  call_date: string;
  call_time?: string;
  description?: string;
  next_follow_up_date?: string;
  call_duration?: string;
  note?: string;
  call_type: 'incoming' | 'outgoing';
  created_at: string;
}

export interface PostalDispatch {
  id: number;
  to_title: string;
  reference_no?: string;
  address?: string;
  note?: string;
  from_title?: string;
  dispatch_date: string;
  document_path?: string;
  created_at: string;
}

export interface PostalReceive {
  id: number;
  from_title: string;
  reference_no?: string;
  address?: string;
  note?: string;
  to_title?: string;
  receive_date: string;
  document_path?: string;
  created_at: string;
}

export interface Complain {
  id: number;
  complain_type_id?: number;
  source_id?: number;
  complain_by: string;
  phone?: string;
  complain_date: string;
  description: string;
  action_taken?: string;
  assigned_to?: number;
  note?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  complain_type_name?: string;
  source_name?: string;
  assigned_name?: string;
  created_at: string;
  updated_at: string;
}

export const frontofficeService = {
  // Setup - Purposes
  async getPurposes(): Promise<{ success: boolean; data: Purpose[] }> {
    const response = await apiClient.get<{ success: boolean; data: Purpose[] }>('/front-office/purposes');
    return response.data;
  },

  async createPurpose(data: { name: string; description?: string }): Promise<{ success: boolean; message: string; data: Purpose }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: Purpose }>('/front-office/purposes', data);
    return response.data;
  },

  // Setup - Complain Types
  async getComplainTypes(): Promise<{ success: boolean; data: ComplainType[] }> {
    const response = await apiClient.get<{ success: boolean; data: ComplainType[] }>('/front-office/complain-types');
    return response.data;
  },

  async createComplainType(data: { name: string; description?: string }): Promise<{ success: boolean; message: string; data: ComplainType }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: ComplainType }>('/front-office/complain-types', data);
    return response.data;
  },

  // Setup - Sources
  async getSources(): Promise<{ success: boolean; data: Source[] }> {
    const response = await apiClient.get<{ success: boolean; data: Source[] }>('/front-office/sources');
    return response.data;
  },

  async createSource(data: { name: string; description?: string }): Promise<{ success: boolean; message: string; data: Source }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: Source }>('/front-office/sources', data);
    return response.data;
  },

  // Setup - References
  async getReferences(): Promise<{ success: boolean; data: Reference[] }> {
    const response = await apiClient.get<{ success: boolean; data: Reference[] }>('/front-office/references');
    return response.data;
  },

  async createReference(data: { name: string; description?: string }): Promise<{ success: boolean; message: string; data: Reference }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: Reference }>('/front-office/references', data);
    return response.data;
  },

  // Admission Enquiries
  async getAdmissionEnquiries(params?: { status?: string; source_id?: number; search?: string }): Promise<{ success: boolean; data: AdmissionEnquiry[] }> {
    const response = await apiClient.get<{ success: boolean; data: AdmissionEnquiry[] }>('/front-office/admission-enquiries', { params });
    return response.data;
  },

  async createAdmissionEnquiry(data: Partial<AdmissionEnquiry>): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { id: number } }>('/front-office/admission-enquiries', data);
    return response.data;
  },

  async updateAdmissionEnquiry(id: string, data: Partial<AdmissionEnquiry>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(`/front-office/admission-enquiries/${id}`, data);
    return response.data;
  },

  async deleteAdmissionEnquiry(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/front-office/admission-enquiries/${id}`);
    return response.data;
  },

  async addEnquiryFollowUp(id: string, data: { follow_up_date: string; next_follow_up_date?: string; response?: string; note?: string }): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { id: number } }>(`/front-office/admission-enquiries/${id}/follow-up`, data);
    return response.data;
  },

  // Visitors
  async getVisitors(params?: { date?: string; search?: string }): Promise<{ success: boolean; data: Visitor[] }> {
    const response = await apiClient.get<{ success: boolean; data: Visitor[] }>('/front-office/visitors', { params });
    return response.data;
  },

  async createVisitor(data: Partial<Visitor>): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { id: number } }>('/front-office/visitors', data);
    return response.data;
  },

  async updateVisitor(id: string, data: { out_time: string }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(`/front-office/visitors/${id}`, data);
    return response.data;
  },

  // Phone Call Logs
  async getPhoneCallLogs(params?: { date?: string; call_type?: string; search?: string }): Promise<{ success: boolean; data: PhoneCallLog[] }> {
    const response = await apiClient.get<{ success: boolean; data: PhoneCallLog[] }>('/front-office/phone-call-logs', { params });
    return response.data;
  },

  async createPhoneCallLog(data: Partial<PhoneCallLog>): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { id: number } }>('/front-office/phone-call-logs', data);
    return response.data;
  },

  // Postal Dispatch
  async getPostalDispatch(params?: { date?: string; search?: string }): Promise<{ success: boolean; data: PostalDispatch[] }> {
    const response = await apiClient.get<{ success: boolean; data: PostalDispatch[] }>('/front-office/postal-dispatch', { params });
    return response.data;
  },

  async createPostalDispatch(data: Partial<PostalDispatch>): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { id: number } }>('/front-office/postal-dispatch', data);
    return response.data;
  },

  // Postal Receive
  async getPostalReceive(params?: { date?: string; search?: string }): Promise<{ success: boolean; data: PostalReceive[] }> {
    const response = await apiClient.get<{ success: boolean; data: PostalReceive[] }>('/front-office/postal-receive', { params });
    return response.data;
  },

  async createPostalReceive(data: Partial<PostalReceive>): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { id: number } }>('/front-office/postal-receive', data);
    return response.data;
  },

  // Complains
  async getComplains(params?: { status?: string; complain_type_id?: number; source_id?: number; search?: string }): Promise<{ success: boolean; data: Complain[] }> {
    const response = await apiClient.get<{ success: boolean; data: Complain[] }>('/front-office/complains', { params });
    return response.data;
  },

  async createComplain(data: Partial<Complain>): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { id: number } }>('/front-office/complains', data);
    return response.data;
  },

  async updateComplain(id: string, data: Partial<Complain>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(`/front-office/complains/${id}`, data);
    return response.data;
  },
};

