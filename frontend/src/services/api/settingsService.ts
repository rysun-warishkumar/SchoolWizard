import { apiClient } from './apiClient';

export interface GeneralSettings {
  schoolName: string;
  schoolCode: string;
  address: string;
  phone: string;
  email: string;
  session: string;
  sessionStartMonth: string;
  attendanceType: string;
  biometricAttendance: boolean;
  language: string;
  dateFormat: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  currencySymbolPlace: string;
  admissionNoPrefix: string;
  admissionNoDigit: number;
  admissionStartFrom: number;
  autoStaffId: boolean;
  staffIdPrefix: string;
  staffNoDigit: number;
  staffIdStartFrom: number;
  duplicateFeesInvoice: boolean;
  feesDueDays: number;
  teacherRestrictedMode: boolean;
  onlineAdmission: boolean;
  printLogo: string;
  adminLogo: string;
  adminSmallLogo: string;
  appLogo: string;
  favicon: string;
  mobileAppApiUrl: string;
  mobileAppPrimaryColor: string;
  mobileAppSecondaryColor: string;
  androidAppRegistered: boolean;
}

export interface Session {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailSettings {
  id: number | null;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  is_enabled: boolean;
}

export const settingsService = {
  async getGeneralSettings(): Promise<{ success: boolean; data: GeneralSettings }> {
    const response = await apiClient.get<{ success: boolean; data: GeneralSettings }>('/settings/general');
    return response.data;
  },

  async updateGeneralSettings(data: Partial<GeneralSettings> | FormData): Promise<{ success: boolean; message: string; data: GeneralSettings }> {
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await apiClient.put<{ success: boolean; message: string; data: GeneralSettings }>('/settings/general', data, config);
    return response.data;
  },

  async getSessions(): Promise<{ success: boolean; data: Session[] }> {
    const response = await apiClient.get<{ success: boolean; data: Session[] }>('/settings/sessions');
    return response.data;
  },

  async createSession(data: { name: string; start_date: string; end_date: string; is_current?: boolean }): Promise<{ success: boolean; message: string; data: Session }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: Session }>('/settings/sessions', data);
    return response.data;
  },

  async updateSession(id: string, data: Partial<Session>): Promise<{ success: boolean; message: string; data: Session }> {
    const response = await apiClient.put<{ success: boolean; message: string; data: Session }>(`/settings/sessions/${id}`, data);
    return response.data;
  },

  async deleteSession(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/settings/sessions/${id}`);
    return response.data;
  },

  async getEmailSettings(): Promise<{ success: boolean; data: EmailSettings }> {
    const response = await apiClient.get<{ success: boolean; data: EmailSettings }>('/settings/email');
    return response.data;
  },

  async updateEmailSettings(data: Partial<EmailSettings>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>('/settings/email', data);
    return response.data;
  },

  async testEmailSettings(testEmail: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/settings/email/test', { test_email: testEmail });
    return response.data;
  },

  // Notification Settings
  async getNotificationSettings(): Promise<{ success: boolean; data: NotificationSetting[] }> {
    const response = await apiClient.get<{ success: boolean; data: NotificationSetting[] }>('/settings/notifications');
    return response.data;
  },

  async updateNotificationSettings(notifications: NotificationSetting[]): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>('/settings/notifications', { notifications });
    return response.data;
  },

  // SMS Settings
  async getSMSSettings(): Promise<{ success: boolean; data: SMSSetting[] }> {
    const response = await apiClient.get<{ success: boolean; data: SMSSetting[] }>('/settings/sms');
    return response.data;
  },

  async createSMSSettings(data: Partial<SMSSetting>): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { id: number } }>('/settings/sms', data);
    return response.data;
  },

  async updateSMSSettings(id: string, data: Partial<SMSSetting>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(`/settings/sms/${id}`, data);
    return response.data;
  },

  async deleteSMSSettings(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/settings/sms/${id}`);
    return response.data;
  },

  // Payment Gateway Settings
  async getPaymentGateways(): Promise<{ success: boolean; data: PaymentGateway[] }> {
    const response = await apiClient.get<{ success: boolean; data: PaymentGateway[] }>('/settings/payment-gateways');
    return response.data;
  },

  async createPaymentGateway(data: Partial<PaymentGateway>): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { id: number } }>('/settings/payment-gateways', data);
    return response.data;
  },

  async updatePaymentGateway(id: string, data: Partial<PaymentGateway>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(`/settings/payment-gateways/${id}`, data);
    return response.data;
  },

  async deletePaymentGateway(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/settings/payment-gateways/${id}`);
    return response.data;
  },

  // Print Settings
  async getPrintSettings(): Promise<{ success: boolean; data: PrintSettings }> {
    const response = await apiClient.get<{ success: boolean; data: PrintSettings }>('/settings/print');
    return response.data;
  },

  async updatePrintSettings(data: { header_image?: string; footer_text?: string }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>('/settings/print', data);
    return response.data;
  },

  // Front CMS Settings
  async getFrontCMSSettings(): Promise<{ success: boolean; data: FrontCMSSettings }> {
    const response = await apiClient.get<{ success: boolean; data: FrontCMSSettings }>('/settings/front-cms');
    return response.data;
  },

  async updateFrontCMSSettings(data: Partial<FrontCMSSettings> | FormData): Promise<{ success: boolean; message: string }> {
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await apiClient.put<{ success: boolean; message: string }>('/settings/front-cms', data, config);
    return response.data;
  },

  // Languages
  async getLanguages(): Promise<{ success: boolean; data: Language[] }> {
    const response = await apiClient.get<{ success: boolean; data: Language[] }>('/settings/languages');
    return response.data;
  },

  async createLanguage(data: Partial<Language>): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { id: number } }>('/settings/languages', data);
    return response.data;
  },

  async updateLanguage(id: string, data: Partial<Language>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(`/settings/languages/${id}`, data);
    return response.data;
  },

  async deleteLanguage(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/settings/languages/${id}`);
    return response.data;
  },

  // Modules Settings
  async getModulesSettings(): Promise<{ success: boolean; data: Module[] }> {
    const response = await apiClient.get<{ success: boolean; data: Module[] }>('/settings/modules');
    return response.data;
  },

  async updateModuleStatus(id: string, is_active: boolean): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(`/settings/modules/${id}/status`, { is_active });
    return response.data;
  },

  // Custom Fields
  async getCustomFields(field_belongs_to?: string): Promise<{ success: boolean; data: CustomField[] }> {
    const params = field_belongs_to ? `?field_belongs_to=${field_belongs_to}` : '';
    const response = await apiClient.get<{ success: boolean; data: CustomField[] }>(`/settings/custom-fields${params}`);
    return response.data;
  },

  async createCustomField(data: Partial<CustomField>): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { id: number } }>('/settings/custom-fields', data);
    return response.data;
  },

  async updateCustomField(id: string, data: Partial<CustomField>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(`/settings/custom-fields/${id}`, data);
    return response.data;
  },

  async deleteCustomField(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/settings/custom-fields/${id}`);
    return response.data;
  },

  // System Fields
  async getSystemFields(field_belongs_to?: string): Promise<{ success: boolean; data: SystemField[] }> {
    const params = field_belongs_to ? `?field_belongs_to=${field_belongs_to}` : '';
    const response = await apiClient.get<{ success: boolean; data: SystemField[] }>(`/settings/system-fields${params}`);
    return response.data;
  },

  async updateSystemFieldStatus(id: string, is_enabled: boolean): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(`/settings/system-fields/${id}/status`, { is_enabled });
    return response.data;
  },

  // Backup & Restore
  async getBackupRecords(): Promise<{ success: boolean; data: BackupRecord[] }> {
    const response = await apiClient.get<{ success: boolean; data: BackupRecord[] }>('/settings/backups');
    return response.data;
  },

  async createBackup(): Promise<{ success: boolean; message: string; data: { backupName: string; filePath: string; fileSize: number } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { backupName: string; filePath: string; fileSize: number } }>('/settings/backups/create');
    return response.data;
  },

  async downloadBackup(id: string): Promise<Blob> {
    const response = await apiClient.get(`/settings/backups/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async restoreBackup(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/settings/backups/${id}/restore`);
    return response.data;
  },

  async deleteBackup(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/settings/backups/${id}`);
    return response.data;
  },

  async getBackupSettings(): Promise<{ success: boolean; data: BackupSettings }> {
    const response = await apiClient.get<{ success: boolean; data: BackupSettings }>('/settings/backup-settings');
    return response.data;
  },

  async updateBackupSettings(data: Partial<BackupSettings>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>('/settings/backup-settings', data);
    return response.data;
  },

  async generateCronSecretKey(): Promise<{ success: boolean; message: string; data: { cron_secret_key: string } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { cron_secret_key: string } }>('/settings/backup-settings/generate-cron-key');
    return response.data;
  },
};

export interface NotificationSetting {
  id: number;
  event_name: string;
  display_name: string;
  description: string;
  email_enabled_student: boolean;
  email_enabled_guardian: boolean;
  email_enabled_staff: boolean;
  sms_enabled_student: boolean;
  sms_enabled_guardian: boolean;
  sms_enabled_staff: boolean;
}

export interface SMSSetting {
  id: number;
  sms_gateway: string;
  sms_api_key?: string;
  sms_api_secret?: string;
  sms_sender_id?: string;
  sms_username?: string;
  sms_password?: string;
  sms_url?: string;
  is_enabled: boolean;
}

export interface PaymentGateway {
  id: number;
  gateway_name: string;
  display_name: string;
  api_key?: string;
  api_secret?: string;
  merchant_id?: string;
  test_mode: boolean;
  is_enabled: boolean;
}

export interface PrintSettings {
  header: {
    id: number;
    header_image: string | null;
    footer_text: string;
  } | null;
  footer: {
    id: number;
    header_image: string | null;
    footer_text: string;
  } | null;
}

export interface FrontCMSSettings {
  id: number | null;
  is_enabled: boolean;
  sidebar_enabled: boolean;
  rtl_mode: boolean;
  logo: string | null;
  favicon: string | null;
  footer_text: string;
  address: string;
  google_analytics: string;
  facebook_url: string;
  twitter_url: string;
  youtube_url: string;
  linkedin_url: string;
  instagram_url: string;
  pinterest_url: string;
  whatsapp_url: string;
  current_theme: string;
}

export interface Language {
  id: number;
  name: string;
  code: string;
  is_default: boolean;
  is_active: boolean;
}

export interface Module {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  display_order: number;
}

export interface CustomField {
  id: number;
  field_belongs_to: 'student' | 'staff';
  field_type: string;
  field_name: string;
  field_label: string;
  field_values: string | null;
  grid_column: number;
  is_required: boolean;
  is_visible: boolean;
  display_order: number;
}

export interface SystemField {
  id: number;
  field_belongs_to: 'student' | 'staff';
  field_name: string;
  field_label: string;
  is_enabled: boolean;
  display_order: number;
}

export interface BackupRecord {
  id: number;
  backup_name: string;
  file_path: string;
  file_size: number;
  backup_type: 'manual' | 'automatic';
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
}

export interface BackupSettings {
  id: number | null;
  auto_backup_enabled: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  backup_time: string;
  keep_backups: number;
  cron_secret_key: string | null;
  last_backup_at: string | null;
}

