import { apiClient } from './apiClient';

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  notes?: string | null;
  replied_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const contactMessagesService = {
  getMessages: async (status?: string): Promise<ContactMessage[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/contact-messages', { params });
    return response.data.data;
  },
  
  getMessage: async (id: number): Promise<ContactMessage> => {
    const response = await apiClient.get(`/contact-messages/${id}`);
    return response.data.data;
  },
  
  updateMessageStatus: async (id: number, data: { status: string; notes?: string }): Promise<ContactMessage> => {
    const response = await apiClient.put(`/contact-messages/${id}/status`, data);
    return response.data.data;
  },
  
  deleteMessage: async (id: number): Promise<void> => {
    await apiClient.delete(`/contact-messages/${id}`);
  },
};
