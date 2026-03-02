import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError, AuthenticationError } from './errorHandler';
import { env } from '../config/env';

// AuthRequest extends Request with user property
export type AuthRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: string;
    roleId: string;
    schoolId?: number | null;
    isPlatformAdmin?: boolean;
  };
  params: any;
  body: any;
  query: any;
  headers: any;
  file?: any;
  files?: any;
};

/**
 * Get the school ID for the current request (tenant scope).
 * Returns null for platform admin (school_id IS NULL).
 */
export function getSchoolId(req: AuthRequest): number | null {
  if (!req.user?.schoolId) return null;
  const id = req.user.schoolId;
  return typeof id === 'number' ? id : Number(id);
}

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
      schoolId?: number;
      isPlatformAdmin?: boolean;
    };

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      roleId: decoded.roleId,
      schoolId: decoded.schoolId ?? null,
      isPlatformAdmin: decoded.isPlatformAdmin,
    };
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

/**
 * Restrict access to platform superadmin only (role superadmin and school_id IS NULL).
 * Use for /api/v1/platform/* routes.
 */
export const requirePlatformAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AuthenticationError('Not authenticated'));
  }
  if (req.user.role !== 'superadmin' || req.user.schoolId != null) {
    return next(createError('Platform admin access only', 403));
  }
  next();
};

/**
 * Require that the user belongs to a school (tenant). Use on all tenant-scoped routes.
 * Platform admin (school_id IS NULL) gets 403 so they cannot see other schools' data.
 */
export const requireSchool = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AuthenticationError('Not authenticated'));
  }
  const schoolId = getSchoolId(req);
  if (schoolId == null) {
    return next(createError('School context required. Use Platform Admin for platform management.', 403));
  }
  next();
};

