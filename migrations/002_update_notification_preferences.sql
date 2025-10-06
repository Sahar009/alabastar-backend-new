-- ============================================
-- NOTIFICATION PREFERENCES MIGRATION
-- Run this SQL to update notification_preferences table
-- ============================================

-- Step 1: Add new preference columns
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

-- Step 2: Set default JSON values for existing rows
UPDATE `notification_preferences` 
SET 
  `bookingNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
  `transactionNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
  `messageNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
  `accountNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
  `marketingNotifications` = JSON_OBJECT('email', true, 'push', false, 'sms', false, 'inApp', true),
  `systemNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true)
WHERE `bookingNotifications` IS NULL;

-- Step 3: Migrate old preference values (if old columns exist)
-- If you had old columns 'email', 'sms', 'push', run these:
-- UPDATE `notification_preferences` SET `emailEnabled` = `email` WHERE `email` IS NOT NULL;
-- UPDATE `notification_preferences` SET `smsEnabled` = `sms` WHERE `sms` IS NOT NULL;
-- UPDATE `notification_preferences` SET `pushEnabled` = `push` WHERE `push` IS NOT NULL;

-- Step 4: Drop old columns (if they exist)
-- ALTER TABLE `notification_preferences` 
--   DROP COLUMN IF EXISTS `email`,
--   DROP COLUMN IF EXISTS `sms`,
--   DROP COLUMN IF EXISTS `push`;

-- ============================================
-- Verification: Check table structure
-- ============================================
-- DESCRIBE `notification_preferences`;

