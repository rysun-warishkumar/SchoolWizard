-- Script to check which columns exist and add only the missing ones
-- Run this in phpMyAdmin SQL tab

USE schoolwizard;

-- Check current columns
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard'
AND TABLE_NAME = 'students'
ORDER BY ORDINAL_POSITION;

-- Now add only the missing columns
-- Run these one by one and skip any that give "Duplicate column name" errors

-- Try to add father_photo (skip if error)
ALTER TABLE students ADD COLUMN father_photo VARCHAR(255) AFTER father_email;

-- Try to add mother_photo (skip if error)
ALTER TABLE students ADD COLUMN mother_photo VARCHAR(255) AFTER mother_email;

-- Try to add guardian_photo (skip if error)
ALTER TABLE students ADD COLUMN guardian_photo VARCHAR(255) AFTER guardian_email;

-- Try to add transport_route_id (skip if error)
ALTER TABLE students ADD COLUMN transport_route_id INT AFTER permanent_address;

-- Try to add hostel_id (skip if error)
ALTER TABLE students ADD COLUMN hostel_id INT AFTER transport_route_id;

-- Try to add hostel_room_id (skip if error)
ALTER TABLE students ADD COLUMN hostel_room_id INT AFTER hostel_id;

-- Verify final structure
SELECT COUNT(*) as total_columns FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard' AND TABLE_NAME = 'students';

