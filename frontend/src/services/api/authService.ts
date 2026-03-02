import { apiClient } from './apiClient';
import { LoginCredentials, LoginResponse, RegisterData, RegisterSchoolData, User } from '../../types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<{
      success: boolean;
      token: string;
      user: User;
      school?: { id: number; name: string; status: string; trialEndsAt: string | null } | null;
    }>('/auth/login', credentials);
    if (response.data.success) {
      return {
        token: response.data.token,
        user: response.data.user,
        school: response.data.school ?? undefined,
      };
    }
    throw new Error('Login failed');
  },

  async registerSchool(data: RegisterSchoolData): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/public/schools/register',
      data
    );
    if (response.data.success) {
      return { success: true, message: response.data.message };
    }
    throw new Error('School registration failed');
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/register', data);
    if (response.data.success) {
      return {
        token: response.data.token,
        user: response.data.user,
      };
    }
    throw new Error('Registration failed');
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
    if (response.data.success) {
      return response.data.user;
    }
    throw new Error('Failed to get current user');
  },

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    const response = await apiClient.post<{ token: string }>('/auth/refresh', { refreshToken });
    return response.data;
  },
};

