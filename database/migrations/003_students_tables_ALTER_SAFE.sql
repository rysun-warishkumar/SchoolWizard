-- Safe ALTER script to add missing columns to students table
-- This will NOT delete any data
-- Run this in phpMyAdmin SQL tab or MySQL client

USE schoolwizard;

-- Disable foreign key checks temporarily (MySQL will re-enable automatically)
SET FOREIGN_KEY_CHECKS = 0;

-- Add missing columns one by one
-- If a column already exists, you'll get an error - that's okay, just continue

-- Check and add father_photo
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'schoolwizard' 
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'father_photo');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE students ADD COLUMN father_photo VARCHAR(255) AFTER father_email', 
  'SELECT "Column father_photo already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add mother_photo
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'schoolwizard' 
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'mother_photo');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE students ADD COLUMN mother_photo VARCHAR(255) AFTER mother_email', 
  'SELECT "Column mother_photo already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add guardian_photo
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'schoolwizard' 
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'guardian_photo');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE students ADD COLUMN guardian_photo VARCHAR(255) AFTER guardian_email', 
  'SELECT "Column guardian_photo already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add transport_route_id
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'schoolwizard' 
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'transport_route_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE students ADD COLUMN transport_route_id INT AFTER permanent_address', 
  'SELECT "Column transport_route_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add hostel_id
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'schoolwizard' 
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'hostel_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE students ADD COLUMN hostel_id INT AFTER transport_route_id', 
  'SELECT "Column hostel_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add hostel_room_id
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'schoolwizard' 
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'hostel_room_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE students ADD COLUMN hostel_room_id INT AFTER hostel_id', 
  'SELECT "Column hostel_room_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify the table structure
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard'
AND TABLE_NAME = 'students'
ORDER BY ORDINAL_POSITION;

