import { Sequelize } from 'sequelize';
import { config } from '../config/config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = async () => {
  const sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password,
    {
      host: config.database.host,
      port: config.database.port,
      dialect: 'mysql',
      logging: false,
      dialectOptions: process.env.DB_SSL === 'true' ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : {}
    }
  );

  try {
    console.log('🔄 Running database migrations...');

    // Get all migration files
    const migrationsPath = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.cjs'))
      .sort(); // Sort to run in order

    // Create migrations table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS SequelizeMeta (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      )
    `);

    // Get already run migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM SequelizeMeta'
    );
    const executedNames = executedMigrations.map(m => m.name);

    // Run pending migrations
    let migrationsRun = 0;
    for (const file of migrationFiles) {
      if (!executedNames.includes(file)) {
        console.log(`📝 Running migration: ${file}`);
        
        const migrationPath = path.join(migrationsPath, file);
        const migration = require(migrationPath);
        
        try {
          await migration.up(sequelize.getQueryInterface(), Sequelize);
          
          // Mark as executed
          await sequelize.query(
            'INSERT INTO SequelizeMeta (name) VALUES (?)',
            { replacements: [file] }
          );
          
          console.log(`✅ Migration completed: ${file}`);
          migrationsRun++;
        } catch (error) {
          console.error(`❌ Migration failed: ${file}`, error.message);
          throw error;
        }
      }
    }

    if (migrationsRun === 0) {
      console.log('✅ All migrations are up to date');
    } else {
      console.log(`✅ Successfully ran ${migrationsRun} migration(s)`);
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Migration error:', error);
    await sequelize.close();
    throw error;
  }
};
