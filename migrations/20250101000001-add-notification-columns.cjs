'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('notifications');
    
    // Add new columns only if they don't exist
    if (!tableInfo.category) {
      await queryInterface.addColumn('notifications', 'category', {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'system'
      });
    }

    if (!tableInfo.priority) {
      await queryInterface.addColumn('notifications', 'priority', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'normal'
      });
    }

    if (!tableInfo.channels) {
      await queryInterface.addColumn('notifications', 'channels', {
        type: Sequelize.JSON,
        allowNull: false
      });
    }

    if (!tableInfo.readAt) {
      await queryInterface.addColumn('notifications', 'readAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableInfo.deliveryStatus) {
      await queryInterface.addColumn('notifications', 'deliveryStatus', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }

    if (!tableInfo.actionUrl) {
      await queryInterface.addColumn('notifications', 'actionUrl', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
    }

    if (!tableInfo.imageUrl) {
      await queryInterface.addColumn('notifications', 'imageUrl', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
    }

    if (!tableInfo.expiresAt) {
      await queryInterface.addColumn('notifications', 'expiresAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableInfo.pushSentAt) {
      await queryInterface.addColumn('notifications', 'pushSentAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableInfo.emailSentAt) {
      await queryInterface.addColumn('notifications', 'emailSentAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableInfo.smsSentAt) {
      await queryInterface.addColumn('notifications', 'smsSentAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    // Set default values for existing rows
    await queryInterface.sequelize.query(
      "UPDATE notifications SET channels = JSON_ARRAY('in_app') WHERE channels IS NULL"
    );

    // Check and add indexes
    const indexes = await queryInterface.showIndex('notifications');
    const indexNames = indexes.map(idx => idx.name);

    if (!indexNames.includes('notifications_category')) {
      await queryInterface.addIndex('notifications', ['category'], {
        name: 'notifications_category'
      });
    }

    if (!indexNames.includes('notifications_priority')) {
      await queryInterface.addIndex('notifications', ['priority'], {
        name: 'notifications_priority'
      });
    }

    if (!indexNames.includes('notifications_expiresAt')) {
      await queryInterface.addIndex('notifications', ['expiresAt'], {
        name: 'notifications_expiresAt'
      });
    }

    console.log('✅ Notifications table updated successfully!');
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('notifications', 'notifications_category');
    await queryInterface.removeIndex('notifications', 'notifications_priority');
    await queryInterface.removeIndex('notifications', 'notifications_expiresAt');

    // Remove columns
    await queryInterface.removeColumn('notifications', 'category');
    await queryInterface.removeColumn('notifications', 'priority');
    await queryInterface.removeColumn('notifications', 'channels');
    await queryInterface.removeColumn('notifications', 'readAt');
    await queryInterface.removeColumn('notifications', 'deliveryStatus');
    await queryInterface.removeColumn('notifications', 'actionUrl');
    await queryInterface.removeColumn('notifications', 'imageUrl');
    await queryInterface.removeColumn('notifications', 'expiresAt');
    await queryInterface.removeColumn('notifications', 'pushSentAt');
    await queryInterface.removeColumn('notifications', 'emailSentAt');
    await queryInterface.removeColumn('notifications', 'smsSentAt');
  }
};

