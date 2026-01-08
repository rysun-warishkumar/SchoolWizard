import { apiClient } from './apiClient';
import { User } from '../types/auth';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role_id: number;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const usersService = {
  async getUsers(params?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<UsersResponse> {
    const response = await apiClient.get<UsersResponse>('/users', { params });
    return response.data;
  },

  async getUserById(id: string): Promise<{ success: boolean; data: User }> {
    const response = await apiClient.get<{ success: boolean; data: User }>(`/users/${id}`);
    return response.data;
  },

  async createUser(data: CreateUserData): Promise<{ success: boolean; message: string; data: User }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: User }>('/users', data);
    return response.data;
  },

  async updateUser(id: string, data: UpdateUserData): Promise<{ success: boolean; message: string; data: User }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: User }>(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/users/${id}`);
    return response.data;
  },

  async toggleUserStatus(id: string): Promise<{ success: boolean; message: string; data: { id: string; is_active: boolean } }> {
    const response = await apiClient.patch<{ success: boolean; message: string; data: { id: string; is_active: boolean } }>(`/users/${id}/toggle-status`);
    return response.data;
  },
};

