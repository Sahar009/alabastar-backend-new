-- ============================================
-- DEVICE TOKENS TABLE CREATION
-- Run this SQL to create the device_tokens table
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
-- Verification: Check table structure
-- ============================================
-- DESCRIBE `device_tokens`;

