import Joi from 'joi';
import { emailSchema, passwordSchema } from './common.validators';

export const registerSchoolSchema = Joi.object({
  schoolName: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'School name is required',
    'string.min': 'School name is required',
    'any.required': 'School name is required',
  }),
  adminName: Joi.string().trim().min(2).max(255).required().messages({
    'string.min': 'Admin name must be at least 2 characters',
    'any.required': 'Admin name is required',
  }),
  email: emailSchema,
  password: passwordSchema,
});
