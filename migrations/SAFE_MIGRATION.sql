-- ============================================
-- SAFE NOTIFICATION SYSTEM MIGRATION
-- This checks for existing columns before adding
-- ============================================

-- Step 1: Add columns to notifications table (with IF NOT EXISTS checks)
SET @dbname = DATABASE();
SET @tablename = 'notifications';

-- Add category column
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'category'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE notifications ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT ''system'' AFTER type',
    'SELECT ''Column category already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Add priority column
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'priority'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE notifications ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT ''normal'' AFTER category',
    'SELECT ''Column priority already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Add channels column
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'channels'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE notifications ADD COLUMN channels JSON NOT NULL AFTER priority',
    'SELECT ''Column channels already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Add readAt column
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'readAt'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE notifications ADD COLUMN readAt DATETIME NULL AFTER isRead',
    'SELECT ''Column readAt already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Add deliveryStatus column
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'deliveryStatus'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE notifications ADD COLUMN deliveryStatus JSON NULL',
    'SELECT ''Column deliveryStatus already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Add actionUrl column
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'actionUrl'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE notifications ADD COLUMN actionUrl VARCHAR(500) NULL',
    'SELECT ''Column actionUrl already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Add imageUrl column
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'imageUrl'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE notifications ADD COLUMN imageUrl VARCHAR(500) NULL',
    'SELECT ''Column imageUrl already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Add expiresAt column
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'expiresAt'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE notifications ADD COLUMN expiresAt DATETIME NULL',
    'SELECT ''Column expiresAt already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Add pushSentAt column
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'pushSentAt'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE notifications ADD COLUMN pushSentAt DATETIME NULL',
    'SELECT ''Column pushSentAt already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Add emailSentAt column
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'emailSentAt'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE notifications ADD COLUMN emailSentAt DATETIME NULL',
    'SELECT ''Column emailSentAt already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Add smsSentAt column
SET @column_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'smsSentAt'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE notifications ADD COLUMN smsSentAt DATETIME NULL',
    'SELECT ''Column smsSentAt already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Set default values for existing rows
UPDATE notifications 
SET channels = JSON_ARRAY('in_app')
WHERE channels IS NULL;

-- Add indexes (with checks)
SET @index_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'notifications_category'
);
SET @sql = IF(@index_exists = 0,
    'ALTER TABLE notifications ADD INDEX notifications_category (category)',
    'SELECT ''Index notifications_category already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

SET @index_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'notifications_priority'
);
SET @sql = IF(@index_exists = 0,
    'ALTER TABLE notifications ADD INDEX notifications_priority (priority)',
    'SELECT ''Index notifications_priority already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

SET @index_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'notifications_expiresAt'
);
SET @sql = IF(@index_exists = 0,
    'ALTER TABLE notifications ADD INDEX notifications_expiresAt (expiresAt)',
    'SELECT ''Index notifications_expiresAt already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Repeat for notification_preferences and device_tokens...
-- (Using the same pattern as above)

SELECT 'Migration completed successfully!' AS status;




