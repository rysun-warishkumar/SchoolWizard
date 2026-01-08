import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Define environment variable schema
const envSchema = Joi.object({
  // Database Configuration
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(3306),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_NAME: Joi.string().required(),

  // Server Configuration
  PORT: Joi.number().port().default(5000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).required()
    .messages({
      'string.min': 'JWT_SECRET must be at least 32 characters long for security',
      'any.required': 'JWT_SECRET is required'
    }),
  JWT_EXPIRE: Joi.string().default('7d'),

  // CORS Configuration
  CORS_ORIGIN: Joi.string().uri().optional(),
  CORS_ORIGINS: Joi.string().optional(),

  // File Upload Configuration
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB in bytes
  UPLOAD_DIR: Joi.string().default('uploads'),

  // Email Configuration (optional)
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().port().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),

  // SMS Configuration (optional)
  SMS_API_KEY: Joi.string().optional(),
  SMS_API_SECRET: Joi.string().optional(),
}).unknown(); // Allow unknown keys for flexibility

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: true,
});

if (error) {
  const errorMessages = error.details.map((detail) => detail.message).join('\n');
  console.error('❌ Environment variable validation failed:');
  console.error(errorMessages);
  console.error('\nPlease check your .env file and ensure all required variables are set correctly.');
  process.exit(1);
}

// Export validated environment variables
export const env = {
  // Database
  db: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    name: envVars.DB_NAME,
  },

  // Server
  server: {
    port: envVars.PORT,
    nodeEnv: envVars.NODE_ENV,
  },

  // JWT
  jwt: {
    secret: envVars.JWT_SECRET,
    expire: envVars.JWT_EXPIRE,
  },

  // CORS
  cors: {
    origin: envVars.CORS_ORIGIN,
    origins: envVars.CORS_ORIGINS,
  },

  // File Upload
  upload: {
    maxFileSize: envVars.MAX_FILE_SIZE,
    uploadDir: envVars.UPLOAD_DIR,
  },

  // Email (optional)
  email: {
    smtpHost: envVars.SMTP_HOST,
    smtpPort: envVars.SMTP_PORT,
    smtpUser: envVars.SMTP_USER,
    smtpPass: envVars.SMTP_PASS,
  },

  // SMS (optional)
  sms: {
    apiKey: envVars.SMS_API_KEY,
    apiSecret: envVars.SMS_API_SECRET,
  },
};

// Helper function to check if running in development
export const isDevelopment = () => env.server.nodeEnv === 'development';

// Helper function to check if running in production
export const isProduction = () => env.server.nodeEnv === 'production';

// Helper function to check if running in test
export const isTest = () => env.server.nodeEnv === 'test';
