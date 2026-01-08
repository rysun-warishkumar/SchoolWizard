import { apiClient } from './apiClient';

export interface Role {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
}

export interface Module {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  route_path?: string;
  parent_module_id?: number;
  display_order: number;
  is_active: boolean;
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
}

export interface ModulePermission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  route_path?: string;
  permissions: Array<{
    id: number;
    name: string;
    display_name: string;
    granted: boolean;
  }>;
}

export interface RolePermissions {
  roleId: number;
  roleName: string;
  modules: ModulePermission[];
}

export interface UpdatePermissionsData {
  permissions: Array<{
    module_id: number;
    permission_id: number;
    granted: boolean;
  }>;
}

export const rolesService = {
  async getRoles(): Promise<{ success: boolean; data: Role[] }> {
    const response = await apiClient.get<{ success: boolean; data: Role[] }>('/roles');
    return response.data;
  },

  async getRoleById(id: string): Promise<{ success: boolean; data: Role }> {
    const response = await apiClient.get<{ success: boolean; data: Role }>(`/roles/${id}`);
    return response.data;
  },

  async createRole(data: CreateRoleData): Promise<{ success: boolean; message: string; data: Role }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: Role }>('/roles', data);
    return response.data;
  },

  async updateRole(id: string, data: UpdateRoleData): Promise<{ success: boolean; message: string; data: Role }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: Role }>(`/roles/${id}`, data);
    return response.data;
  },

  async deleteRole(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/roles/${id}`);
    return response.data;
  },

  async getModules(): Promise<{ success: boolean; data: Module[] }> {
    const response = await apiClient.get<{ success: boolean; data: Module[] }>('/roles/modules');
    return response.data;
  },

  async getPermissions(): Promise<{ success: boolean; data: Permission[] }> {
    const response = await apiClient.get<{ success: boolean; data: Permission[] }>('/roles/permissions');
    return response.data;
  },

  async getRolePermissions(id: string): Promise<{ success: boolean; data: RolePermissions }> {
    const response = await apiClient.get<{ success: boolean; data: RolePermissions }>(`/roles/${id}/permissions`);
    return response.data;
  },

  async updateRolePermissions(id: string, data: UpdatePermissionsData): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(`/roles/${id}/permissions`, data);
    return response.data;
  },
};

