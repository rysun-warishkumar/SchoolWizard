import rateLimit from 'express-rate-limit';
import { isDevelopment } from '../config/env';

// In development, use very lenient limits; in production, use stricter limits
const isDev = isDevelopment();

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 5000 : 100, // Much higher limit in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for chat endpoints (they have their own logic)
    return req.path.startsWith('/api/v1/chat');
  },
});

// More lenient rate limiter for chat endpoints
export const chatRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDev ? 200 : 30, // Higher limit in development
  message: 'Too many chat requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: isDev ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 minute in dev, 15 minutes in production
  max: isDev ? 50 : 5, // Much higher limit in development (50 per minute vs 5 per 15 minutes)
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

