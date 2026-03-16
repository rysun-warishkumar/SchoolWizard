import express from 'express';
import { handlePhonePeRegistrationCallback, registerSchool } from '../controllers/publicSchools.controller';
import { validateBody } from '../middleware/validateRequest';
import { registerSchoolSchema } from '../validators/publicSchools.validators';

const router = express.Router();

router.post('/register', validateBody(registerSchoolSchema), registerSchool);
router.post('/payment/phonepe/callback', handlePhonePeRegistrationCallback);
router.get('/payment/phonepe/callback', handlePhonePeRegistrationCallback);

export default router;
