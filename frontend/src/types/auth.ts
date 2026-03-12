export interface User {
  id: string | number;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'accountant' | 'librarian' | 'receptionist' | 'superadmin';
  roleId: string | number;
  role_id?: number;
  schoolId?: number | null;
  schoolName?: string;
  schoolStatus?: string;
  trialEndsAt?: string | null;
  isPlatformAdmin?: boolean;
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
  school?: { id: number; name: string; status: string; trialEndsAt: string | null } | null;
  refreshToken?: string;
}

export interface RegisterSchoolData {
  schoolName: string;
  adminName: string;
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

