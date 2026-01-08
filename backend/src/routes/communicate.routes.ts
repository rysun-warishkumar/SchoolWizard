import express from 'express';
import {
  getNotices, getNoticeById, createNotice, updateNotice, deleteNotice,
  sendEmailToRecipients, sendSMSToRecipients,
  getEmailLogs, getSMSLogs,
} from '../controllers/communicate.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate);

// Notice Board Routes
router.get('/notices', checkPermission('communicate', 'view'), getNotices);
router.get('/notices/:id', checkPermission('communicate', 'view'), getNoticeById);
router.post('/notices', checkPermission('communicate', 'add'), createNotice);
router.put('/notices/:id', checkPermission('communicate', 'edit'), updateNotice);
router.delete('/notices/:id', checkPermission('communicate', 'delete'), deleteNotice);

// Send Email Routes
router.post('/email/send', checkPermission('communicate', 'add'), sendEmailToRecipients);

// Send SMS Routes
router.post('/sms/send', checkPermission('communicate', 'add'), sendSMSToRecipients);

// Log Routes
router.get('/email/logs', checkPermission('communicate', 'view'), getEmailLogs);
router.get('/sms/logs', checkPermission('communicate', 'view'), getSMSLogs);

export default router;

