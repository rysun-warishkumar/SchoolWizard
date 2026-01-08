import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getUserPermissionsEndpoint,
} from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getProfile);
router.get('/permissions', getUserPermissionsEndpoint);
router.put('/', updateProfile);
router.post('/change-password', changePassword);

export default router;

