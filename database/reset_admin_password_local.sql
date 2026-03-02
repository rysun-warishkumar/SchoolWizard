-- ============================================================================
-- Reset Admin Password for LOCAL database
-- ============================================================================
-- Password will be: admin123
-- Login: admin@schoolwizard.com
--
-- How to run (choose one):
-- 1. In MySQL client: SELECT your database, then run this file:
--    USE your_local_db_name;
--    SOURCE path/to/reset_admin_password_local.sql;
-- 2. Or run only the UPDATE below in your GUI (phpMyAdmin, DBeaver, etc.)
--    after selecting your local database.
-- ============================================================================

-- Update admin password to 'admin123' (bcrypt hash, verified)
UPDATE users
SET password = '$2a$10$LO7O/f4lNC5tHZf1yr1ObuiD/r8PiQN9SQZ22rXSLicXXoo/oB1Ca',
    is_active = 1,
    role_id = 1
WHERE email = 'admin@schoolwizard.com';
