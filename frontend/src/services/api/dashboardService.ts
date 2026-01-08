import { apiClient } from './apiClient';

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  recentActivities: any[];
}

export const dashboardService = {
  async getStats(): Promise<{ success: boolean; data: DashboardStats }> {
    const response = await apiClient.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats');
    return response.data;
  },
};

