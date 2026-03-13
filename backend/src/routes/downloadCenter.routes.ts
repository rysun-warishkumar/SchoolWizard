import express from 'express';
import {
  getDownloadContents,
  getDownloadContentById,
  createDownloadContent,
  updateDownloadContent,
  deleteDownloadContent,
  downloadFile,
  upload,
} from '../controllers/downloadCenter.controller';
import { authenticate, requireSchool } from '../middleware/auth';
import { checkPermission, checkPermissionOrStudentOwnData } from '../middleware/permissions';

const router = express.Router();

router.use(authenticate, requireSchool);

// Download Content Routes
router.get('/', checkPermissionOrStudentOwnData('download-center', 'view'), getDownloadContents);
router.get('/:id', checkPermissionOrStudentOwnData('download-center', 'view'), getDownloadContentById);
router.post(
  '/',
  checkPermission('download-center', 'add'),
  upload.single('file'),
  createDownloadContent
);
router.put(
  '/:id',
  checkPermission('download-center', 'edit'),
  upload.single('file'),
  updateDownloadContent
);
router.delete('/:id', checkPermission('download-center', 'delete'), deleteDownloadContent);
router.get('/:id/download', checkPermissionOrStudentOwnData('download-center', 'view'), downloadFile);

export default router;

