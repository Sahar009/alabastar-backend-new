/**
 * Utility script to ensure privacySettings column exists in users table
 * This runs on server startup to automatically add the column if missing
 */

import sequelize from '../database/db.js';

/**
 * Check and add privacySettings column if it doesn't exist
 * @returns {Promise<boolean>} True if column was added or already exists, false on error
 */
export async function ensurePrivacySettingsColumn() {
  try {
    // Check if column exists
    const [results] = await sequelize.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'privacySettings'`
    );

    if (results.length === 0) {
      // Column doesn't exist, add it
      console.log('🔧 Adding missing privacySettings column to users table...');
      
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN privacySettings JSON NULL 
        DEFAULT (JSON_OBJECT(
          'showProfile', true,
          'showContactInfo', true,
          'showPortfolio', true
        ))
        COMMENT 'Privacy preferences for both customers and providers: showProfile, showContactInfo, showPortfolio'
      `);
      
      console.log('✅ Successfully added privacySettings column to users table');
      return true;
    } else {
      console.log('✅ privacySettings column already exists in users table');
      return true;
    }
  } catch (error) {
    // Check if error is because column already exists (MySQL error code 1060)
    if (error.original?.code === 'ER_DUP_FIELDNAME' || 
        error.message?.includes('Duplicate column name')) {
      console.log('ℹ️  privacySettings column already exists (checked via error)');
      return true;
    }
    
    console.error('❌ Error ensuring privacySettings column:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

export default ensurePrivacySettingsColumn;


