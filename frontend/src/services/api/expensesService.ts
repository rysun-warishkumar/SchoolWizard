import { apiClient } from './apiClient';

export interface ExpenseHead {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  expense_head_id: number;
  name: string;
  invoice_number?: string;
  date: string;
  amount: number;
  document_path?: string;
  description?: string;
  created_by?: number;
  expense_head_name?: string;
  created_at: string;
  updated_at: string;
}

export const expensesService = {
  async getExpenseHeads(): Promise<ExpenseHead[]> {
    const response = await apiClient.get('/expense-heads');
    return response.data.data;
  },

  async createExpenseHead(data: { name: string; description?: string }): Promise<ExpenseHead> {
    const response = await apiClient.post('/expense-heads', data);
    return response.data.data;
  },

  async getExpenses(params?: {
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Expense[]; pagination: any }> {
    const response = await apiClient.get('/expenses', { params });
    return response.data;
  },

  async createExpense(data: {
    expense_head_id: number;
    name: string;
    invoice_number?: string;
    date: string;
    amount: number;
    document_path?: string;
    description?: string;
  }): Promise<Expense> {
    const response = await apiClient.post('/expenses', data);
    return response.data.data;
  },

  async getRecentExpenses(limit?: number): Promise<Expense[]> {
    const response = await apiClient.get('/expenses/recent', { params: { limit } });
    return response.data.data;
  },
};

