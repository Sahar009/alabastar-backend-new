-- ============================================
-- QUICK FIX - Run this in MySQL to add missing columns
-- ============================================

-- Add columns to notification_preferences table
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

-- Set default JSON values
UPDATE `notification_preferences` 
SET 
  `bookingNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
  `transactionNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
  `messageNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
  `accountNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
  `marketingNotifications` = JSON_OBJECT('email', true, 'push', false, 'sms', false, 'inApp', true),
  `systemNotifications` = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true);

SELECT 'notification_preferences table updated!' AS status;






