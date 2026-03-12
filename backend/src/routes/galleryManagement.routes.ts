import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getImages,
  createImage,
  updateImage,
  deleteImage,
  galleryUpload,
} from '../controllers/galleryManagement.controller';
import { authenticate, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// Categories routes
router.get('/categories', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'view'), getCategories);
router.post('/categories', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'add'), createCategory);
router.put('/categories/:id', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'edit'), updateCategory);
router.delete('/categories/:id', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'delete'), deleteCategory);

// Images routes
router.get('/images', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'view'), getImages);
router.post('/images', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'add'), galleryUpload.single('image'), createImage);
router.put('/images/:id', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'edit'), galleryUpload.single('image'), updateImage);
router.delete('/images/:id', authenticate, authorize('superadmin', 'admin'), checkPermission('front-cms', 'delete'), deleteImage);

export default router;

