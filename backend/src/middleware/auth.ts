import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError, AuthenticationError } from './errorHandler';
import { env } from '../config/env';

// AuthRequest extends Request with user property
// Using type intersection to ensure all Request properties are available
export type AuthRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: string;
    roleId: string;
  };
  // Explicitly include Request properties to avoid TypeScript errors
  params: any;
  body: any;
  query: any;
  headers: any;
  file?: any;
  files?: any;
};

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    const jwtSecret = env.jwt.secret;

    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      email: string;
      role: string;
      roleId: string;
    };

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token expired. Please login again'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError('Not authorized', 403));
    }

    next();
  };
};

