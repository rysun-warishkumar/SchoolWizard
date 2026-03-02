import express from 'express';
import { registerSchool } from '../controllers/publicSchools.controller';
import { validateBody } from '../middleware/validateRequest';
import { registerSchoolSchema } from '../validators/publicSchools.validators';

const router = express.Router();

router.post('/register', validateBody(registerSchoolSchema), registerSchool);

export default router;
