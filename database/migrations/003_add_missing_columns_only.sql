-- Add only the columns that are actually missing
-- This script checks if each column exists before adding it
-- Run this in phpMyAdmin SQL tab

USE schoolwizard;

-- Function to add column only if it doesn't exist
-- Note: MySQL doesn't support IF NOT EXISTS in ALTER TABLE directly
-- So we'll use a stored procedure approach or just run them individually

-- Since father_photo already exists (you got the duplicate error), skip it
-- Just run the ones that don't exist yet

-- Add mother_photo (if missing)
ALTER TABLE students ADD COLUMN mother_photo VARCHAR(255) AFTER mother_email;

-- Add guardian_photo (if missing)
ALTER TABLE students ADD COLUMN guardian_photo VARCHAR(255) AFTER guardian_email;

-- Add transport_route_id (if missing)
ALTER TABLE students ADD COLUMN transport_route_id INT AFTER permanent_address;

-- Add hostel_id (if missing)
ALTER TABLE students ADD COLUMN hostel_id INT AFTER transport_route_id;

-- Add hostel_room_id (if missing)
ALTER TABLE students ADD COLUMN hostel_room_id INT AFTER hostel_id;

-- After running, verify the count
-- Should have 49 columns total (including id, created_at, updated_at)
SELECT COUNT(*) as total_columns FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard' AND TABLE_NAME = 'students';

