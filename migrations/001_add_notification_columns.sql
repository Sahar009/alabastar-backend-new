-- ============================================
-- NOTIFICATION SYSTEM MIGRATION
-- Run this SQL to add new columns to notifications table
-- ============================================

-- Step 1: Add new columns to notifications table
ALTER TABLE `notifications` 
  ADD COLUMN `category` VARCHAR(50) NOT NULL DEFAULT 'system' AFTER `type`,
  ADD COLUMN `priority` VARCHAR(20) NOT NULL DEFAULT 'normal' AFTER `category`,
  ADD COLUMN `channels` JSON NOT NULL AFTER `priority`,
  ADD COLUMN `readAt` DATETIME NULL AFTER `isRead`,
  ADD COLUMN `deliveryStatus` JSON NULL AFTER `readAt`,
  ADD COLUMN `actionUrl` VARCHAR(500) NULL AFTER `deliveryStatus`,
  ADD COLUMN `imageUrl` VARCHAR(500) NULL AFTER `actionUrl`,
  ADD COLUMN `expiresAt` DATETIME NULL AFTER `imageUrl`,
  ADD COLUMN `pushSentAt` DATETIME NULL AFTER `meta`,
  ADD COLUMN `emailSentAt` DATETIME NULL AFTER `pushSentAt`,
  ADD COLUMN `smsSentAt` DATETIME NULL AFTER `emailSentAt`;

-- Step 2: Set default values for existing rows
UPDATE `notifications` 
SET 
  `channels` = JSON_ARRAY('in_app')
WHERE `channels` IS NULL;

-- Step 3: Add indexes
ALTER TABLE `notifications` 
  ADD INDEX `notifications_category` (`category`),
  ADD INDEX `notifications_priority` (`priority`),
  ADD INDEX `notifications_expiresAt` (`expiresAt`);

-- ============================================
-- Verification: Check table structure
-- ============================================
-- DESCRIBE `notifications`;

