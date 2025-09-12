import { Sequelize } from 'sequelize';
import { config } from "../config/config.js";

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    retry: {
      max: 3
    },
    // Cloud SQL specific settings - only SSL if explicitly enabled
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
)

export const connectToDB = async () => {
  try {
    console.log(`🔌 Attempting to connect to database at ${config.database.host}:${config.database.port}...`);
    
    await sequelize.authenticate()
    console.log("✅ Connected to Cloud SQL database successfully")

    // Sync database with proper order handling
    try {
      await sequelize.sync({ force: false, alter: false })
      console.log("✅ Database synchronized successfully")
    } catch (syncError) {
      console.warn("⚠️ Database sync warning:", syncError.message)
      // Try to sync without foreign key checks
      try {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;')
        await sequelize.sync({ force: false, alter: false })
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;')
        console.log("✅ Database synchronized with foreign key checks disabled")
      } catch (finalError) {
        console.error("❌ Final sync attempt failed:", finalError.message)
        throw finalError
      }
    }
    
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error.message)
    console.log("\n🔧 Cloud SQL Troubleshooting:")
    console.log("1. Check your .env file has correct Cloud SQL credentials")
    console.log("2. Verify the Cloud SQL instance is running")
    console.log("3. Check if your IP is whitelisted in Cloud SQL")
    console.log("4. Verify database name, username, and password")
    console.log("5. Check if the database exists")
    throw error; // Re-throw to stop server startup
  }
}

export default sequelize

