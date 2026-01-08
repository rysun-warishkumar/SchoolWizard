import express from 'express';
import {
  getGeneralSettings,
  updateGeneralSettings,
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getEmailSettings,
  updateEmailSettings,
  testEmailSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getSMSSettings,
  createSMSSettings,
  updateSMSSettings,
  deleteSMSSettings,
  getPaymentGateways,
  createPaymentGateway,
  updatePaymentGateway,
  deletePaymentGateway,
  getPrintSettings,
  updatePrintSettings,
  getFrontCMSSettings,
  updateFrontCMSSettings,
  uploadFrontCmsFiles,
  uploadGeneralSettingsFiles,
  getLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  getModulesSettings,
  updateModuleStatus,
  getCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  getSystemFields,
  updateSystemFieldStatus,
  getBackupRecords,
  createBackup,
  downloadBackup,
  restoreBackup,
  deleteBackup,
  getBackupSettings,
  updateBackupSettings,
  generateCronSecretKey,
  uploadBackup,
} from '../controllers/settings.controller';
import { authenticate, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// General Settings - Only for admin/superadmin
router.get('/general', authorize('superadmin', 'admin'), checkPermission('settings', 'view'), getGeneralSettings);
router.put('/general', authorize('superadmin', 'admin'), checkPermission('settings', 'edit'), (req, res, next) => {
  uploadGeneralSettingsFiles(req, res, (err: any) => {
    if (err) {
      return next(err);
    }
    updateGeneralSettings(req, res, next);
  });
});

// Session Settings
// Allow all authenticated users to read sessions (needed for homework, exams, etc.)
router.get('/sessions', getSessions);
// Only admin/superadmin can modify sessions
router.post('/sessions', authorize('superadmin', 'admin'), checkPermission('settings', 'add'), createSession);
router.put('/sessions/:id', authorize('superadmin', 'admin'), checkPermission('settings', 'edit'), updateSession);
router.delete('/sessions/:id', authorize('superadmin', 'admin'), checkPermission('settings', 'delete'), deleteSession);

// Email Settings
router.get('/email', checkPermission('settings', 'view'), getEmailSettings);
router.put('/email', checkPermission('settings', 'edit'), updateEmailSettings);
router.post('/email/test', checkPermission('settings', 'view'), testEmailSettings);

// Notification Settings
router.get('/notifications', checkPermission('settings', 'view'), getNotificationSettings);
router.put('/notifications', checkPermission('settings', 'edit'), updateNotificationSettings);

// SMS Settings
router.get('/sms', checkPermission('settings', 'view'), getSMSSettings);
router.post('/sms', checkPermission('settings', 'add'), createSMSSettings);
router.put('/sms/:id', checkPermission('settings', 'edit'), updateSMSSettings);
router.delete('/sms/:id', checkPermission('settings', 'delete'), deleteSMSSettings);

// Payment Gateway Settings
router.get('/payment-gateways', checkPermission('settings', 'view'), getPaymentGateways);
router.post('/payment-gateways', checkPermission('settings', 'add'), createPaymentGateway);
router.put('/payment-gateways/:id', checkPermission('settings', 'edit'), updatePaymentGateway);
router.delete('/payment-gateways/:id', checkPermission('settings', 'delete'), deletePaymentGateway);

// Print Settings
router.get('/print', checkPermission('settings', 'view'), getPrintSettings);
router.put('/print', checkPermission('settings', 'edit'), updatePrintSettings);

// Front CMS Settings
router.get('/front-cms', checkPermission('settings', 'view'), getFrontCMSSettings);
router.put('/front-cms', checkPermission('settings', 'edit'), (req, res, next) => {
  uploadFrontCmsFiles(req, res, (err: any) => {
    if (err) {
      return next(err);
    }
    updateFrontCMSSettings(req, res, next);
  });
});

// Languages
router.get('/languages', checkPermission('settings', 'view'), getLanguages);
router.post('/languages', checkPermission('settings', 'add'), createLanguage);
router.put('/languages/:id', checkPermission('settings', 'edit'), updateLanguage);
router.delete('/languages/:id', checkPermission('settings', 'delete'), deleteLanguage);

// Modules Settings
router.get('/modules', checkPermission('settings', 'view'), getModulesSettings);
router.put('/modules/:id/status', checkPermission('settings', 'edit'), updateModuleStatus);

// Custom Fields
router.get('/custom-fields', checkPermission('settings', 'view'), getCustomFields);
router.post('/custom-fields', checkPermission('settings', 'add'), createCustomField);
router.put('/custom-fields/:id', checkPermission('settings', 'edit'), updateCustomField);
router.delete('/custom-fields/:id', checkPermission('settings', 'delete'), deleteCustomField);

// System Fields
router.get('/system-fields', checkPermission('settings', 'view'), getSystemFields);
router.put('/system-fields/:id/status', checkPermission('settings', 'edit'), updateSystemFieldStatus);

// Backup & Restore
router.get('/backups', checkPermission('settings', 'view'), getBackupRecords);
router.post('/backups/create', checkPermission('settings', 'add'), createBackup);
router.get('/backups/:id/download', checkPermission('settings', 'view'), downloadBackup);
router.post('/backups/:id/restore', checkPermission('settings', 'edit'), restoreBackup);
router.delete('/backups/:id', checkPermission('settings', 'delete'), deleteBackup);
router.get('/backup-settings', checkPermission('settings', 'view'), getBackupSettings);
router.put('/backup-settings', checkPermission('settings', 'edit'), updateBackupSettings);
router.post('/backup-settings/generate-cron-key', checkPermission('settings', 'edit'), generateCronSecretKey);
router.post('/backups/upload', checkPermission('settings', 'add'), uploadBackup);

export default router;

