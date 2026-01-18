import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { connectDatabase, getDatabase } from './config/database';
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
import publicExaminationsRoutes from './routes/publicExaminations.routes';
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
    if (!origin) {
      return callback(null, true);
    }
    
    // Always allow localhost origins (any port) - for both development and production flexibility
    const isLocalhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i.test(origin) ||
                              origin.toLowerCase().includes('localhost') ||
                              origin.includes('127.0.0.1');
    
    if (isLocalhostOrigin) {
      return callback(null, true);
    }
    
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
    
    // If no origins configured in production, log warning but allow (for flexibility)
    if (uniqueOrigins.length === 0) {
      console.warn('⚠️  CORS: No origins configured. Allowing all origins. Please configure CORS_ORIGIN or CORS_ORIGINS in production.');
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
  
  // Always allow localhost origins (any port)
  if (origin) {
    const isLocalhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i.test(origin) ||
                              origin.toLowerCase().includes('localhost') ||
                              origin.includes('127.0.0.1');
    
    if (isLocalhostOrigin || isDevelopment()) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      // In production, check configured origins
      const allowedOrigins: string[] = [];
      
      if (env.cors.origin) {
        allowedOrigins.push(env.cors.origin.trim());
      }
      
      if (env.cors.origins) {
        const origins = env.cors.origins.split(',').map(o => o.trim()).filter(o => o.length > 0);
        allowedOrigins.push(...origins);
      }
      
      const uniqueOrigins = [...new Set(allowedOrigins)];
      const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');
      const matchingOrigin = uniqueOrigins.find(allowed => {
        const normalizedAllowed = allowed.toLowerCase().replace(/\/$/, '');
        return normalizedOrigin === normalizedAllowed;
      });
      
      if (matchingOrigin) {
        res.header('Access-Control-Allow-Origin', origin);
      } else if (uniqueOrigins.length > 0) {
        res.header('Access-Control-Allow-Origin', uniqueOrigins[0]);
      } else {
        res.header('Access-Control-Allow-Origin', '*');
      }
    }
  } else {
    res.header('Access-Control-Allow-Origin', '*');
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

// Public routes with /api/v1 prefix (standard)
app.use('/api/v1/public/website', publicCmsWebsiteRoutes); // Public website routes (no auth required)
app.use('/api/v1/public/cms', publicCmsRoutes); // Public CMS routes (no auth required)
app.use('/api/v1/public/about-us', publicAboutUsPageRoutes); // Public About Us page routes (no auth required)
app.use('/api/v1/public/admission', publicAdmissionRoutes); // Public Admission routes (no auth required)
app.use('/api/v1/public/contact', publicContactMessagesRoutes); // Public Contact Messages routes (no auth required)
app.use('/api/v1/public/gallery', publicGalleryRoutes); // Public Gallery routes (no auth required)
app.use('/api/v1/public/news-events', publicNewsEventsRoutes); // Public News & Events routes (no auth required)
app.use('/api/v1/public/examinations', publicExaminationsRoutes); // Public Examinations routes (no auth required)

// Public routes without /api/v1 prefix (for backward compatibility with SchoolPortal)
// This allows SchoolPortal to call /public/website/... directly when API_BASE_URL is http://localhost:5000
app.use('/public/website', publicCmsWebsiteRoutes); // Public website routes (no auth required)
app.use('/public/cms', publicCmsRoutes); // Public CMS routes (no auth required)
app.use('/public/about-us', publicAboutUsPageRoutes); // Public About Us page routes (no auth required)
app.use('/public/admission', publicAdmissionRoutes); // Public Admission routes (no auth required)
app.use('/public/contact', publicContactMessagesRoutes); // Public Contact Messages routes (no auth required)
app.use('/public/gallery', publicGalleryRoutes); // Public Gallery routes (no auth required)
app.use('/public/news-events', publicNewsEventsRoutes); // Public News & Events routes (no auth required)
app.use('/public/examinations', publicExaminationsRoutes); // Public Examinations routes (no auth required)

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

// Check and create missing tables on startup
const checkAndCreateTables = async () => {
  try {
    const db = getDatabase();
    
    // Check if front_cms_website_settings table exists
    const [newTable] = await db.execute(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = ? AND table_name = 'front_cms_website_settings'`,
      [env.db.name]
    ) as any[];
    
    // Check if old front_cms_settings table exists
    const [oldTable] = await db.execute(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = ? AND table_name = 'front_cms_settings'`,
      [env.db.name]
    ) as any[];
    
    if (newTable[0].count === 0) {
      // If old table exists, migrate it
      if (oldTable[0].count > 0) {
        console.log('📋 Migrating front_cms_settings to front_cms_website_settings...');
        
        // Create new table with correct structure
        await db.execute(`
          CREATE TABLE IF NOT EXISTS front_cms_website_settings (
            id INT PRIMARY KEY AUTO_INCREMENT,
            website_logo VARCHAR(255) NULL,
            school_name VARCHAR(255) NOT NULL DEFAULT 'School Name',
            tag_line VARCHAR(255) NULL,
            tag_line_visible BOOLEAN DEFAULT TRUE,
            contact_email VARCHAR(255) NULL,
            contact_phone VARCHAR(50) NULL,
            facebook_url VARCHAR(255) NULL,
            facebook_enabled BOOLEAN DEFAULT FALSE,
            twitter_url VARCHAR(255) NULL,
            twitter_enabled BOOLEAN DEFAULT FALSE,
            youtube_url VARCHAR(255) NULL,
            youtube_enabled BOOLEAN DEFAULT FALSE,
            instagram_url VARCHAR(255) NULL,
            instagram_enabled BOOLEAN DEFAULT FALSE,
            linkedin_url VARCHAR(255) NULL,
            linkedin_enabled BOOLEAN DEFAULT FALSE,
            whatsapp_url VARCHAR(255) NULL,
            whatsapp_enabled BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_settings (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Migrate data from old table to new table
        try {
          const [oldData] = await db.execute('SELECT * FROM front_cms_settings LIMIT 1') as any[];
          if (oldData && oldData.length > 0) {
            const data = oldData[0];
            await db.execute(`
              INSERT INTO front_cms_website_settings 
              (id, website_logo, school_name, tag_line, contact_email, contact_phone,
               facebook_url, twitter_url, youtube_url, instagram_url, linkedin_url,
               created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                website_logo = VALUES(website_logo),
                school_name = VALUES(school_name),
                tag_line = VALUES(tag_line),
                contact_email = VALUES(contact_email),
                contact_phone = VALUES(contact_phone),
                facebook_url = VALUES(facebook_url),
                twitter_url = VALUES(twitter_url),
                youtube_url = VALUES(youtube_url),
                instagram_url = VALUES(instagram_url),
                linkedin_url = VALUES(linkedin_url),
                updated_at = VALUES(updated_at)
            `, [
              data.id || 1,
              data.logo || null,
              data.school_name || 'School Name',
              data.tag_line || null,
              data.contact_email || null,
              data.contact_phone || null,
              data.facebook_url || null,
              data.twitter_url || null,
              data.youtube_url || null,
              data.instagram_url || null,
              data.linkedin_url || null,
              data.created_at || new Date(),
              data.updated_at || new Date()
            ]);
            console.log('✅ Data migrated from front_cms_settings to front_cms_website_settings');
          }
        } catch (migrateError: any) {
          console.warn('⚠️  Could not migrate data from old table:', migrateError.message);
          // Continue - we'll insert defaults if needed
        }
        
        console.log('✅ Table front_cms_website_settings created and migrated');
      } else {
        // No old table, create new one
        console.log('📋 Creating missing table: front_cms_website_settings');
        
        await db.execute(`
          CREATE TABLE IF NOT EXISTS front_cms_website_settings (
            id INT PRIMARY KEY AUTO_INCREMENT,
            website_logo VARCHAR(255) NULL,
            school_name VARCHAR(255) NOT NULL DEFAULT 'School Name',
            tag_line VARCHAR(255) NULL,
            tag_line_visible BOOLEAN DEFAULT TRUE,
            contact_email VARCHAR(255) NULL,
            contact_phone VARCHAR(50) NULL,
            facebook_url VARCHAR(255) NULL,
            facebook_enabled BOOLEAN DEFAULT FALSE,
            twitter_url VARCHAR(255) NULL,
            twitter_enabled BOOLEAN DEFAULT FALSE,
            youtube_url VARCHAR(255) NULL,
            youtube_enabled BOOLEAN DEFAULT FALSE,
            instagram_url VARCHAR(255) NULL,
            instagram_enabled BOOLEAN DEFAULT FALSE,
            linkedin_url VARCHAR(255) NULL,
            linkedin_enabled BOOLEAN DEFAULT FALSE,
            whatsapp_url VARCHAR(255) NULL,
            whatsapp_enabled BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_settings (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ Table front_cms_website_settings created successfully');
      }
      
      // Insert default settings if table is empty
      const [existing] = await db.execute(
        'SELECT COUNT(*) as count FROM front_cms_website_settings'
      ) as any[];
      
      if (existing[0].count === 0) {
        await db.execute(`
          INSERT INTO front_cms_website_settings 
          (school_name, tag_line, tag_line_visible, contact_email, contact_phone)
          VALUES ('School Name', 'A School with a Difference', TRUE, 'info@schoolname.edu', '+91 1234567890')
        `);
        console.log('✅ Default website settings inserted');
      }
    } else {
      console.log('✅ Table front_cms_website_settings already exists');
    }
    
    // Create front_cms_banners table if it doesn't exist
    const [bannerTables] = await db.execute(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = ? AND table_name = 'front_cms_banners'`,
      [env.db.name]
    ) as any[];
    
    if (bannerTables[0].count === 0) {
      console.log('📋 Creating missing table: front_cms_banners');
      await db.execute(`
        CREATE TABLE IF NOT EXISTS front_cms_banners (
          id INT PRIMARY KEY AUTO_INCREMENT,
          title VARCHAR(255) NOT NULL,
          description TEXT NULL,
          image_path VARCHAR(255) NOT NULL,
          button_text VARCHAR(100) NULL,
          button_url VARCHAR(255) NULL,
          sort_order INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_sort_order (sort_order),
          INDEX idx_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Table front_cms_banners created successfully');
    }
    
    // Create all About Us page tables
    const aboutUsTables = [
      {
        name: 'front_cms_about_us_mission_vision',
        sql: `
          CREATE TABLE IF NOT EXISTS front_cms_about_us_mission_vision (
            id INT PRIMARY KEY AUTO_INCREMENT,
            mission_content TEXT NULL,
            vision_content TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `
      },
      {
        name: 'front_cms_about_us_counters',
        sql: `
          CREATE TABLE IF NOT EXISTS front_cms_about_us_counters (
            id INT PRIMARY KEY AUTO_INCREMENT,
            counter_number INT NOT NULL DEFAULT 0,
            counter_label VARCHAR(255) NOT NULL,
            sort_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_sort_order (sort_order),
            INDEX idx_is_active (is_active)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `
      },
      {
        name: 'front_cms_about_us_history',
        sql: `
          CREATE TABLE IF NOT EXISTS front_cms_about_us_history (
            id INT PRIMARY KEY AUTO_INCREMENT,
            history_content TEXT NULL,
            history_image VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `
      },
      {
        name: 'front_cms_about_us_values',
        sql: `
          CREATE TABLE IF NOT EXISTS front_cms_about_us_values (
            id INT PRIMARY KEY AUTO_INCREMENT,
            icon_class VARCHAR(255) NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            sort_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_sort_order (sort_order),
            INDEX idx_is_active (is_active)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `
      },
      {
        name: 'front_cms_about_us_achievements',
        sql: `
          CREATE TABLE IF NOT EXISTS front_cms_about_us_achievements (
            id INT PRIMARY KEY AUTO_INCREMENT,
            achievement_year VARCHAR(10) NULL,
            achievement_title VARCHAR(255) NOT NULL,
            achievement_description TEXT NULL,
            sort_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_sort_order (sort_order),
            INDEX idx_is_active (is_active)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `
      },
      {
        name: 'front_cms_about_us_leadership',
        sql: `
          CREATE TABLE IF NOT EXISTS front_cms_about_us_leadership (
            id INT PRIMARY KEY AUTO_INCREMENT,
            leader_name VARCHAR(255) NOT NULL,
            leader_role VARCHAR(255) NULL,
            leader_bio TEXT NULL,
            leader_image VARCHAR(255) NULL,
            sort_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_sort_order (sort_order),
            INDEX idx_is_active (is_active)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `
      }
    ];
    
    for (const table of aboutUsTables) {
      const [tableCheck] = await db.execute(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = ? AND table_name = ?`,
        [env.db.name, table.name]
      ) as any[];
      
      if (tableCheck[0].count === 0) {
        console.log(`📋 Creating missing table: ${table.name}`);
        await db.execute(table.sql);
        console.log(`✅ Table ${table.name} created successfully`);
      }
    }
    
    console.log('✅ All Front CMS tables checked/created');
  } catch (error) {
    console.error('⚠️  Error checking/creating tables:', error);
    // Don't exit - allow server to start even if table creation fails
    // The error will be caught when the API is called
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Database connected');

    // Check and create missing tables
    await checkAndCreateTables();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${env.server.nodeEnv}`);
      console.log(`🗄️  Database: ${env.db.name}@${env.db.host}:${env.db.port}`);
      if (isDevelopment()) {
        console.log(`⚠️  Running in DEVELOPMENT mode`);
        console.log(`🌐 CORS: Allowing all localhost origins in development`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

