'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🚀 Adding privacySettings column to users table...');

      // Check if column already exists
      const tableInfo = await queryInterface.describeTable('users');
      
      if (!tableInfo.privacySettings) {
        await queryInterface.addColumn('users', 'privacySettings', {
          type: Sequelize.DataTypes.JSON,
          allowNull: true,
          defaultValue: {
            showProfile: true,
            showContactInfo: true,
            showPortfolio: true
          },
          comment: 'Privacy preferences for both customers and providers'
        }, { transaction });
        console.log('✅ privacySettings column added');
      } else {
        console.log('ℹ️ privacySettings column already exists');
      }

      console.log('✅ Privacy settings migration completed!');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding privacySettings column:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔄 Removing privacySettings column from users table...');
      
      const tableInfo = await queryInterface.describeTable('users');
      
      if (tableInfo.privacySettings) {
        await queryInterface.removeColumn('users', 'privacySettings', { transaction });
        console.log('✅ privacySettings column removed');
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing privacySettings column:', error);
      throw error;
    }
  }
};