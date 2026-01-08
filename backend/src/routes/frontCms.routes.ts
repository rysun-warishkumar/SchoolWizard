import express from 'express';
import {
  getMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getGalleries,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGallery,
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  getMedia,
  uploadMedia,
  deleteMedia,
  getBannerImages,
  createBannerImage,
  updateBannerImage,
  deleteBannerImage,
  upload,
} from '../controllers/frontCms.controller';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Menus
router.get('/menus', checkPermission('front-cms', 'view'), getMenus);
router.post('/menus', checkPermission('front-cms', 'add'), createMenu);
router.put('/menus/:id', checkPermission('front-cms', 'edit'), updateMenu);
router.delete('/menus/:id', checkPermission('front-cms', 'delete'), deleteMenu);

// Menu Items
router.get('/menus/:menuId/items', checkPermission('front-cms', 'view'), getMenuItems);
router.post('/menus/:menuId/items', checkPermission('front-cms', 'add'), createMenuItem);
router.put('/menu-items/:id', checkPermission('front-cms', 'edit'), updateMenuItem);
router.delete('/menu-items/:id', checkPermission('front-cms', 'delete'), deleteMenuItem);

// Pages
router.get('/pages', checkPermission('front-cms', 'view'), getPages);
router.get('/pages/:id', checkPermission('front-cms', 'view'), getPageById);
router.post('/pages', checkPermission('front-cms', 'add'), createPage);
router.put('/pages/:id', checkPermission('front-cms', 'edit'), updatePage);
router.delete('/pages/:id', checkPermission('front-cms', 'delete'), deletePage);

// Events
router.get('/events', checkPermission('front-cms', 'view'), getEvents);
router.get('/events/:id', checkPermission('front-cms', 'view'), getEventById);
router.post('/events', checkPermission('front-cms', 'add'), createEvent);
router.put('/events/:id', checkPermission('front-cms', 'edit'), updateEvent);
router.delete('/events/:id', checkPermission('front-cms', 'delete'), deleteEvent);

// Galleries
router.get('/galleries', checkPermission('front-cms', 'view'), getGalleries);
router.get('/galleries/:id', checkPermission('front-cms', 'view'), getGalleryById);
router.post('/galleries', checkPermission('front-cms', 'add'), createGallery);
router.put('/galleries/:id', checkPermission('front-cms', 'edit'), updateGallery);
router.delete('/galleries/:id', checkPermission('front-cms', 'delete'), deleteGallery);

// News
router.get('/news', checkPermission('front-cms', 'view'), getNews);
router.get('/news/:id', checkPermission('front-cms', 'view'), getNewsById);
router.post('/news', checkPermission('front-cms', 'add'), createNews);
router.put('/news/:id', checkPermission('front-cms', 'edit'), updateNews);
router.delete('/news/:id', checkPermission('front-cms', 'delete'), deleteNews);

// Media
router.get('/media', checkPermission('front-cms', 'view'), getMedia);
router.post('/media', checkPermission('front-cms', 'add'), upload.single('file'), uploadMedia);
router.delete('/media/:id', checkPermission('front-cms', 'delete'), deleteMedia);

// Banner Images
router.get('/banner-images', checkPermission('front-cms', 'view'), getBannerImages);
router.post('/banner-images', checkPermission('front-cms', 'add'), createBannerImage);
router.put('/banner-images/:id', checkPermission('front-cms', 'edit'), updateBannerImage);
router.delete('/banner-images/:id', checkPermission('front-cms', 'delete'), deleteBannerImage);

export default router;

