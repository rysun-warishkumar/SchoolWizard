import express from 'express';
import { login, register, getCurrentUser, refreshToken, forgotPassword, resetPassword, logout } from '../controllers/auth.controller';
import { authenticate, requirePlatformAdmin } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validateRequest';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validators';

const router = express.Router();

router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/register', authenticate, requirePlatformAdmin, authRateLimiter, validateBody(registerSchema), register);
router.post('/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authRateLimiter, validateBody(resetPasswordSchema), resetPassword);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

export default router;

