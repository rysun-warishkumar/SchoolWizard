-- Add is_result_published field to online_exams table
-- This field controls whether students can view their exam results

USE schoolwizard;

-- Check if column exists before adding
SET @dbname = DATABASE();
SET @tablename = 'online_exams';
SET @columnname = 'is_result_published';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) DEFAULT 0 AFTER is_published')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_result_published ON online_exams(is_result_published);

