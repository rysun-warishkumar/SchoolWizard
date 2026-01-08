import express from 'express';
import {
  getMissionVision, updateMissionVision,
  getCounters, createCounter, updateCounter, deleteCounter,
  getHistory, updateHistory, uploadHistoryImage,
  getValues, createValue, updateValue, deleteValue,
  getAchievements, createAchievement, updateAchievement, deleteAchievement,
  getLeadership, createLeader, updateLeader, deleteLeader, uploadLeaderImage,
} from '../controllers/aboutUsPage.controller';
import { authenticate, authorize } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = express.Router();

// All routes require authentication and admin/superadmin role
router.use(authenticate);
router.use(authorize('superadmin', 'admin'));

// Mission & Vision
router.get('/mission-vision', checkPermission('settings', 'view'), getMissionVision);
router.put('/mission-vision', checkPermission('settings', 'edit'), updateMissionVision);

// Counters
router.get('/counters', checkPermission('settings', 'view'), getCounters);
router.post('/counters', checkPermission('settings', 'add'), createCounter);
router.put('/counters/:id', checkPermission('settings', 'edit'), updateCounter);
router.delete('/counters/:id', checkPermission('settings', 'delete'), deleteCounter);

// History
router.get('/history', checkPermission('settings', 'view'), getHistory);
router.put('/history', checkPermission('settings', 'edit'), (req, res, next) => {
  uploadHistoryImage(req, res, (err: any) => {
    if (err) return next(err);
    updateHistory(req, res, next);
  });
});

// Core Values
router.get('/values', checkPermission('settings', 'view'), getValues);
router.post('/values', checkPermission('settings', 'add'), createValue);
router.put('/values/:id', checkPermission('settings', 'edit'), updateValue);
router.delete('/values/:id', checkPermission('settings', 'delete'), deleteValue);

// Achievements
router.get('/achievements', checkPermission('settings', 'view'), getAchievements);
router.post('/achievements', checkPermission('settings', 'add'), createAchievement);
router.put('/achievements/:id', checkPermission('settings', 'edit'), updateAchievement);
router.delete('/achievements/:id', checkPermission('settings', 'delete'), deleteAchievement);

// Leadership
router.get('/leadership', checkPermission('settings', 'view'), getLeadership);
router.post('/leadership', checkPermission('settings', 'add'), (req, res, next) => {
  uploadLeaderImage(req, res, (err: any) => {
    if (err) return next(err);
    createLeader(req, res, next);
  });
});
router.put('/leadership/:id', checkPermission('settings', 'edit'), (req, res, next) => {
  uploadLeaderImage(req, res, (err: any) => {
    if (err) return next(err);
    updateLeader(req, res, next);
  });
});
router.delete('/leadership/:id', checkPermission('settings', 'delete'), deleteLeader);

export default router;

