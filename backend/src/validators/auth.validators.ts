import Joi from 'joi';
import { emailSchema, passwordSchema, nameSchema } from './common.validators';

/**
 * Authentication validation schemas
 */

// Login validation
export const loginSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
});

// Register validation
export const registerSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  role: Joi.string()
    .valid('admin', 'teacher', 'student', 'parent', 'accountant', 'librarian', 'receptionist')
    .optional()
    .messages({
      'any.only': 'Invalid role. Must be one of: admin, teacher, student, parent, accountant, librarian, receptionist',
    }),
});

// Change password validation
export const changePasswordSchema = Joi.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'New password and confirm password must match',
      'any.required': 'Confirm password is required',
    }),
});

// Forgot password validation
export const forgotPasswordSchema = Joi.object({
  email: emailSchema,
});

// Reset password validation
export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required',
  }),
  newPassword: passwordSchema,
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'New password and confirm password must match',
      'any.required': 'Confirm password is required',
    }),
});
