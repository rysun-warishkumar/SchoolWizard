import { apiClient } from './apiClient';
import { User } from '../types/auth';

export interface UpdateProfileData {
  name?: string;
  email?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const profileService = {
  async getProfile(): Promise<{ success: boolean; data: User }> {
    const response = await apiClient.get<{ success: boolean; data: User }>('/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<{ success: boolean; message: string; data: User }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: User }>('/profile', data);
    return response.data;
  },

  async changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/profile/change-password', data);
    return response.data;
  },

  async getUserPermissions(): Promise<{ success: boolean; data: Record<string, string[]> }> {
    const response = await apiClient.get<{ success: boolean; data: Record<string, string[]> }>('/profile/permissions');
    return response.data;
  },
};

