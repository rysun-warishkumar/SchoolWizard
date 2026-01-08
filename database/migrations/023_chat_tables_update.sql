USE schoolwizard;

-- Drop the foreign key constraint if it exists (to avoid errors on re-run)
-- Note: If you get an error saying the constraint doesn't exist, that's fine - just continue
SET FOREIGN_KEY_CHECKS = 0;

-- Try to drop the constraint (ignore error if it doesn't exist)
ALTER TABLE chat_conversations DROP FOREIGN KEY fk_last_message;

SET FOREIGN_KEY_CHECKS = 1;

-- Now add the foreign key constraint for last_message_id
ALTER TABLE chat_conversations
ADD CONSTRAINT fk_last_message
FOREIGN KEY (last_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Verify the constraint was added
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'schoolwizard'
AND TABLE_NAME = 'chat_conversations'
AND CONSTRAINT_NAME = 'fk_last_message';
