-- Add missing columns to admit_card_templates table
USE schoolwizard;

ALTER TABLE admit_card_templates
ADD COLUMN IF NOT EXISTS heading VARCHAR(255) AFTER name,
ADD COLUMN IF NOT EXISTS title VARCHAR(255) AFTER heading,
ADD COLUMN IF NOT EXISTS exam_name VARCHAR(255) AFTER title;

