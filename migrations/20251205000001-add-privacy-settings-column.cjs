'use strict';

/**
 * Migration: Add privacySettings column to users table
 * 
 * This migration adds the privacySettings JSON column to the users table
 * if it doesn't already exist. The column stores privacy preferences
 * for both customers and providers.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    
    // Check if column already exists
    const [results] = await queryInterface.sequelize.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'privacySettings'`
    );

    if (results.length === 0) {
      // Column doesn't exist, add it
      await queryInterface.addColumn('users', 'privacySettings', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: JSON.stringify({
          showProfile: true,
          showContactInfo: true,
          showPortfolio: true
        }),
        comment: 'Privacy preferences for both customers and providers: showProfile, showContactInfo, showPortfolio'
      });
      
      console.log('✅ Added privacySettings column to users table');
    } else {
      console.log('ℹ️  privacySettings column already exists in users table');
    }
  },

  async down(queryInterface, Sequelize) {
    // Check if column exists before removing
    const [results] = await queryInterface.sequelize.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'privacySettings'`
    );

    if (results.length > 0) {
      await queryInterface.removeColumn('users', 'privacySettings');
      console.log('✅ Removed privacySettings column from users table');
    } else {
      console.log('ℹ️  privacySettings column does not exist in users table');
    }
  }
};



