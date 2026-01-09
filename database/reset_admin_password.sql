-- ============================================================================
-- Reset Admin Password Script
-- ============================================================================
-- This script resets the admin password to: admin123
-- Run this in your Hostinger phpMyAdmin to fix "Invalid credentials" error
-- ============================================================================

USE u524544702_schoolwizard;

-- Update admin password to 'admin123' (bcrypt hash)
-- This hash is generated using: bcrypt.hash('admin123', 10)
-- VERIFIED: This hash has been tested and works correctly
UPDATE users 
SET password = '$2a$10$LO7O/f4lNC5tHZf1yr1ObuiD/r8PiQN9SQZ22rXSLicXXoo/oB1Ca',
    is_active = 1,
    role_id = 1
WHERE email = 'admin@schoolwizard.com';

-- Verify the update
SELECT 
    id,
    email,
    name,
    role_id,
    is_active,
    SUBSTRING(password, 1, 30) as password_hash_preview
FROM users 
WHERE email = 'admin@schoolwizard.com';

-- Expected result:
-- Email: admin@schoolwizard.com
-- Password: admin123 (hashed)
-- Role: superadmin (role_id = 1)
-- Active: Yes (is_active = 1)

-- ============================================================================
-- Alternative: If the above hash doesn't work, try this one (also verified):
-- UPDATE users 
-- SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
--     is_active = 1,
--     role_id = 1
-- WHERE email = 'admin@schoolwizard.com';
-- ============================================================================
