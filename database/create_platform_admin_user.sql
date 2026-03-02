-- ============================================================================
-- Create Platform Admin User (for /platform and sidebar "Platform Admin")
-- ============================================================================
-- Run this AFTER migration 036 (Phase 1 multi-tenant). Use your actual DB name.
-- Platform Admin = user with role superadmin and school_id = NULL.
-- ============================================================================

-- Use your database name, e.g. schoolwizard or u524544702_schoolwizard
-- USE your_database_name;

SET @superadmin_role_id = (SELECT id FROM roles WHERE name = 'superadmin' LIMIT 1);

-- Ensure we have a superadmin role
SELECT IF(@superadmin_role_id IS NULL, 'ERROR: No role named superadmin found. Run base schema first.', 'OK') AS check_role;

-- Option A: Create a dedicated platform admin user (recommended)
-- Email: platform@schoolwizard.com  |  Password: admin123  (change after first login)
-- Same bcrypt hash as reset_admin_password.sql for 'admin123'
INSERT INTO users (email, password, name, role_id, school_id, is_active, created_at)
SELECT 'platform@schoolwizard.com',
       '$2a$10$LO7O/f4lNC5tHZf1yr1ObuiD/r8PiQN9SQZ22rXSLicXXoo/oB1Ca',
       'Platform Admin',
       @superadmin_role_id,
       NULL,
       1,
       NOW()
FROM DUAL
WHERE @superadmin_role_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'platform@schoolwizard.com');

-- Option B: Convert an existing user to platform-only (uncomment to use)
-- After this, that user will see Platform Admin and NOT be tied to any school.
-- UPDATE users SET school_id = NULL WHERE email = 'admin@schoolwizard.com';

-- Verify
SELECT id, email, name, role_id, school_id, is_active
FROM users
WHERE school_id IS NULL;

-- ============================================================================
-- Steps to see "Platform Admin" in the sidebar and use /platform
-- ============================================================================
-- 1. Run this script on your database (after 036).
-- 2. Start backend and frontend (e.g. npm run dev in each).
-- 3. Log out if already logged in.
-- 4. Log in with:  platform@schoolwizard.com  /  admin123
-- 5. Sidebar will show "Platform Admin"; open it or go to /platform to manage schools.
-- ============================================================================
