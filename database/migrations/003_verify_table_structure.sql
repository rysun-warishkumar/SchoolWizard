-- Script to verify the students table structure
-- Run this first to see what columns you have

USE schoolwizard;

-- List all columns in the students table
SELECT 
    ORDINAL_POSITION as position,
    COLUMN_NAME as column_name,
    DATA_TYPE as data_type,
    IS_NULLABLE as nullable,
    COLUMN_DEFAULT as default_value
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard'
AND TABLE_NAME = 'students'
ORDER BY ORDINAL_POSITION;

-- Count total columns
SELECT COUNT(*) as total_columns 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard' 
AND TABLE_NAME = 'students';

-- Check for specific missing columns
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'schoolwizard' 
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'father_photo'
    ) THEN 'EXISTS' ELSE 'MISSING' END as father_photo,
    CASE WHEN EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'schoolwizard' 
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'mother_photo'
    ) THEN 'EXISTS' ELSE 'MISSING' END as mother_photo,
    CASE WHEN EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'schoolwizard' 
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'guardian_photo'
    ) THEN 'EXISTS' ELSE 'MISSING' END as guardian_photo,
    CASE WHEN EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'schoolwizard' 
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'transport_route_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as transport_route_id,
    CASE WHEN EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'schoolwizard' 
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'hostel_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as hostel_id,
    CASE WHEN EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'schoolwizard' 
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'hostel_room_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as hostel_room_id;

