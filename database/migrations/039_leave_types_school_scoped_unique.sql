-- Make leave type uniqueness school-scoped (school_id + name).
-- This allows different schools to use the same leave type name.

-- 1) Drop legacy global unique index on name (if present).
SET @legacy_leave_unique_idx := (
  SELECT s.INDEX_NAME
  FROM information_schema.statistics s
  JOIN (
    SELECT
      table_schema,
      table_name,
      index_name,
      MAX(seq_in_index) AS col_count
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'leave_types'
      AND non_unique = 0
      AND index_name <> 'PRIMARY'
    GROUP BY table_schema, table_name, index_name
  ) idx
    ON idx.table_schema = s.table_schema
   AND idx.table_name = s.table_name
   AND idx.index_name = s.index_name
  WHERE s.TABLE_SCHEMA = DATABASE()
    AND s.TABLE_NAME = 'leave_types'
    AND s.NON_UNIQUE = 0
    AND s.INDEX_NAME <> 'PRIMARY'
    AND s.COLUMN_NAME = 'name'
    AND s.SEQ_IN_INDEX = 1
    AND idx.col_count = 1
  LIMIT 1
);

SET @drop_legacy_leave_unique_sql := IF(
  @legacy_leave_unique_idx IS NOT NULL,
  CONCAT('ALTER TABLE leave_types DROP INDEX `', @legacy_leave_unique_idx, '`'),
  'SELECT 1'
);
PREPARE stmt FROM @drop_legacy_leave_unique_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Ensure scoped unique(school_id, name) exists (any index name).
SET @scoped_leave_unique_exists := (
  SELECT COUNT(1)
  FROM (
    SELECT s.INDEX_NAME
    FROM information_schema.statistics s
    WHERE s.TABLE_SCHEMA = DATABASE()
      AND s.TABLE_NAME = 'leave_types'
      AND s.NON_UNIQUE = 0
      AND s.INDEX_NAME <> 'PRIMARY'
    GROUP BY s.INDEX_NAME
    HAVING
      SUM(CASE WHEN s.COLUMN_NAME = 'school_id' AND s.SEQ_IN_INDEX = 1 THEN 1 ELSE 0 END) > 0
      AND SUM(CASE WHEN s.COLUMN_NAME = 'name' AND s.SEQ_IN_INDEX = 2 THEN 1 ELSE 0 END) > 0
      AND MAX(s.SEQ_IN_INDEX) = 2
  ) scoped_idx
);

SET @add_scoped_leave_unique_sql := IF(
  @scoped_leave_unique_exists = 0,
  'ALTER TABLE leave_types ADD UNIQUE KEY unique_school_leave_type_name (school_id, name)',
  'SELECT 1'
);
PREPARE stmt FROM @add_scoped_leave_unique_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
