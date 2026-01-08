-- Get the exact structure of the students table
-- Run this to see all columns in order

USE schoolwizard;

-- Get all columns in the exact order they appear in the table
SELECT 
    ORDINAL_POSITION as position,
    COLUMN_NAME as column_name,
    DATA_TYPE as data_type,
    IS_NULLABLE as nullable
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard'
AND TABLE_NAME = 'students'
ORDER BY ORDINAL_POSITION;

-- Count total columns (should be 49 including id, created_at, updated_at)
SELECT COUNT(*) as total_columns 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard' 
AND TABLE_NAME = 'students';

-- List columns that should be in INSERT (excluding id, created_at, updated_at, disable_reason_id, disable_date)
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard'
AND TABLE_NAME = 'students'
AND COLUMN_NAME NOT IN ('id', 'created_at', 'updated_at', 'disable_reason_id', 'disable_date')
ORDER BY ORDINAL_POSITION;

