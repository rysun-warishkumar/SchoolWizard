import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './errorHandler';

/**
 * Middleware to validate JSON request body
 */
export const validateJSON = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.is('application/json') && Object.keys(req.body).length === 0 && req.method !== 'GET') {
    return next(createError('Request body cannot be empty', 400));
  }
  next();
};

/**
 * Generic validation middleware factory
 * Usage: validate(schema) or validate(schema, 'body'|'query'|'params')
 */
export const validate = (
  schema: Joi.ObjectSchema | Joi.ArraySchema,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = source === 'body' ? req.body : source === 'query' ? req.query : req.params;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true, // Convert types (e.g., string to number)
    });

    if (error) {
      const errorMessages = error.details.map((detail) => {
        // Format error messages to be more user-friendly
        const field = detail.path.join('.');
        return `${field}: ${detail.message}`;
      }).join(', ');

      return next(createError(`Validation error: ${errorMessages}`, 400));
    }

    // Replace the original data with validated and sanitized data
    if (source === 'body') {
      req.body = value;
    } else if (source === 'query') {
      req.query = value;
    } else {
      req.params = value;
    }

    next();
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema: Joi.ObjectSchema | Joi.ArraySchema) => {
  return validate(schema, 'body');
};

/**
 * Validate request query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return validate(schema, 'query');
};

/**
 * Validate request route parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return validate(schema, 'params');
};

