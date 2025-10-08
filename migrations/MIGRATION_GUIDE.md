# Database Migration Guide

## ✅ Configuration Fixed!

I've set up Sequelize CLI to work with your project. Here are the files created:

1. **`.sequelizerc`** - Tells Sequelize CLI where to find config and migrations
2. **`config/database.js`** - CommonJS config for Sequelize CLI
3. **Three migration files** - Sequelize-compatible migration files

## 🚀 Two Ways to Run Migrations

### Option 1: Using Sequelize CLI (Recommended for Development)

This approach gives you better control and allows you to rollback changes.

```bash
# From backend directory
npm run migrate
```

**What this does:**
- Runs all pending migrations in order
- Creates a `SequelizeMeta` table to track migrations
- Allows rollback with `sequelize-cli db:migrate:undo`

**Verify it worked:**
```bash
# Check migration status
npx sequelize-cli db:migrate:status
```

**Rollback if needed:**
```bash
# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all
```

---

### Option 2: Direct SQL Execution (Quick & Simple)

If you prefer to run the SQL directly:

```bash
# Using MySQL command line
mysql -u root -p alabastar_projects < migrations/RUN_THIS_MIGRATION.sql
```

Or using Git Bash (from backend directory):
```bash
mysql -u root -p alabastar_projects < migrations/RUN_THIS_MIGRATION.sql
```

**Pros:**
- ✅ Simple and fast
- ✅ All changes in one file
- ✅ Easy to review what will change

**Cons:**
- ❌ No rollback capability
- ❌ No migration tracking
- ❌ Can't run incrementally

---

## 📁 Migration Files

### Sequelize Migration Files (for `npm run migrate`)
- `20250101000001-add-notification-columns.js`
- `20250101000002-update-notification-preferences.js`
- `20250101000003-create-device-tokens.js`

### SQL Files (for direct execution)
- `RUN_THIS_MIGRATION.sql` - Complete migration (all in one)
- `001_add_notification_columns.sql` - Individual SQL file
- `002_update_notification_preferences.sql` - Individual SQL file
- `003_create_device_tokens.sql` - Individual SQL file

---

## 🎯 Recommended Workflow

### For Development:
```bash
# 1. Run migration
npm run migrate

# 2. Verify
npx sequelize-cli db:migrate:status

# 3. Check database
# (Use MySQL Workbench or command line to verify tables)
```

### For Production:
Use Sequelize CLI for better control and tracking:
```bash
NODE_ENV=production npx sequelize-cli db:migrate
```

---

## 🔧 After Running Migration

1. **Restart your server:**
   ```bash
   npm run dev
   ```

2. **Test the notification system:**
   ```bash
   # Sign up or log in to get a token
   # Then test notifications
   curl -X POST http://localhost:5000/api/notifications/test \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Check notifications:**
   ```bash
   curl http://localhost:5000/api/notifications \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## 🐛 Troubleshooting

### Error: "Table already exists"
This means the migration already ran. Check migration status:
```bash
npx sequelize-cli db:migrate:status
```

### Error: "Column already exists"
Some columns might already be in your database. Options:
1. Skip that specific migration
2. Manually drop the columns and re-run
3. Use SQL to selectively add missing columns

### Error: "Cannot read config"
Make sure you're in the `backend` directory when running migrations.

### Connection refused
Check your `.env` file has correct database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=alabastar_projects
DB_USER=root
DB_PASSWORD=your_password
```

---

## 📊 What Gets Created/Modified

### notifications table:
- ✅ 11 new columns added
- ✅ 3 new indexes created

### notification_preferences table:
- ✅ 14 new columns added
- ✅ JSON default values set

### device_tokens table:
- ✅ New table created
- ✅ 4 indexes created
- ✅ Foreign key to users table

---

## ✅ Verification Commands

After migration, verify with these SQL queries:

```sql
-- Check notifications table structure
DESCRIBE notifications;

-- Check notification_preferences table structure
DESCRIBE notification_preferences;

-- Check device_tokens table exists
DESCRIBE device_tokens;

-- Verify indexes
SHOW INDEX FROM notifications;
SHOW INDEX FROM notification_preferences;
SHOW INDEX FROM device_tokens;
```

---

## 🔄 If You Need to Start Over

### Using Sequelize CLI:
```bash
# Undo all migrations
npx sequelize-cli db:migrate:undo:all

# Re-run migrations
npm run migrate
```

### Using SQL:
```bash
# Drop the tables (CAUTION!)
mysql -u root -p alabastar_projects -e "DROP TABLE IF EXISTS device_tokens; ALTER TABLE notifications DROP COLUMN IF EXISTS category;"

# Re-run migration
mysql -u root -p alabastar_projects < migrations/RUN_THIS_MIGRATION.sql
```

---

## 📝 Creating New Migrations

When you need to make more database changes:

```bash
# Generate a new migration
npx sequelize-cli migration:generate --name your-migration-name

# Edit the generated file in migrations/
# Then run:
npm run migrate
```

---

## 🎓 Best Practices

1. **Always backup** before running migrations in production
2. **Test migrations** in development first
3. **Review migration files** before running
4. **Don't edit** migration files after they've been run
5. **Use version control** for migration files
6. **Document** any manual steps needed

---

## 🆘 Need Help?

- Check database connection with: `mysql -u root -p`
- Verify environment variables in `.env`
- Check server logs for detailed errors
- Review `NOTIFICATION_MIGRATION_GUIDE.md` for detailed SQL approach

---

**Ready to migrate!** Choose your preferred method and run the migration. 🚀






