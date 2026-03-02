import { apiClient } from './apiClient';

export interface PlatformSchool {
  id: number;
  name: string;
  slug: string;
  status: string;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  custom_domain: string | null;
  created_at: string;
  admin_email?: string | null;
  admin_name?: string | null;
}

export interface PlatformSchoolDetail extends PlatformSchool {
  updated_at?: string;
  students_count?: number;
  users_count?: number;
}

export interface ListSchoolsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListSchoolsResponse {
  success: boolean;
  data: PlatformSchool[];
  pagination: { page: number; limit: number; total: number };
}

export const platformService = {
  async getSchools(params: ListSchoolsParams = {}): Promise<ListSchoolsResponse> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);
    if (params.page != null) searchParams.set('page', String(params.page));
    if (params.limit != null) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    const url = qs ? `/platform/schools?${qs}` : '/platform/schools';
    const response = await apiClient.get<ListSchoolsResponse>(url);
    return response.data;
  },

  async getSchool(id: number): Promise<{ success: boolean; data: PlatformSchoolDetail }> {
    const response = await apiClient.get<{ success: boolean; data: PlatformSchoolDetail }>(`/platform/schools/${id}`);
    return response.data;
  },

  async updateSchool(
    id: number,
    data: { name?: string; status?: string; trial_ends_at?: string | null; custom_domain?: string | null }
  ): Promise<{ success: boolean; data: PlatformSchoolDetail }> {
    const response = await apiClient.patch<{ success: boolean; data: PlatformSchoolDetail }>(
      `/platform/schools/${id}`,
      data
    );
    return response.data;
  },
};
