import { apiClient } from './apiClient';

export interface Notice {
  id: number;
  message_title: string;
  message: string;
  notice_date: string;
  publish_date: string;
  message_to: 'students' | 'guardians' | 'staff' | 'all';
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: number;
  subject: string;
  message: string;
  recipient_type: 'students' | 'guardians' | 'staff' | 'individual' | 'class' | 'birthday';
  recipient_ids?: string;
  recipient_emails?: string;
  sent_by: number;
  sent_by_name?: string;
  sent_at: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
}

export interface SMSLog {
  id: number;
  subject: string;
  message: string;
  recipient_type: 'students' | 'guardians' | 'staff' | 'individual' | 'class' | 'birthday';
  recipient_ids?: string;
  recipient_phones?: string;
  sent_by: number;
  sent_by_name?: string;
  sent_at: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
}

export const communicateService = {
  // Notice Board
  async getNotices(params?: {
    message_to?: 'students' | 'guardians' | 'staff' | 'all';
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Notice[]> {
    const response = await apiClient.get('/communicate/notices', { params });
    return response.data.data || [];
  },

  async getNoticeById(id: number): Promise<Notice> {
    const response = await apiClient.get(`/communicate/notices/${id}`);
    return response.data.data;
  },

  async createNotice(data: Partial<Notice>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/communicate/notices', data);
    return response.data;
  },

  async updateNotice(id: number, data: Partial<Notice>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/communicate/notices/${id}`, data);
    return response.data;
  },

  async deleteNotice(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/communicate/notices/${id}`);
    return response.data;
  },

  // Send Email
  async sendEmail(data: {
    subject: string;
    message: string;
    recipient_type: 'students' | 'guardians' | 'staff' | 'individual' | 'class' | 'birthday';
    recipient_ids?: number[];
    class_id?: number;
    section_id?: number;
  }): Promise<{ success: boolean; message: string; data: { success_count: number; fail_count: number } }> {
    const response = await apiClient.post('/communicate/email/send', data);
    return response.data;
  },

  // Send SMS
  async sendSMS(data: {
    subject: string;
    message: string;
    recipient_type: 'students' | 'guardians' | 'staff' | 'individual' | 'class' | 'birthday';
    recipient_ids?: number[];
    class_id?: number;
    section_id?: number;
  }): Promise<{ success: boolean; message: string; data: { success_count: number; fail_count: number } }> {
    const response = await apiClient.post('/communicate/sms/send', data);
    return response.data;
  },

  // Email Logs
  async getEmailLogs(params?: {
    recipient_type?: 'students' | 'guardians' | 'staff' | 'individual' | 'class' | 'birthday';
    status?: 'pending' | 'sent' | 'failed';
    date_from?: string;
    date_to?: string;
    search?: string;
  }): Promise<EmailLog[]> {
    const response = await apiClient.get('/communicate/email/logs', { params });
    return response.data.data || [];
  },

  // SMS Logs
  async getSMSLogs(params?: {
    recipient_type?: 'students' | 'guardians' | 'staff' | 'individual' | 'class' | 'birthday';
    status?: 'pending' | 'sent' | 'failed';
    date_from?: string;
    date_to?: string;
    search?: string;
  }): Promise<SMSLog[]> {
    const response = await apiClient.get('/communicate/sms/logs', { params });
    return response.data.data || [];
  },
};

