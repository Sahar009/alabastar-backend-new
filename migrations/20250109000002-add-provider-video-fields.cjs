'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🚀 Adding video and listing fields to provider_profiles...');

      const tableInfo = await queryInterface.describeTable('provider_profiles');

      // Add video fields
      if (!tableInfo.videoUrl) {
        await queryInterface.addColumn('provider_profiles', 'videoUrl', {
          type: Sequelize.DataTypes.STRING(500),
          allowNull: true,
          comment: 'Business promotional video URL (Premium feature)'
        }, { transaction });
        console.log('✅ videoUrl column added');
      }

      if (!tableInfo.videoThumbnail) {
        await queryInterface.addColumn('provider_profiles', 'videoThumbnail', {
          type: Sequelize.DataTypes.STRING(500),
          allowNull: true,
          comment: 'Video thumbnail image URL'
        }, { transaction });
        console.log('✅ videoThumbnail column added');
      }

      if (!tableInfo.videoDuration) {
        await queryInterface.addColumn('provider_profiles', 'videoDuration', {
          type: Sequelize.DataTypes.INTEGER,
          allowNull: true,
          comment: 'Video duration in seconds (max 90 for Premium)'
        }, { transaction });
        console.log('✅ videoDuration column added');
      }

      if (!tableInfo.videoUploadedAt) {
        await queryInterface.addColumn('provider_profiles', 'videoUploadedAt', {
          type: Sequelize.DataTypes.DATE,
          allowNull: true,
          comment: 'When the video was uploaded'
        }, { transaction });
        console.log('✅ videoUploadedAt column added');
      }

      // Add top listing fields
      if (!tableInfo.topListingStartDate) {
        await queryInterface.addColumn('provider_profiles', 'topListingStartDate', {
          type: Sequelize.DataTypes.DATE,
          allowNull: true,
          comment: 'When top listing started'
        }, { transaction });
        console.log('✅ topListingStartDate column added');
      }

      if (!tableInfo.topListingEndDate) {
        await queryInterface.addColumn('provider_profiles', 'topListingEndDate', {
          type: Sequelize.DataTypes.DATE,
          allowNull: true,
          comment: 'When top listing expires'
        }, { transaction });
        console.log('✅ topListingEndDate column added');
      }

      if (!tableInfo.listingPriority) {
        await queryInterface.addColumn('provider_profiles', 'listingPriority', {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 1,
          allowNull: false,
          comment: 'Listing priority (1=Basic, 2=Premium)'
        }, { transaction });
        console.log('✅ listingPriority column added');
      }

      // Add indexes
      const indexes = await queryInterface.showIndex('provider_profiles');
      const indexNames = indexes.map(idx => idx.name);

      if (!indexNames.includes('provider_profiles_topListingEndDate')) {
        await queryInterface.addIndex('provider_profiles', ['topListingEndDate'], {
          name: 'provider_profiles_topListingEndDate',
          transaction
        });
        console.log('✅ Index on topListingEndDate added');
      }

      if (!indexNames.includes('provider_profiles_listingPriority')) {
        await queryInterface.addIndex('provider_profiles', ['listingPriority'], {
          name: 'provider_profiles_listingPriority',
          transaction
        });
        console.log('✅ Index on listingPriority added');
      }

      console.log('🎉 Provider profile video and listing fields added successfully!');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding provider video fields:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔄 Removing video and listing fields from provider_profiles...');

      const tableInfo = await queryInterface.describeTable('provider_profiles');

      if (tableInfo.videoUrl) {
        await queryInterface.removeColumn('provider_profiles', 'videoUrl', { transaction });
      }
      if (tableInfo.videoThumbnail) {
        await queryInterface.removeColumn('provider_profiles', 'videoThumbnail', { transaction });
      }
      if (tableInfo.videoDuration) {
        await queryInterface.removeColumn('provider_profiles', 'videoDuration', { transaction });
      }
      if (tableInfo.videoUploadedAt) {
        await queryInterface.removeColumn('provider_profiles', 'videoUploadedAt', { transaction });
      }
      if (tableInfo.topListingStartDate) {
        await queryInterface.removeColumn('provider_profiles', 'topListingStartDate', { transaction });
      }
      if (tableInfo.topListingEndDate) {
        await queryInterface.removeColumn('provider_profiles', 'topListingEndDate', { transaction });
      }
      if (tableInfo.listingPriority) {
        await queryInterface.removeColumn('provider_profiles', 'listingPriority', { transaction });
      }

      console.log('✅ Video and listing fields removed');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing video fields:', error);
      throw error;
    }
  }
};

