'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🚀 Adding features column to subscription_plans...');

      // Check if features column already exists
      const tableInfo = await queryInterface.describeTable('subscription_plans');
      
      if (!tableInfo.features) {
        await queryInterface.addColumn('subscription_plans', 'features', {
          type: Sequelize.DataTypes.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Feature limits and access based on subscription tier'
        }, { transaction });
        console.log('✅ Features column added');
      } else {
        console.log('ℹ️ Features column already exists');
      }

      // Update existing plans with default features
      console.log('📝 Updating existing plans with feature configurations...');

      // Basic Plan features
      await queryInterface.sequelize.query(`
        UPDATE subscription_plans 
        SET features = JSON_OBJECT(
          'maxPhotos', 5,
          'maxVideos', 0,
          'videoMaxDuration', 0,
          'topListingDays', 14,
          'rewardsAccess', JSON_ARRAY('monthly'),
          'promotionChannels', JSON_ARRAY('youtube'),
          'promotionEvents', JSON_ARRAY('special'),
          'priority', 1
        )
        WHERE (name LIKE '%Basic%' OR slug LIKE '%basic%') 
        AND (features IS NULL OR JSON_LENGTH(features) = 0)
      `, { transaction });

      // Premium/Pro Plan features
      await queryInterface.sequelize.query(`
        UPDATE subscription_plans 
        SET features = JSON_OBJECT(
          'maxPhotos', 10,
          'maxVideos', 1,
          'videoMaxDuration', 90,
          'topListingDays', 60,
          'rewardsAccess', JSON_ARRAY('monthly', 'quarterly', 'special'),
          'promotionChannels', JSON_ARRAY('youtube', 'radio', 'tv'),
          'promotionEvents', JSON_ARRAY('special', 'extravaganza'),
          'priority', 2
        )
        WHERE (name LIKE '%Premium%' OR name LIKE '%Pro%' OR slug LIKE '%premium%' OR slug LIKE '%pro%') 
        AND (features IS NULL OR JSON_LENGTH(features) = 0)
      `, { transaction });

      console.log('✅ Subscription plans updated with features!');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding subscription features:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔄 Removing features column from subscription_plans...');
      
      const tableInfo = await queryInterface.describeTable('subscription_plans');
      if (tableInfo.features) {
        await queryInterface.removeColumn('subscription_plans', 'features', { transaction });
        console.log('✅ Features column removed');
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing features column:', error);
      throw error;
    }
  }
};

