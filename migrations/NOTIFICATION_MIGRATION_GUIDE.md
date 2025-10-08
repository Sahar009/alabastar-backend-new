# Notification System - Database Migration Guide

## Overview

This guide helps you migrate your existing database to support the enhanced notification system.

## What's Changed

### 1. Notifications Table (Enhanced)
**New columns added:**
- `category` - Categorizes notifications (transaction, booking, message, account, marketing, system)
- `priority` - Priority level (low, normal, high, urgent)
- `channels` - JSON array of delivery channels
- `readAt` - Timestamp when notification was read
- `deliveryStatus` - JSON object tracking delivery status per channel
- `actionUrl` - URL or deep link for notification action
- `imageUrl` - Optional image URL
- `expiresAt` - Expiration timestamp
- `pushSentAt` - Push notification delivery timestamp
- `emailSentAt` - Email delivery timestamp
- `smsSentAt` - SMS delivery timestamp

**Modified columns:**
- `type` - Now uses ENUM with specific types

### 2. Notification Preferences Table (Enhanced)
**New columns:**
- `emailEnabled`, `smsEnabled`, `pushEnabled`, `inAppEnabled` - Global toggles
- `bookingNotifications` - JSON object for booking notification preferences
- `transactionNotifications` - JSON object for transaction preferences
- `messageNotifications` - JSON object for message preferences
- `accountNotifications` - JSON object for account preferences
- `marketingNotifications` - JSON object for marketing preferences
- `systemNotifications` - JSON object for system preferences
- `doNotDisturbStart`, `doNotDisturbEnd` - Do Not Disturb time window
- `timezone` - User timezone
- `language` - Preferred language

**Removed columns:**
- `email`, `sms`, `push` (replaced by specific toggles)

### 3. Device Tokens Table (New)
A new table for managing push notification device tokens.

## Migration Options

### Option 1: Automatic Migration (Recommended for Development)

If using Sequelize with `sync()`, the tables will be automatically updated when you restart your server:

```javascript
// In your server startup (index.js)
import sequelize from './database/db.js';

// Development only - automatically syncs schema
await sequelize.sync({ alter: true });
```

⚠️ **Warning:** Only use `alter: true` in development. For production, use manual migrations.

### Option 2: Manual SQL Migration (Recommended for Production)

#### Step 1: Backup Your Database
```sql
-- Create a backup before migration
pg_dump your_database_name > backup_before_notification_migration.sql
```

#### Step 2: Run Migration SQL

Create a file `migrations/001_notification_system.sql`:

```sql
-- ============================================
-- NOTIFICATION SYSTEM MIGRATION
-- ============================================

-- Step 1: Alter Notifications Table
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS channels JSON DEFAULT '["in_app"]',
  ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "deliveryStatus" JSON,
  ADD COLUMN IF NOT EXISTS "actionUrl" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "imageUrl" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "pushSentAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "smsSentAt" TIMESTAMP;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications("expiresAt");

-- Step 2: Alter Notification Preferences Table
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS "emailEnabled" BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS "smsEnabled" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "pushEnabled" BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS "inAppEnabled" BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS "bookingNotifications" JSON DEFAULT '{"email":true,"push":true,"sms":false,"inApp":true}',
  ADD COLUMN IF NOT EXISTS "transactionNotifications" JSON DEFAULT '{"email":true,"push":true,"sms":false,"inApp":true}',
  ADD COLUMN IF NOT EXISTS "messageNotifications" JSON DEFAULT '{"email":true,"push":true,"sms":false,"inApp":true}',
  ADD COLUMN IF NOT EXISTS "accountNotifications" JSON DEFAULT '{"email":true,"push":true,"sms":false,"inApp":true}',
  ADD COLUMN IF NOT EXISTS "marketingNotifications" JSON DEFAULT '{"email":true,"push":false,"sms":false,"inApp":true}',
  ADD COLUMN IF NOT EXISTS "systemNotifications" JSON DEFAULT '{"email":true,"push":true,"sms":false,"inApp":true}',
  ADD COLUMN IF NOT EXISTS "doNotDisturbStart" TIME,
  ADD COLUMN IF NOT EXISTS "doNotDisturbEnd" TIME,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Migrate old preferences to new format (if old columns exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='notification_preferences' AND column_name='email'
  ) THEN
    UPDATE notification_preferences 
    SET "emailEnabled" = email,
        "pushEnabled" = push,
        "smsEnabled" = sms
    WHERE "emailEnabled" IS NULL;
    
    -- Drop old columns
    ALTER TABLE notification_preferences 
      DROP COLUMN IF EXISTS email,
      DROP COLUMN IF EXISTS sms,
      DROP COLUMN IF EXISTS push;
  END IF;
END $$;

-- Step 3: Create Device Tokens Table
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  "deviceId" VARCHAR(255),
  "deviceName" VARCHAR(100),
  "appVersion" VARCHAR(20),
  "osVersion" VARCHAR(50),
  "isActive" BOOLEAN DEFAULT true,
  "lastUsedAt" TIMESTAMP,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for device tokens
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens("userId");
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON device_tokens("isActive");
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform ON device_tokens(platform);
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_user_device ON device_tokens("userId", "deviceId");

-- Step 4: Update notification types to use specific values
-- Convert any generic types to the new enum values
UPDATE notifications 
SET type = 'general' 
WHERE type NOT IN (
  'booking_created', 'booking_confirmed', 'booking_cancelled', 
  'booking_completed', 'booking_reminder', 'payment_received', 
  'payment_failed', 'review_received', 'message_received', 
  'account_update', 'promotion', 'system_alert', 'general'
);

-- Set category based on type for existing notifications
UPDATE notifications 
SET category = CASE
  WHEN type LIKE 'booking_%' THEN 'booking'
  WHEN type LIKE 'payment_%' THEN 'transaction'
  WHEN type LIKE 'message_%' THEN 'message'
  WHEN type = 'account_update' THEN 'account'
  WHEN type = 'promotion' THEN 'marketing'
  ELSE 'system'
END
WHERE category IS NULL OR category = 'system';

-- Set priority based on type for existing notifications
UPDATE notifications 
SET priority = CASE
  WHEN type IN ('payment_failed', 'booking_cancelled') THEN 'urgent'
  WHEN type IN ('booking_confirmed', 'payment_received', 'booking_created') THEN 'high'
  WHEN type = 'promotion' THEN 'low'
  ELSE 'normal'
END
WHERE priority IS NULL OR priority = 'normal';

COMMIT;
```

#### Step 3: Run the Migration

```bash
# Using psql
psql -U your_username -d your_database -f migrations/001_notification_system.sql

# Or using a migration tool
npm run migrate
```

### Option 3: Using Sequelize Migrations

Create a Sequelize migration file:

```bash
npx sequelize-cli migration:generate --name notification-system-enhancement
```

Then edit the generated migration file with the SQL from Option 2.

## Verification

After migration, verify the changes:

```sql
-- Check notifications table structure
\d notifications

-- Check notification_preferences table structure
\d notification_preferences

-- Check device_tokens table exists
\d device_tokens

-- Count existing notifications
SELECT COUNT(*) FROM notifications;

-- Check if categories were assigned correctly
SELECT category, COUNT(*) FROM notifications GROUP BY category;

-- Verify preferences were migrated
SELECT COUNT(*) FROM notification_preferences;
```

## Post-Migration

1. **Test the System:**
```bash
# Start your server
npm run dev

# Test notification creation
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **Verify Endpoints:**
- Check that all notification endpoints work
- Verify user preferences are accessible
- Test device token registration

3. **Update Frontend:**
- Update notification components to use new fields
- Add support for notification categories
- Implement priority-based styling
- Add action buttons using `actionUrl`

## Rollback Plan

If you need to rollback:

```sql
-- Restore from backup
psql -U your_username -d your_database < backup_before_notification_migration.sql
```

Or if you want to keep data but remove new columns:

```sql
-- Remove new columns from notifications
ALTER TABLE notifications 
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS priority,
  DROP COLUMN IF EXISTS channels,
  DROP COLUMN IF EXISTS "readAt",
  DROP COLUMN IF EXISTS "deliveryStatus",
  DROP COLUMN IF EXISTS "actionUrl",
  DROP COLUMN IF EXISTS "imageUrl",
  DROP COLUMN IF EXISTS "expiresAt",
  DROP COLUMN IF EXISTS "pushSentAt",
  DROP COLUMN IF EXISTS "emailSentAt",
  DROP COLUMN IF EXISTS "smsSentAt";

-- Drop device_tokens table
DROP TABLE IF EXISTS device_tokens;

-- Restore old preference columns
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS push BOOLEAN DEFAULT true;
```

## Troubleshooting

### Issue: Column already exists
```
ERROR: column "category" of relation "notifications" already exists
```
**Solution:** The column is already added. This is safe to ignore or use `IF NOT EXISTS`.

### Issue: Type mismatch
```
ERROR: column "type" cannot be cast automatically to type enum_type
```
**Solution:** Update existing values first, then change type:
```sql
UPDATE notifications SET type = 'general' WHERE type IS NULL;
```

### Issue: Foreign key constraint fails
```
ERROR: insert or update on table violates foreign key constraint
```
**Solution:** Ensure referenced user exists:
```sql
-- Check for orphaned notifications
SELECT n.* FROM notifications n 
LEFT JOIN users u ON n."userId" = u.id 
WHERE u.id IS NULL;
```

## Environment Variables

Add these to your `.env` file if using push notifications:

```env
# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# SMS (optional)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-number
```

## Need Help?

- Check server logs for detailed error messages
- Verify database connection settings
- Ensure all required models are imported in `schema/index.js`
- Test with a fresh database first

---

**Migration complete!** Your notification system is ready to use. 🎉






