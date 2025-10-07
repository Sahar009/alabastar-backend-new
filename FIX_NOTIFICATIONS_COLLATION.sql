-- Manual SQL Fix for Notifications Collation Issue
-- Run these commands directly in your MySQL database if migrations fail

-- Step 1: Check current collation
SELECT TABLE_NAME, TABLE_COLLATION 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('notifications', 'users') 
AND TABLE_SCHEMA = DATABASE();

-- Step 2: Check column collations
SELECT TABLE_NAME, COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME IN ('notifications', 'users') 
AND COLUMN_NAME IN ('id', 'userId')
AND TABLE_SCHEMA = DATABASE();

-- Step 3: Check foreign key constraints
SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'notifications' 
AND TABLE_SCHEMA = DATABASE()
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Step 4: Fix the collation (run these one by one)
SET FOREIGN_KEY_CHECKS = 0;

-- Drop the foreign key constraint
ALTER TABLE notifications DROP FOREIGN KEY notifications_ibfk_1;

-- Fix the userId column collation
ALTER TABLE notifications 
MODIFY COLUMN userId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Recreate the foreign key constraint
ALTER TABLE notifications 
ADD CONSTRAINT notifications_ibfk_1 
FOREIGN KEY (userId) REFERENCES users(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Step 5: Verify the fix
SELECT TABLE_NAME, COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'notifications' 
AND COLUMN_NAME = 'userId'
AND TABLE_SCHEMA = DATABASE();
