-- Add address column to front_cms_settings table
ALTER TABLE front_cms_settings 
ADD COLUMN IF NOT EXISTS address TEXT NULL AFTER current_theme;

