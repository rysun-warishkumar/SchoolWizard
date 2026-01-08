import { apiClient } from './apiClient';

export interface IncomeHead {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: number;
  income_head_id: number;
  name: string;
  invoice_number?: string;
  date: string;
  amount: number;
  document_path?: string;
  description?: string;
  created_by?: number;
  income_head_name?: string;
  created_at: string;
  updated_at: string;
}

export const incomeService = {
  async getIncomeHeads(): Promise<IncomeHead[]> {
    const response = await apiClient.get('/income-heads');
    return response.data.data;
  },

  async createIncomeHead(data: { name: string; description?: string }): Promise<IncomeHead> {
    const response = await apiClient.post('/income-heads', data);
    return response.data.data;
  },

  async getIncome(params?: {
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Income[]; pagination: any }> {
    const response = await apiClient.get('/income', { params });
    return response.data;
  },

  async createIncome(data: {
    income_head_id: number;
    name: string;
    invoice_number?: string;
    date: string;
    amount: number;
    document_path?: string;
    description?: string;
  }): Promise<Income> {
    const response = await apiClient.post('/income', data);
    return response.data.data;
  },

  async getRecentIncome(limit?: number): Promise<Income[]> {
    const response = await apiClient.get('/income/recent', { params: { limit } });
    return response.data.data;
  },
};

