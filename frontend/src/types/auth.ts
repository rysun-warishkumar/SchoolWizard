export interface User {
  id: string | number;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'accountant' | 'librarian' | 'receptionist' | 'superadmin';
  roleId: string | number;
  role_id?: number;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
  permissions?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  refreshToken?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string;
}

