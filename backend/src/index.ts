import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { connectDatabase } from './config/database';
import { env, isDevelopment } from './config/env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import rolesRoutes from './routes/roles.routes';
import dashboardRoutes from './routes/dashboard.routes';
import settingsRoutes from './routes/settings.routes';
import profileRoutes from './routes/profile.routes';
import academicsRoutes from './routes/academics.routes';
import studentsRoutes from './routes/students.routes';
import frontofficeRoutes from './routes/frontoffice.routes';
import hrRoutes from './routes/hr.routes';
import feesRoutes from './routes/fees.routes';
import incomeRoutes from './routes/income.routes';
import expensesRoutes from './routes/expenses.routes';
import attendanceRoutes from './routes/attendance.routes';
import examinationsRoutes from './routes/examinations.routes';
import onlineExaminationsRoutes from './routes/onlineExaminations.routes';
import homeworkRoutes from './routes/homework.routes';
import libraryRoutes from './routes/library.routes';
import downloadCenterRoutes from './routes/downloadCenter.routes';
import communicateRoutes from './routes/communicate.routes';
import inventoryRoutes from './routes/inventory.routes';
import transportRoutes from './routes/transport.routes';
import hostelRoutes from './routes/hostel.routes';
import certificateRoutes from './routes/certificate.routes';
import calendarRoutes from './routes/calendar.routes';
import chatRoutes from './routes/chat.routes';
import frontCmsRoutes from './routes/frontCms.routes';
import frontCmsWebsiteRoutes from './routes/frontCmsWebsite.routes';
import publicCmsWebsiteRoutes from './routes/publicCmsWebsite.routes';
import publicCmsRoutes from './routes/publicCms.routes';
import aboutUsPageRoutes from './routes/aboutUsPage.routes';
import publicAboutUsPageRoutes from './routes/publicAboutUsPage.routes';
import admissionManagementRoutes from './routes/admissionManagement.routes';
import publicAdmissionRoutes from './routes/publicAdmission.routes';
import contactMessagesRoutes from './routes/contactMessages.routes';
import publicContactMessagesRoutes from './routes/publicContactMessages.routes';
import galleryManagementRoutes from './routes/galleryManagement.routes';
import publicGalleryRoutes from './routes/publicGallery.routes';
import newsEventsManagementRoutes from './routes/newsEventsManagement.routes';
import publicNewsEventsRoutes from './routes/publicNewsEvents.routes';
import alumniRoutes from './routes/alumni.routes';
import reportsRoutes from './routes/reports.routes';
import lessonPlanRoutes from './routes/lessonPlan.routes';
// import { rateLimiter } from './middleware/rateLimiter'; // Commented out - rate limiting disabled
import { validateJSON } from './middleware/validateRequest';

// Environment variables are validated in config/env.ts
// If validation fails, the process will exit before reaching here

const app = express();
const PORT = env.server.port;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - must be before other middleware
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins for easier testing
    if (isDevelopment()) {
      return callback(null, true);
    }
    
    // In production, use configured origins
    const allowedOrigins: string[] = [];
    
    if (env.cors.origin) {
      allowedOrigins.push(env.cors.origin.trim());
    }
    
    if (env.cors.origins) {
      // Split comma-separated origins and trim each one
      const origins = env.cors.origins.split(',').map(o => o.trim()).filter(o => o.length > 0);
      allowedOrigins.push(...origins);
    }
    
    // Remove duplicates
    const uniqueOrigins = [...new Set(allowedOrigins)];
    
    // Default origins for development (fallback)
    if (uniqueOrigins.length === 0) {
      uniqueOrigins.push('http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000');
    }
    
    // Always allow localhost origins in development
    if (isDevelopment() && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    
    // Check if origin matches (case-insensitive, with/without trailing slash)
    const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');
    const isAllowed = uniqueOrigins.some(allowed => {
      const normalizedAllowed = allowed.toLowerCase().replace(/\/$/, '');
      return normalizedOrigin === normalizedAllowed;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // In development, log the origin for debugging but still allow it
      if (isDevelopment()) {
        console.warn(`CORS: Allowing origin ${origin} in development mode`);
        return callback(null, true);
      }
      console.warn(`CORS: Blocked origin ${origin}. Allowed origins: ${uniqueOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Handle OPTIONS requests explicitly to prevent 500 errors
app.options('*', cors(corsOptions), (req, res) => {
  res.sendStatus(200);
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(validateJSON);

// Serve uploaded files with CORS headers
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  
  if (isDevelopment()) {
    // In development, allow all origins
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
  } else {
    // In production, use configured origins
    const allowedOrigins: string[] = [];
    
    if (env.cors.origin) {
      allowedOrigins.push(env.cors.origin.trim());
    }
    
    if (env.cors.origins) {
      const origins = env.cors.origins.split(',').map(o => o.trim()).filter(o => o.length > 0);
      allowedOrigins.push(...origins);
    }
    
    // Remove duplicates
    const uniqueOrigins = [...new Set(allowedOrigins)];
    
    // Normalize origin for comparison (remove trailing slash, lowercase)
    const normalizedOrigin = origin ? origin.toLowerCase().replace(/\/$/, '') : '';
    
    // Find matching origin
    const matchingOrigin = uniqueOrigins.find(allowed => {
      const normalizedAllowed = allowed.toLowerCase().replace(/\/$/, '');
      return normalizedOrigin === normalizedAllowed;
    });
    
    if (origin && matchingOrigin) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (uniqueOrigins.length > 0) {
      res.header('Access-Control-Allow-Origin', uniqueOrigins[0]);
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  // Set cache headers for images
  if (req.path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp)$/i)) {
    res.header('Cache-Control', 'public, max-age=31536000');
  }
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.match(/\.(jpg|jpeg|png|gif|ico|svg|webp)$/i)) {
      res.setHeader('Content-Type', getContentType(filePath));
    }
  }
}));

// Helper function to get content type based on file extension
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// Request logging middleware (for debugging)
if (isDevelopment()) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
      contentType: req.get('content-type'),
    });
    next();
  });
}

// Rate limiting - COMMENTED OUT
// app.use('/api/', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Routes
// ⚠️ IMPORTANT: Public routes MUST be registered BEFORE protected routes
// This ensures Express matches public routes first and doesn't apply authentication middleware
app.use('/api/v1/public/website', publicCmsWebsiteRoutes); // Public website routes (no auth required)
app.use('/api/v1/public/cms', publicCmsRoutes); // Public CMS routes (no auth required)
app.use('/api/v1/public/about-us', publicAboutUsPageRoutes); // Public About Us page routes (no auth required)
app.use('/api/v1/public/admission', publicAdmissionRoutes); // Public Admission routes (no auth required)
app.use('/api/v1/public/contact', publicContactMessagesRoutes); // Public Contact Messages routes (no auth required)
app.use('/api/v1/public/gallery', publicGalleryRoutes); // Public Gallery routes (no auth required)
app.use('/api/v1/public/news-events', publicNewsEventsRoutes); // Public News & Events routes (no auth required)

// Protected routes (require authentication)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/academics', academicsRoutes);
app.use('/api/v1/students', studentsRoutes);
app.use('/api/v1/front-office', frontofficeRoutes);
app.use('/api/v1/hr', hrRoutes);
app.use('/api/v1/fees', feesRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/examinations', examinationsRoutes);
app.use('/api/v1/online-examinations', onlineExaminationsRoutes);
app.use('/api/v1/homework', homeworkRoutes);
app.use('/api/v1/library', libraryRoutes);
app.use('/api/v1/download-center', downloadCenterRoutes);
app.use('/api/v1/communicate', communicateRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/transport', transportRoutes);
app.use('/api/v1/hostel', hostelRoutes);
app.use('/api/v1/certificate', certificateRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/front-cms', frontCmsRoutes);
app.use('/api/v1/front-cms-website', frontCmsWebsiteRoutes);
app.use('/api/v1/about-us-page', aboutUsPageRoutes); // Admin About Us page management
app.use('/api/v1/admission', admissionManagementRoutes); // Admin Admission management
app.use('/api/v1/contact-messages', contactMessagesRoutes); // Admin Contact Messages management
app.use('/api/v1/gallery', galleryManagementRoutes); // Admin Gallery management
app.use('/api/v1/news-events', newsEventsManagementRoutes); // Admin News & Events management
app.use('/api/v1/alumni', alumniRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/lesson-plan', lessonPlanRoutes);
// Routes registered at /api/v1 root level (must be last to avoid matching public routes)
app.use('/api/v1', incomeRoutes);
app.use('/api/v1', expensesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Database connected');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${env.server.nodeEnv}`);
      console.log(`🗄️  Database: ${env.db.name}@${env.db.host}:${env.db.port}`);
      if (isDevelopment()) {
        console.log(`⚠️  Running in DEVELOPMENT mode`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

