import express from 'express';
import {
  getMissionVision,
  getCounters,
  getHistory,
  getValues,
  getAchievements,
  getLeadership,
} from '../controllers/aboutUsPage.controller';

const router = express.Router();

// Public routes - no authentication required
router.get('/mission-vision', getMissionVision);
router.get('/counters', getCounters);
router.get('/history', getHistory);
router.get('/values', getValues);
router.get('/achievements', getAchievements);
router.get('/leadership', getLeadership);

export default router;

