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
  storage_used_bytes?: number;
}

export interface TenantDomain {
  id: number;
  tenant_id: number;
  domain: string;
  domain_type: 'subdomain' | 'custom';
  verification_status: 'pending' | 'verified' | 'failed';
  dns_target: string | null;
  ssl_status: 'pending' | 'active' | 'failed';
  is_primary: boolean;
  is_active: boolean;
  verified_at: string | null;
}

export interface TenantEnvironment {
  id: number;
  tenant_id: number;
  environment_type: 'shared' | 'dedicated';
  environment_status: 'requested' | 'provisioning' | 'ready' | 'failed' | 'disabled';
  server_host: string | null;
  app_port: number | null;
  db_name: string | null;
  db_host: string | null;
  db_port: number | null;
  db_user: string | null;
  notes: string | null;
}

export interface TenantMigration {
  id: number;
  tenant_id: number;
  migration_status: string;
  source_environment_id: number | null;
  target_environment_id: number | null;
  validation_summary?: Record<string, number>;
}

export interface TenantEvent {
  id: number;
  event_type: string;
  event_message: string | null;
  created_at: string;
}

export interface SchoolControlPlaneData {
  tenant: {
    id: number;
    school_id: number;
    lifecycle_status: string;
    runtime_mode: 'shared' | 'dedicated';
    is_readonly_freeze: boolean;
  };
  domains: TenantDomain[];
  environments: TenantEnvironment[];
  migrations: TenantMigration[];
  events: TenantEvent[];
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

  async getSchoolControlPlane(id: number): Promise<{ success: boolean; data: SchoolControlPlaneData }> {
    const response = await apiClient.get<{ success: boolean; data: SchoolControlPlaneData }>(
      `/platform/schools/${id}/control-plane`
    );
    return response.data;
  },

  async registerDomain(
    id: number,
    data: { domain: string; domain_type?: 'subdomain' | 'custom'; dns_target?: string; is_primary?: boolean }
  ): Promise<{ success: boolean; data: { id: number } }> {
    const response = await apiClient.post<{ success: boolean; data: { id: number } }>(
      `/platform/schools/${id}/domains`,
      data
    );
    return response.data;
  },

  async updateDomain(
    id: number,
    domainId: number,
    data: Partial<Pick<TenantDomain, 'verification_status' | 'ssl_status' | 'is_active' | 'is_primary' | 'dns_target'>>
  ): Promise<{ success: boolean }> {
    const response = await apiClient.patch<{ success: boolean }>(
      `/platform/schools/${id}/domains/${domainId}`,
      data
    );
    return response.data;
  },

  async requestDedicatedProvision(
    id: number,
    data: Partial<Pick<TenantEnvironment, 'server_host' | 'app_port' | 'db_name' | 'db_host' | 'db_port' | 'db_user' | 'notes'>>
  ): Promise<{ success: boolean; data: { environment_id: number } }> {
    const response = await apiClient.post<{ success: boolean; data: { environment_id: number } }>(
      `/platform/schools/${id}/dedicated/provision`,
      data
    );
    return response.data;
  },

  async updateEnvironment(
    id: number,
    environmentId: number,
    data: Partial<TenantEnvironment>
  ): Promise<{ success: boolean }> {
    const response = await apiClient.patch<{ success: boolean }>(
      `/platform/schools/${id}/environments/${environmentId}`,
      data
    );
    return response.data;
  },

  async createMigration(
    id: number,
    data: { source_environment_id?: number; target_environment_id?: number }
  ): Promise<{ success: boolean; data: { migration_id: number } }> {
    const response = await apiClient.post<{ success: boolean; data: { migration_id: number } }>(
      `/platform/schools/${id}/migrations`,
      data
    );
    return response.data;
  },

  async runMigrationPrecheck(
    id: number,
    migrationId: number
  ): Promise<{ success: boolean; data: Record<string, number> }> {
    const response = await apiClient.post<{ success: boolean; data: Record<string, number> }>(
      `/platform/schools/${id}/migrations/${migrationId}/precheck`
    );
    return response.data;
  },

  async completeCutover(id: number, migrationId: number): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(
      `/platform/schools/${id}/migrations/${migrationId}/cutover`
    );
    return response.data;
  },

  async rollbackMigration(id: number, migrationId: number): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(
      `/platform/schools/${id}/migrations/${migrationId}/rollback`
    );
    return response.data;
  },

  async setReadOnlyFreeze(id: number, enabled: boolean): Promise<{ success: boolean }> {
    const response = await apiClient.patch<{ success: boolean }>(
      `/platform/schools/${id}/read-only-freeze`,
      { enabled }
    );
    return response.data;
  },
};
