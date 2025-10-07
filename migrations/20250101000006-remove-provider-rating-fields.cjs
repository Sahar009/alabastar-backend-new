'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔧 Removing redundant rating fields from provider_profiles...');
      
      // Check if columns exist before removing them
      const tableInfo = await queryInterface.describeTable('provider_profiles');
      
      if (tableInfo.ratingAverage) {
        await queryInterface.removeColumn('provider_profiles', 'ratingAverage');
        console.log('✅ Removed ratingAverage column');
      } else {
        console.log('ℹ️ ratingAverage column does not exist');
      }
      
      if (tableInfo.ratingCount) {
        await queryInterface.removeColumn('provider_profiles', 'ratingCount');
        console.log('✅ Removed ratingCount column');
      } else {
        console.log('ℹ️ ratingCount column does not exist');
      }
      
      console.log('🎉 Provider rating fields removed successfully!');
    } catch (error) {
      console.error('❌ Error removing rating fields:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log('🔄 Adding back rating fields to provider_profiles...');
      
      // Add back the rating fields
      await queryInterface.addColumn('provider_profiles', 'ratingAverage', {
        type: Sequelize.DataTypes.DECIMAL(3,2),
        defaultValue: 0,
        allowNull: false
      });
      
      await queryInterface.addColumn('provider_profiles', 'ratingCount', {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
      
      console.log('✅ Rating fields restored!');
    } catch (error) {
      console.error('❌ Error restoring rating fields:', error.message);
      throw error;
    }
  }
};
