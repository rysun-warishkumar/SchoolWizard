-- Make HR master uniqueness school-scoped instead of global.
-- This allows different schools to use the same names safely.

-- departments: drop legacy global unique(name), add unique(school_id, name)
SET @dept_unique_idx := (
  SELECT s.INDEX_NAME
  FROM information_schema.statistics s
  WHERE s.TABLE_SCHEMA = DATABASE()
    AND s.TABLE_NAME = 'departments'
    AND s.NON_UNIQUE = 0
    AND s.INDEX_NAME <> 'PRIMARY'
    AND s.COLUMN_NAME = 'name'
    AND s.SEQ_IN_INDEX = 1
  LIMIT 1
);
SET @dept_drop_sql := IF(
  @dept_unique_idx IS NOT NULL,
  CONCAT('ALTER TABLE departments DROP INDEX `', @dept_unique_idx, '`'),
  'SELECT 1'
);
PREPARE stmt FROM @dept_drop_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @dept_scoped_unique_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics s
  WHERE s.TABLE_SCHEMA = DATABASE()
    AND s.TABLE_NAME = 'departments'
    AND s.INDEX_NAME = 'unique_school_name'
);
SET @dept_add_sql := IF(
  @dept_scoped_unique_exists = 0,
  'ALTER TABLE departments ADD UNIQUE KEY unique_school_name (school_id, name)',
  'SELECT 1'
);
PREPARE stmt FROM @dept_add_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- designations: drop legacy global unique(name), add unique(school_id, name)
SET @des_unique_idx := (
  SELECT s.INDEX_NAME
  FROM information_schema.statistics s
  WHERE s.TABLE_SCHEMA = DATABASE()
    AND s.TABLE_NAME = 'designations'
    AND s.NON_UNIQUE = 0
    AND s.INDEX_NAME <> 'PRIMARY'
    AND s.COLUMN_NAME = 'name'
    AND s.SEQ_IN_INDEX = 1
  LIMIT 1
);
SET @des_drop_sql := IF(
  @des_unique_idx IS NOT NULL,
  CONCAT('ALTER TABLE designations DROP INDEX `', @des_unique_idx, '`'),
  'SELECT 1'
);
PREPARE stmt FROM @des_drop_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @des_scoped_unique_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics s
  WHERE s.TABLE_SCHEMA = DATABASE()
    AND s.TABLE_NAME = 'designations'
    AND s.INDEX_NAME = 'unique_school_name'
);
SET @des_add_sql := IF(
  @des_scoped_unique_exists = 0,
  'ALTER TABLE designations ADD UNIQUE KEY unique_school_name (school_id, name)',
  'SELECT 1'
);
PREPARE stmt FROM @des_add_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- leave_types: drop legacy global unique(name), add unique(school_id, name)
SET @leave_unique_idx := (
  SELECT s.INDEX_NAME
  FROM information_schema.statistics s
  WHERE s.TABLE_SCHEMA = DATABASE()
    AND s.TABLE_NAME = 'leave_types'
    AND s.NON_UNIQUE = 0
    AND s.INDEX_NAME <> 'PRIMARY'
    AND s.COLUMN_NAME = 'name'
    AND s.SEQ_IN_INDEX = 1
  LIMIT 1
);
SET @leave_drop_sql := IF(
  @leave_unique_idx IS NOT NULL,
  CONCAT('ALTER TABLE leave_types DROP INDEX `', @leave_unique_idx, '`'),
  'SELECT 1'
);
PREPARE stmt FROM @leave_drop_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @leave_scoped_unique_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics s
  WHERE s.TABLE_SCHEMA = DATABASE()
    AND s.TABLE_NAME = 'leave_types'
    AND s.INDEX_NAME = 'unique_school_name'
);
SET @leave_add_sql := IF(
  @leave_scoped_unique_exists = 0,
  'ALTER TABLE leave_types ADD UNIQUE KEY unique_school_name (school_id, name)',
  'SELECT 1'
);
PREPARE stmt FROM @leave_add_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
