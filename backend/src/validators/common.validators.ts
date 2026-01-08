import Joi from 'joi';

/**
 * Common validation schemas used across the application
 */

// Email validation
export const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  });

// Password validation
export const passwordSchema = Joi.string()
  .min(6)
  .max(100)
  .required()
  .messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 100 characters',
    'any.required': 'Password is required',
  });

// Name validation
export const nameSchema = Joi.string()
  .trim()
  .min(2)
  .max(255)
  .required()
  .messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 255 characters',
    'any.required': 'Name is required',
  });

// ID validation (integer)
export const idSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'ID must be a number',
    'number.integer': 'ID must be an integer',
    'number.positive': 'ID must be a positive number',
    'any.required': 'ID is required',
  });

// Optional ID validation
export const optionalIdSchema = Joi.number()
  .integer()
  .positive()
  .optional()
  .allow(null)
  .messages({
    'number.base': 'ID must be a number',
    'number.integer': 'ID must be an integer',
    'number.positive': 'ID must be a positive number',
  });

// Pagination validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Date validation
export const dateSchema = Joi.date()
  .iso()
  .required()
  .messages({
    'date.base': 'Please provide a valid date',
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
    'any.required': 'Date is required',
  });

// Optional date validation
export const optionalDateSchema = Joi.date()
  .iso()
  .optional()
  .allow(null, '')
  .messages({
    'date.base': 'Please provide a valid date',
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
  });

// Phone number validation
export const phoneSchema = Joi.string()
  .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
  .optional()
  .allow(null, '')
  .messages({
    'string.pattern.base': 'Please provide a valid phone number',
  });

// URL validation
export const urlSchema = Joi.string()
  .uri()
  .optional()
  .allow(null, '')
  .messages({
    'string.uri': 'Please provide a valid URL',
  });

// Text/Description validation
export const textSchema = Joi.string()
  .trim()
  .max(10000)
  .optional()
  .allow(null, '')
  .messages({
    'string.max': 'Text cannot exceed 10000 characters',
  });

// Boolean validation
export const booleanSchema = Joi.boolean()
  .optional()
  .default(false);

// Status validation (active/inactive)
export const statusSchema = Joi.number()
  .integer()
  .valid(0, 1)
  .optional()
  .default(1)
  .messages({
    'number.base': 'Status must be a number',
    'any.only': 'Status must be either 0 (inactive) or 1 (active)',
  });
