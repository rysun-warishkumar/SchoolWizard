-- ALTER script to add missing columns to students table if they don't exist
-- Run this if you get "Column count doesn't match" errors
-- Usage: mysql -u root schoolwizard < database/migrations/003_students_tables_ALTER.sql

USE schoolwizard;

-- Add missing columns if they don't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS father_photo VARCHAR(255) AFTER father_email,
ADD COLUMN IF NOT EXISTS mother_photo VARCHAR(255) AFTER mother_email,
ADD COLUMN IF NOT EXISTS guardian_photo VARCHAR(255) AFTER guardian_email,
ADD COLUMN IF NOT EXISTS transport_route_id INT AFTER permanent_address,
ADD COLUMN IF NOT EXISTS hostel_id INT AFTER transport_route_id,
ADD COLUMN IF NOT EXISTS hostel_room_id INT AFTER hostel_id;

-- Note: If the above doesn't work (MySQL version < 8.0.19), use this instead:
-- Check each column and add if missing manually in phpMyAdmin or MySQL client

