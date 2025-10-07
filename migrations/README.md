# Database Migration Instructions

## ⚠️ Important: Backup First!

Before running any migration, **backup your database**:

```bash
# For MySQL/MariaDB
mysqldump -u your_username -p your_database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🚀 Quick Migration (Recommended)

Run the complete migration file that includes all changes:

### Option 1: Using MySQL Command Line

```bash
mysql -u your_username -p your_database_name < backend/migrations/RUN_THIS_MIGRATION.sql
```

### Option 2: Using MySQL Workbench / phpMyAdmin

1. Open MySQL Workbench or phpMyAdmin
2. Select your database
3. Open the SQL tab
4. Copy and paste the contents of `RUN_THIS_MIGRATION.sql`
5. Execute the query

### Option 3: Using Node.js Terminal

```bash
# From your backend directory
mysql -u root -p alabastar_db < migrations/RUN_THIS_MIGRATION.sql
```

## 📝 Individual Migration Files

If you prefer to run migrations step-by-step:

1. **Update Notifications Table**
   ```bash
   mysql -u your_username -p your_database_name < backend/migrations/001_add_notification_columns.sql
   ```

2. **Update Notification Preferences Table**
   ```bash
   mysql -u your_username -p your_database_name < backend/migrations/002_update_notification_preferences.sql
   ```

3. **Create Device Tokens Table**
   ```bash
   mysql -u your_username -p your_database_name < backend/migrations/003_create_device_tokens.sql
   ```

## ✅ Verify Migration

After running the migration, verify it worked:

```sql
-- Check notifications table
DESCRIBE notifications;

-- Check notification_preferences table
DESCRIBE notification_preferences;

-- Check device_tokens table
DESCRIBE device_tokens;

-- Verify data
SELECT COUNT(*) FROM notifications;
SELECT COUNT(*) FROM notification_preferences;
```

## 🔄 After Migration

1. **Restart your server**
   ```bash
   npm run dev
   ```

2. **Test the notification system**
   ```bash
   # Get a token from login
   # Then test notification endpoint
   curl -X POST http://localhost:5000/api/notifications/test \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Check for errors**
   - Look at server logs
   - Verify no Sequelize errors
   - Test creating a notification

## 🆘 Troubleshooting

### Error: "Column already exists"
This means you already ran part of the migration. You can either:
- Skip that specific column in the SQL
- Drop the column and re-add it
- Or ignore the error if the column is correct

### Error: "Table doesn't exist"
Make sure you're running the migration on the correct database.

### Error: "Foreign key constraint fails"
Ensure the `users` table exists before creating `device_tokens` table.

## 🔙 Rollback (if needed)

If something goes wrong, restore from backup:

```bash
mysql -u your_username -p your_database_name < backup_file.sql
```

## 📊 What Changed?

### Notifications Table
- ✅ Added `category` column (transaction, booking, message, etc.)
- ✅ Added `priority` column (low, normal, high, urgent)
- ✅ Added `channels` column (JSON array)
- ✅ Added `readAt` timestamp
- ✅ Added `deliveryStatus` JSON tracking
- ✅ Added `actionUrl` for deep links
- ✅ Added `imageUrl` for rich notifications
- ✅ Added `expiresAt` timestamp
- ✅ Added `pushSentAt`, `emailSentAt`, `smsSentAt` timestamps
- ✅ Added 3 new indexes

### Notification Preferences Table
- ✅ Added `emailEnabled`, `smsEnabled`, `pushEnabled`, `inAppEnabled` toggles
- ✅ Added category-specific JSON preferences (6 categories)
- ✅ Added `doNotDisturbStart`, `doNotDisturbEnd` for scheduling
- ✅ Added `timezone` and `language` fields

### Device Tokens Table (New)
- ✅ Created new table for push notification tokens
- ✅ Multi-device support (iOS, Android, Web)
- ✅ Device metadata tracking
- ✅ Active/inactive status management

## ✨ Next Steps

After successful migration:
1. ✅ Notification system is ready to use
2. ✅ Start integrating helper functions in your code
3. ✅ Build frontend notification UI
4. ✅ Set up Firebase for push notifications (optional)

---

**Need help?** Check the full documentation in `NOTIFICATION_SYSTEM.md`




