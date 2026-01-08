-- Simple ALTER script to add missing columns
-- Run this in phpMyAdmin SQL tab
-- If you get "Duplicate column name" errors, that means the column already exists - that's fine!

USE schoolwizard;

-- Add missing columns (ignore errors if they already exist)
ALTER TABLE students ADD COLUMN father_photo VARCHAR(255) AFTER father_email;
ALTER TABLE students ADD COLUMN mother_photo VARCHAR(255) AFTER mother_email;
ALTER TABLE students ADD COLUMN guardian_photo VARCHAR(255) AFTER guardian_email;
ALTER TABLE students ADD COLUMN transport_route_id INT AFTER permanent_address;
ALTER TABLE students ADD COLUMN hostel_id INT AFTER transport_route_id;
ALTER TABLE students ADD COLUMN hostel_room_id INT AFTER hostel_id;

-- Verify: This should show 49 columns total (including id, created_at, updated_at)
SELECT COUNT(*) as total_columns FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard' AND TABLE_NAME = 'students';

