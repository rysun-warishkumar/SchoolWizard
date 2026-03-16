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

export interface RegistrationPaymentConfig {
  gateway_name: 'phonepe';
  is_enabled: boolean;
  test_mode: boolean;
  merchant_id: string;
  salt_index: number;
  registration_amount: number;
  currency: string;
  api_base_url: string;
  redirect_url?: string;
  callback_url?: string;
  has_salt_key: boolean;
}

export interface RegistrationPaymentStatusItem {
  id: number;
  school_id: number;
  school_name: string;
  gateway_name: string;
  merchant_transaction_id: string;
  amount: number;
  currency: string;
  status: 'initiated' | 'success' | 'failed' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface AssistantLlmConfig {
  is_enabled: boolean;
  provider: 'gemini' | 'openai';
  model: string;
  timeout_ms: number;
  has_gemini_api_key: boolean;
  has_openai_api_key: boolean;
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

  async getRegistrationPaymentConfig(): Promise<{ success: boolean; data: RegistrationPaymentConfig }> {
    const response = await apiClient.get<{ success: boolean; data: RegistrationPaymentConfig }>(
      '/platform/payment/registration'
    );
    return response.data;
  },

  async updateRegistrationPaymentConfig(
    data: Partial<RegistrationPaymentConfig> & { salt_key?: string }
  ): Promise<{ success: boolean; message: string; data: RegistrationPaymentConfig }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: RegistrationPaymentConfig }>(
      '/platform/payment/registration',
      data
    );
    return response.data;
  },

  async getRegistrationPayments(params?: {
    status?: 'initiated' | 'success' | 'failed' | 'pending' | '';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: RegistrationPaymentStatusItem[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page != null) searchParams.set('page', String(params.page));
    if (params?.limit != null) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    const response = await apiClient.get<{
      success: boolean;
      data: RegistrationPaymentStatusItem[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(qs ? `/platform/payment/registration/status?${qs}` : '/platform/payment/registration/status');
    return response.data;
  },

  async getAssistantLlmConfig(): Promise<{ success: boolean; data: AssistantLlmConfig }> {
    const response = await apiClient.get<{ success: boolean; data: AssistantLlmConfig }>(
      '/platform/assistant/llm'
    );
    return response.data;
  },

  async updateAssistantLlmConfig(data: {
    is_enabled: boolean;
    provider: 'gemini' | 'openai';
    model?: string;
    timeout_ms?: number;
    gemini_api_key?: string;
    openai_api_key?: string;
  }): Promise<{ success: boolean; message: string; data: AssistantLlmConfig }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: AssistantLlmConfig }>(
      '/platform/assistant/llm',
      data
    );
    return response.data;
  },
};
