import { apiClient } from './apiClient';

export interface ItemCategory {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemStore {
  id: number;
  name: string;
  stock_code: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemSupplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemStock {
  id: number;
  item_id: number;
  item_name?: string;
  category_id: number;
  category_name?: string;
  supplier_id?: number;
  supplier_name?: string;
  store_id: number;
  store_name?: string;
  quantity: number;
  stock_date: string;
  document_path?: string;
  description?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemIssue {
  id: number;
  item_id: number;
  item_name?: string;
  category_id: number;
  category_name?: string;
  user_type: 'student' | 'staff';
  user_id: number;
  issue_by: string;
  issue_date: string;
  return_date?: string;
  quantity: number;
  note?: string;
  status: 'issued' | 'returned';
  returned_at?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export const inventoryService = {
  // Item Categories
  async getItemCategories(): Promise<ItemCategory[]> {
    const response = await apiClient.get('/inventory/categories');
    return response.data.data || [];
  },

  async createItemCategory(data: Partial<ItemCategory>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/inventory/categories', data);
    return response.data;
  },

  async updateItemCategory(id: number, data: Partial<ItemCategory>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/inventory/categories/${id}`, data);
    return response.data;
  },

  async deleteItemCategory(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/inventory/categories/${id}`);
    return response.data;
  },

  // Item Stores
  async getItemStores(): Promise<ItemStore[]> {
    const response = await apiClient.get('/inventory/stores');
    return response.data.data || [];
  },

  async createItemStore(data: Partial<ItemStore>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/inventory/stores', data);
    return response.data;
  },

  async updateItemStore(id: number, data: Partial<ItemStore>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/inventory/stores/${id}`, data);
    return response.data;
  },

  async deleteItemStore(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/inventory/stores/${id}`);
    return response.data;
  },

  // Item Suppliers
  async getItemSuppliers(): Promise<ItemSupplier[]> {
    const response = await apiClient.get('/inventory/suppliers');
    return response.data.data || [];
  },

  async createItemSupplier(data: Partial<ItemSupplier>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/inventory/suppliers', data);
    return response.data;
  },

  async updateItemSupplier(id: number, data: Partial<ItemSupplier>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/inventory/suppliers/${id}`, data);
    return response.data;
  },

  async deleteItemSupplier(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/inventory/suppliers/${id}`);
    return response.data;
  },

  // Items
  async getItems(params?: {
    category_id?: number;
    search?: string;
  }): Promise<Item[]> {
    const response = await apiClient.get('/inventory/items', { params });
    return response.data.data || [];
  },

  async createItem(data: Partial<Item>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/inventory/items', data);
    return response.data;
  },

  async updateItem(id: number, data: Partial<Item>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/inventory/items/${id}`, data);
    return response.data;
  },

  async deleteItem(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/inventory/items/${id}`);
    return response.data;
  },

  async getAvailableStock(itemId: number): Promise<{ item_id: number; available_stock: number }> {
    const response = await apiClient.get(`/inventory/items/${itemId}/available-stock`);
    return response.data.data;
  },

  // Item Stocks
  async getItemStocks(params?: {
    item_id?: number;
    category_id?: number;
    store_id?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<ItemStock[]> {
    const response = await apiClient.get('/inventory/stocks', { params });
    return response.data.data || [];
  },

  async createItemStock(data: Partial<ItemStock>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/inventory/stocks', data);
    return response.data;
  },

  async updateItemStock(id: number, data: Partial<ItemStock>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/inventory/stocks/${id}`, data);
    return response.data;
  },

  async deleteItemStock(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/inventory/stocks/${id}`);
    return response.data;
  },

  // Item Issues
  async getItemIssues(params?: {
    item_id?: number;
    category_id?: number;
    user_type?: 'student' | 'staff';
    user_id?: number;
    status?: 'issued' | 'returned';
    date_from?: string;
    date_to?: string;
  }): Promise<ItemIssue[]> {
    const response = await apiClient.get('/inventory/issues', { params });
    return response.data.data || [];
  },

  async createItemIssue(data: Partial<ItemIssue>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/inventory/issues', data);
    return response.data;
  },

  async returnItemIssue(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/inventory/issues/${id}/return`);
    return response.data;
  },

  async deleteItemIssue(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/inventory/issues/${id}`);
    return response.data;
  },
};

