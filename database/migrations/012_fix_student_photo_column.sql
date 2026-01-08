-- Fix student photo column to support base64 images
-- Base64 encoded images are much longer than 255 characters
-- This migration changes the photo column from VARCHAR(255) to LONGTEXT

USE schoolwizard;

-- Change photo column to LONGTEXT to support full base64 image data
ALTER TABLE students MODIFY COLUMN photo LONGTEXT;

-- Also update parent photo columns if they exist
ALTER TABLE students MODIFY COLUMN father_photo LONGTEXT;
ALTER TABLE students MODIFY COLUMN mother_photo LONGTEXT;
ALTER TABLE students MODIFY COLUMN guardian_photo LONGTEXT;

-- Verify the change
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'schoolwizard' 
AND TABLE_NAME = 'students' 
AND COLUMN_NAME LIKE '%photo%';

