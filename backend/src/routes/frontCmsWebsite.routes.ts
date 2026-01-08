import express from 'express';
import {
  getWebsiteSettings,
  updateWebsiteSettings,
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadWebsiteLogo,
  uploadBannerImage,
} from '../controllers/frontCmsWebsite.controller';
import { authenticate, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication and admin/superadmin role
router.use(authenticate);
router.use(authorize('superadmin', 'admin'));

// Website Settings Routes
router.get('/settings', checkPermission('settings', 'view'), getWebsiteSettings);
router.put(
  '/settings',
  checkPermission('settings', 'edit'),
  uploadWebsiteLogo,
  updateWebsiteSettings
);

// Banner Routes
router.get('/banners', checkPermission('settings', 'view'), getBanners);
router.get('/banners/:id', checkPermission('settings', 'view'), getBanner);
router.post(
  '/banners',
  checkPermission('settings', 'add'),
  uploadBannerImage,
  createBanner
);
router.put(
  '/banners/:id',
  checkPermission('settings', 'edit'),
  uploadBannerImage,
  updateBanner
);
router.delete('/banners/:id', checkPermission('settings', 'delete'), deleteBanner);

export default router;

