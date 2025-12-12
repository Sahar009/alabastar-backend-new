-- Migration: Add privacySettings column to users table
-- This SQL script adds the privacySettings JSON column if it doesn't already exist

-- Check if column exists and add it if missing
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'privacySettings'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE users 
   ADD COLUMN privacySettings JSON NULL 
   DEFAULT (JSON_OBJECT(
     ''showProfile'', true,
     ''showContactInfo'', true,
     ''showPortfolio'', true
   ))
   COMMENT ''Privacy preferences for both customers and providers: showProfile, showContactInfo, showPortfolio''',
  'SELECT ''Column privacySettings already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;




