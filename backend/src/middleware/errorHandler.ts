import { Request, Response, NextFunction } from 'express';
import { isDevelopment, env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: any;
}

/**
 * Custom error classes for better error handling
 */
export class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends Error implements AppError {
  statusCode = 401;
  isOperational = true;

  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements AppError {
  statusCode = 403;
  isOperational = true;

  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  isOperational = true;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements AppError {
  statusCode = 409;
  isOperational = true;

  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export const errorHandler = (
  err: AppError | Error | any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Ensure CORS headers are set even on errors
  const origin = req.headers.origin;
  if (origin) {
    // Always allow localhost origins (any port) - for both development and production flexibility
    const isLocalhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i.test(origin) ||
                              origin.toLowerCase().includes('localhost') ||
                              origin.includes('127.0.0.1');
    
    if (isLocalhostOrigin || isDevelopment()) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    }
    
    // In production, check configured origins
    const allowedOrigins: string[] = [];
    
    if (env.cors.origin) {
      allowedOrigins.push(env.cors.origin.trim());
    }
    
    if (env.cors.origins) {
      const origins = env.cors.origins.split(',').map((o: string) => o.trim()).filter((o: string) => o.length > 0);
      allowedOrigins.push(...origins);
    }
    
    // Remove duplicates
    const uniqueOrigins = [...new Set(allowedOrigins)];
    
    // Normalize origin for comparison
    const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');
    const isAllowed = uniqueOrigins.some(allowed => {
      const normalizedAllowed = allowed.toLowerCase().replace(/\/$/, '');
      return normalizedOrigin === normalizedAllowed;
    });
    
    if (isAllowed) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    }
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body. Please check your request format.',
    });
    return;
  }

  // Handle MySQL errors
  if (err.code && err.code.startsWith('ER_')) {
    let message = 'Database error occurred';
    let statusCode = 500;

    switch (err.code) {
      case 'ER_DUP_ENTRY':
        if (err.message.includes('email')) {
          message = 'An account with this email already exists. Please use a different email address.';
        } else if (err.message.includes('admission_no')) {
          message = 'A student with this admission number already exists. Please use a different admission number.';
        } else {
          message = 'A record with this information already exists. Please check for duplicates.';
        }
        statusCode = 400;
        break;
      case 'ER_NO_REFERENCED_ROW_2':
        message = 'Invalid reference. One or more selected values do not exist in the system.';
        statusCode = 400;
        break;
      case 'ER_BAD_FIELD_ERROR':
        message = 'Invalid field in request. Please contact support.';
        statusCode = 500;
        break;
      case 'ER_DATA_TOO_LONG':
        message = 'One or more fields exceed the maximum allowed length.';
        statusCode = 400;
        break;
      case 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD':
        message = 'Invalid data format for one or more fields.';
        statusCode = 400;
        break;
      case 'ER_NO_SUCH_TABLE':
      case 'ER_BAD_TABLE_ERROR':
        message = 'Database table not found. Please run database migrations.';
        statusCode = 500;
        break;
      default:
        // Check if error message indicates table doesn't exist
        if (err.message && err.message.includes("doesn't exist")) {
          message = 'Database table not found. Please run database migrations.';
          statusCode = 500;
        } else {
          message = err.message || 'Database error occurred';
        }
    }

    console.error('Database Error:', {
      code: err.code,
      message: err.message,
      sqlMessage: err.sqlMessage,
      path: req.path,
      method: req.method,
    });

    const response: any = {
      success: false,
      message,
    };

    if (isDevelopment()) {
      response.stack = err.stack;
      response.sqlMessage = err.sqlMessage;
      response.code = err.code;
    }

    res.status(statusCode).json(response);
    return;
  }

  // Handle custom error classes
  if (err instanceof ValidationError || 
      err instanceof AuthenticationError || 
      err instanceof AuthorizationError || 
      err instanceof NotFoundError || 
      err instanceof ConflictError) {
    const statusCode = err.statusCode || 500;
    const response: any = {
      success: false,
      message: err.message,
    };

    if (err instanceof ValidationError && err.details) {
      response.details = err.details;
    }

    if (isDevelopment()) {
      response.stack = err.stack;
      response.name = err.name;
    }

    res.status(statusCode).json(response);
    return;
  }

  // Handle Joi validation errors
  if (err.isJoi) {
    const errorMessages = err.details.map((detail: any) => {
      const field = detail.path.join('.');
      return `${field}: ${detail.message}`;
    }).join(', ');

    res.status(400).json({
      success: false,
      message: `Validation error: ${errorMessages}`,
      ...(isDevelopment() && { details: err.details }),
    });
  }

  // Handle default errors
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error details
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    ...(err.code && { code: err.code }),
  });

  // Send error response
  const response: any = {
    success: false,
    message: statusCode === 500 && !isDevelopment() 
      ? 'An unexpected error occurred. Please try again later.' 
      : message,
  };

  // Include stack trace and additional details in development
  if (isDevelopment()) {
    response.stack = err.stack;
    if (err.code) {
      response.code = err.code;
    }
  }

  res.status(statusCode).json(response);
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

