import express from 'express';
import { login, register, getCurrentUser, refreshToken } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
// import { authRateLimiter } from '../middleware/rateLimiter'; // Commented out - rate limiting disabled
import { validateBody } from '../middleware/validateRequest';
import { loginSchema, registerSchema } from '../validators/auth.validators';

const router = express.Router();

router.post('/login', /* authRateLimiter, */ validateBody(loginSchema), login);
router.post('/register', validateBody(registerSchema), register);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getCurrentUser);

export default router;

