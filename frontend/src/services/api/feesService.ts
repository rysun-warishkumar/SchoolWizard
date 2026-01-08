import { apiClient } from './apiClient';

// ========== Types ==========
export interface FeesType {
  id: number;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface FeesGroup {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  fees_types?: FeesType[];
}

export interface FeesMaster {
  id: number;
  fees_group_id: number;
  fees_type_id: number;
  session_id: number;
  amount: number;
  due_date?: string;
  fine_type: 'percentage' | 'fixed';
  fine_amount: number;
  fees_group_name?: string;
  fees_type_name?: string;
  fees_type_code?: string;
  session_name?: string;
  created_at: string;
  updated_at: string;
}

export interface FeesDiscount {
  id: number;
  name: string;
  code: string;
  amount: number;
  discount_type: 'percentage' | 'fixed';
  description?: string;
  created_at: string;
  updated_at: string;
}

// ========== Fees Types ==========
export const getFeesTypes = async (): Promise<FeesType[]> => {
  const response = await apiClient.get('/fees/fees-types');
  return response.data.data;
};

export const createFeesType = async (data: {
  name: string;
  code: string;
  description?: string;
}): Promise<FeesType> => {
  const response = await apiClient.post('/fees/fees-types', data);
  return response.data.data;
};

// ========== Fees Groups ==========
export const getFeesGroups = async (): Promise<FeesGroup[]> => {
  const response = await apiClient.get('/fees/fees-groups');
  return response.data.data;
};

export const getFeesGroupById = async (id: number): Promise<FeesGroup> => {
  const response = await apiClient.get(`/fees/fees-groups/${id}`);
  return response.data.data;
};

export const createFeesGroup = async (data: {
  name: string;
  description?: string;
  fees_type_ids?: number[];
}): Promise<FeesGroup> => {
  const response = await apiClient.post('/fees/fees-groups', data);
  return response.data.data;
};

export const updateFeesGroup = async (
  id: number,
  data: {
    name: string;
    description?: string;
    fees_type_ids?: number[];
  }
): Promise<FeesGroup> => {
  const response = await apiClient.put(`/fees/fees-groups/${id}`, data);
  return response.data.data;
};

// ========== Fees Master ==========
export const getFeesMaster = async (params?: {
  session_id?: number;
}): Promise<FeesMaster[]> => {
  const response = await apiClient.get('/fees/fees-master', { params });
  return response.data.data;
};

export const createFeesMaster = async (data: {
  fees_group_id: number;
  fees_type_id: number;
  session_id: number;
  amount: number;
  due_date?: string;
  fine_type?: 'percentage' | 'fixed';
  fine_amount?: number;
}): Promise<FeesMaster> => {
  const response = await apiClient.post('/fees/fees-master', data);
  return response.data.data;
};

// ========== Fees Discounts ==========
export const getFeesDiscounts = async (): Promise<FeesDiscount[]> => {
  const response = await apiClient.get('/fees/fees-discounts');
  return response.data.data;
};

export const createFeesDiscount = async (data: {
  name: string;
  code: string;
  amount: number;
  discount_type?: 'percentage' | 'fixed';
  description?: string;
}): Promise<FeesDiscount> => {
  const response = await apiClient.post('/fees/fees-discounts', data);
  return response.data.data;
};

// ========== Fees Invoices ==========
export interface FeesInvoice {
  id: number;
  invoice_no: string;
  student_id: number;
  fees_master_id: number;
  session_id: number;
  amount: number;
  discount_amount: number;
  fine_amount: number;
  paid_amount: number;
  balance_amount: number;
  due_date?: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  fees_group_name?: string;
  fees_type_name?: string;
  fees_type_code?: string;
  created_at: string;
  updated_at: string;
}

export const getStudentFeesInvoices = async (params?: {
  student_id?: number;
  session_id?: number;
  status?: string;
}): Promise<FeesInvoice[]> => {
  const response = await apiClient.get('/fees/fees-invoices', { params });
  return response.data.data;
};

export const downloadInvoicePDF = async (invoiceId: number): Promise<void> => {
  const response = await apiClient.get(`/fees/fees-invoices/${invoiceId}/download-pdf`, {
    responseType: 'blob',
  });
  
  // Create blob URL and trigger download
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Extract filename from Content-Disposition header or use default
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'invoice.pdf';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ========== Fees Payments ==========
export interface FeesCarryForward {
  id: number;
  student_id: number;
  from_session_id: number;
  to_session_id: number;
  amount: number;
  due_date?: string;
  status: 'pending' | 'paid';
  admission_no?: string;
  first_name?: string;
  last_name?: string;
  class_id?: number;
  section_id?: number;
  class_name?: string;
  section_name?: string;
  from_session_name?: string;
  to_session_name?: string;
  created_at: string;
  updated_at: string;
}

export interface FeesReminderSetting {
  id: number;
  reminder_type: 'before_1' | 'before_2' | 'after_1' | 'after_2';
  is_active: boolean;
  days: number;
  created_at: string;
  updated_at: string;
}

export interface FeesReminderLog {
  id: number;
  fees_invoice_id: number;
  reminder_type: 'before_1' | 'before_2' | 'after_1' | 'after_2';
  sent_at: string;
  invoice_no?: string;
  student_id?: number;
  admission_no?: string;
  first_name?: string;
  last_name?: string;
}

export interface FeesPayment {
  id: number;
  payment_id: string;
  fees_invoice_id: number;
  student_id: number;
  payment_date: string;
  amount: number;
  discount_amount: number;
  fine_amount: number;
  payment_mode: 'cash' | 'cheque' | 'bank_transfer' | 'online' | 'card';
  note?: string;
  first_name?: string;
  last_name?: string;
  admission_no?: string;
  invoice_no?: string;
  fees_group_name?: string;
  fees_type_name?: string;
  created_at: string;
}

export const getFeesPayments = async (params?: {
  payment_id?: string;
  student_id?: number;
  date_from?: string;
  date_to?: string;
}): Promise<FeesPayment[]> => {
  const response = await apiClient.get('/fees/fees-payments', { params });
  return response.data.data;
};

export const createFeesPayment = async (data: {
  fees_invoice_id: number;
  student_id: number;
  payment_date: string;
  amount: number;
  discount_amount?: number;
  fine_amount?: number;
  payment_mode?: 'cash' | 'cheque' | 'bank_transfer' | 'online' | 'card';
  note?: string;
}): Promise<FeesPayment> => {
  const response = await apiClient.post('/fees/fees-payments', data);
  return response.data.data;
};

// ========== Fees Carry Forward ==========
export const getCarryForward = async (params?: {
  class_id?: number;
  section_id?: number;
  from_session_id?: number;
  to_session_id?: number;
}): Promise<FeesCarryForward[]> => {
  const response = await apiClient.get('/fees/carry-forward', { params });
  return response.data.data;
};

export const getStudentBalanceForCarryForward = async (params: {
  class_id?: number;
  section_id?: number;
  from_session_id: number;
  to_session_id: number;
}): Promise<any[]> => {
  const response = await apiClient.get('/fees/carry-forward/students', { params });
  return response.data.data;
};

export const createCarryForward = async (data: {
  student_id: number;
  from_session_id: number;
  to_session_id: number;
  amount: number;
  due_date?: string;
}): Promise<FeesCarryForward> => {
  const response = await apiClient.post('/fees/carry-forward', data);
  return response.data.data;
};

export const updateCarryForward = async (
  id: number,
  data: {
    amount?: number;
    due_date?: string;
  }
): Promise<FeesCarryForward> => {
  const response = await apiClient.put(`/fees/carry-forward/${id}`, data);
  return response.data.data;
};

// ========== Fees Reminder ==========
export const getFeesReminderSettings = async (): Promise<FeesReminderSetting[]> => {
  const response = await apiClient.get('/fees/reminder/settings');
  return response.data.data;
};

export const updateFeesReminderSettings = async (data: {
  reminder_type: 'before_1' | 'before_2' | 'after_1' | 'after_2';
  is_active: boolean;
  days: number;
}): Promise<FeesReminderSetting> => {
  const response = await apiClient.put('/fees/reminder/settings', data);
  return response.data.data;
};

export const getFeesReminderLogs = async (params?: {
  fees_invoice_id?: number;
  reminder_type?: 'before_1' | 'before_2' | 'after_1' | 'after_2';
  start_date?: string;
  end_date?: string;
}): Promise<FeesReminderLog[]> => {
  const response = await apiClient.get('/fees/reminder/logs', { params });
  return response.data.data;
};

// ========== Fees Group Assignments ==========
export interface FeesGroupAssignment {
  id: number;
  fees_group_id: number;
  session_id: number;
  class_id?: number;
  section_id?: number;
  student_id?: number;
  assigned_at: string;
  fees_group_name?: string;
  session_name?: string;
  class_name?: string;
  section_name?: string;
  admission_no?: string;
  student_first_name?: string;
  student_last_name?: string;
}

export const getFeesGroupAssignments = async (params?: {
  fees_group_id?: number;
  session_id?: number;
  class_id?: number;
  section_id?: number;
}): Promise<FeesGroupAssignment[]> => {
  const response = await apiClient.get('/fees/fees-group-assignments', { params });
  return response.data.data;
};

export const assignFeesGroup = async (data: {
  fees_group_id: number;
  session_id: number;
  class_id?: number;
  section_id?: number;
  student_ids?: number[];
}): Promise<{ success: boolean; message: string; data: { students_assigned: number; invoices_created: number } }> => {
  const response = await apiClient.post('/fees/fees-group-assignments', data);
  return response.data;
};

export const removeFeesGroupAssignment = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/fees/fees-group-assignments/${id}`);
  return response.data;
};

// Export as feesService object (similar to hrService)
export const feesService = {
  getFeesTypes,
  createFeesType,
  getFeesGroups,
  getFeesGroupById,
  createFeesGroup,
  updateFeesGroup,
  getFeesMaster,
  createFeesMaster,
  getFeesDiscounts,
  createFeesDiscount,
  getStudentFeesInvoices,
  getFeesPayments,
  createFeesPayment,
  getCarryForward,
  getStudentBalanceForCarryForward,
  createCarryForward,
  updateCarryForward,
  getFeesReminderSettings,
  updateFeesReminderSettings,
  getFeesReminderLogs,
  getFeesGroupAssignments,
  assignFeesGroup,
  removeFeesGroupAssignment,
  downloadInvoicePDF,
};

