-- ============================================
-- COMPLETE NOTIFICATION SYSTEM MIGRATION
-- RUN THIS ENTIRE FILE TO UPDATE YOUR DATABASE
-- ============================================
-- Created: 2025
-- Purpose: Add enhanced notification system with push notification support
-- 
-- INSTRUCTIONS:
-- 1. Backup your database before running this migration
-- 2. Run this SQL file in your MySQL database
-- 3. Restart your Node.js server
-- ============================================

-- ============================================
-- PART 1: UPDATE NOTIFICATIONS TABLE
-- ============================================

-- Add new columns to notifications table
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

-- Set default values for existing notifications
UPDATE `notifications` 
SET `channels` = JSON_ARRAY('in_app')
WHERE `channels` IS NULL;

-- Add indexes for better query performance
ALTER TABLE `notifications` 
  ADD INDEX `notifications_category` (`category`),
  ADD INDEX `notifications_priority` (`priority`),
  ADD INDEX `notifications_expiresAt` (`expiresAt`);

-- ============================================
-- PART 2: UPDATE NOTIFICATION_PREFERENCES TABLE
-- ============================================

-- Add new preference columns
ALTER TABLE `notification_preferences` 
  ADD COLUMN `emailEnabled` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN `smsEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `pushEnabled` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN `inAppEnabled` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN `bookingNotifications` JSON NOT NULL,
  ADD COLUMN `transactionNotifications` JSON NOT NULL,
  ADD COLUMN `messageNotifications` JSON NOT NULL,
  ADD COLUMN `accountNotifications` JSON NOT NULL,
  ADD COLUMN `marketingNotifications` JSON NOT NULL,
  ADD COLUMN `systemNotifications` JSON NOT NULL,
  ADD COLUMN `doNotDisturbStart` TIME NULL,
  ADD COLUMN `doNotDisturbEnd` TIME NULL,
  ADD COLUMN `timezone` VARCHAR(50) DEFAULT 'UTC',
  ADD COLUMN `language` VARCHAR(10) NOT NULL DEFAULT 'en';

-- Set default JSON values for existing preferences
UPDATE `notification_preferences` 
SET 
  `bookingNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
  `transactionNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
  `messageNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
  `accountNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
  `marketingNotifications` = JSON_OBJECT('email', true, 'push', false, 'sms', false, 'inApp', true),
  `systemNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true)
WHERE `bookingNotifications` IS NULL;

-- ============================================
-- PART 3: CREATE DEVICE_TOKENS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS `device_tokens` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `userId` CHAR(36) NOT NULL,
  `token` TEXT NOT NULL,
  `platform` ENUM('ios', 'android', 'web') NOT NULL,
  `deviceId` VARCHAR(255) NULL,
  `deviceName` VARCHAR(100) NULL,
  `appVersion` VARCHAR(20) NULL,
  `osVersion` VARCHAR(50) NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `lastUsedAt` DATETIME NULL,
  `expiresAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key
  CONSTRAINT `fk_device_tokens_user` 
    FOREIGN KEY (`userId`) 
    REFERENCES `users`(`id`) 
    ON DELETE CASCADE,
  
  -- Indexes
  INDEX `device_tokens_userId` (`userId`),
  INDEX `device_tokens_isActive` (`isActive`),
  INDEX `device_tokens_platform` (`platform`),
  UNIQUE INDEX `device_tokens_userId_deviceId` (`userId`, `deviceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration was successful:

-- Check notifications table structure
-- DESCRIBE `notifications`;

-- Check notification_preferences table structure
-- DESCRIBE `notification_preferences`;

-- Check device_tokens table structure
-- DESCRIBE `device_tokens`;

-- Count records in each table
-- SELECT COUNT(*) as notification_count FROM `notifications`;
-- SELECT COUNT(*) as preference_count FROM `notification_preferences`;
-- SELECT COUNT(*) as device_token_count FROM `device_tokens`;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- Next steps:
-- 1. Restart your Node.js server
-- 2. Test the notification endpoints
-- 3. Check server logs for any errors
-- ============================================






