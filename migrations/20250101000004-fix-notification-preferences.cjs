'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('notification_preferences');
    
    // Check and add emailEnabled
    if (!tableInfo.emailEnabled) {
      await queryInterface.addColumn('notification_preferences', 'emailEnabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }

    // Check and add smsEnabled
    if (!tableInfo.smsEnabled) {
      await queryInterface.addColumn('notification_preferences', 'smsEnabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    // Check and add pushEnabled
    if (!tableInfo.pushEnabled) {
      await queryInterface.addColumn('notification_preferences', 'pushEnabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }

    // Check and add inAppEnabled
    if (!tableInfo.inAppEnabled) {
      await queryInterface.addColumn('notification_preferences', 'inAppEnabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }

    // Check and add bookingNotifications
    if (!tableInfo.bookingNotifications) {
      await queryInterface.addColumn('notification_preferences', 'bookingNotifications', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }

    // Check and add transactionNotifications
    if (!tableInfo.transactionNotifications) {
      await queryInterface.addColumn('notification_preferences', 'transactionNotifications', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }

    // Check and add messageNotifications
    if (!tableInfo.messageNotifications) {
      await queryInterface.addColumn('notification_preferences', 'messageNotifications', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }

    // Check and add accountNotifications
    if (!tableInfo.accountNotifications) {
      await queryInterface.addColumn('notification_preferences', 'accountNotifications', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }

    // Check and add marketingNotifications
    if (!tableInfo.marketingNotifications) {
      await queryInterface.addColumn('notification_preferences', 'marketingNotifications', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }

    // Check and add systemNotifications
    if (!tableInfo.systemNotifications) {
      await queryInterface.addColumn('notification_preferences', 'systemNotifications', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }

    // Check and add doNotDisturbStart
    if (!tableInfo.doNotDisturbStart) {
      await queryInterface.addColumn('notification_preferences', 'doNotDisturbStart', {
        type: Sequelize.TIME,
        allowNull: true
      });
    }

    // Check and add doNotDisturbEnd
    if (!tableInfo.doNotDisturbEnd) {
      await queryInterface.addColumn('notification_preferences', 'doNotDisturbEnd', {
        type: Sequelize.TIME,
        allowNull: true
      });
    }

    // Check and add timezone
    if (!tableInfo.timezone) {
      await queryInterface.addColumn('notification_preferences', 'timezone', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'UTC'
      });
    }

    // Check and add language
    if (!tableInfo.language) {
      await queryInterface.addColumn('notification_preferences', 'language', {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'en'
      });
    }

    // Set default JSON values for existing rows
    await queryInterface.sequelize.query(`
      UPDATE notification_preferences 
      SET 
        bookingNotifications = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
        transactionNotifications = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
        messageNotifications = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
        accountNotifications = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true),
        marketingNotifications = JSON_OBJECT('email', true, 'push', false, 'sms', false, 'inApp', true),
        systemNotifications = JSON_OBJECT('email', true, 'push', true, 'sms', false, 'inApp', true)
      WHERE bookingNotifications IS NULL
    `);

    console.log('✅ notification_preferences table updated successfully!');
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('notification_preferences');
    
    // Remove columns if they exist
    if (tableInfo.emailEnabled) {
      await queryInterface.removeColumn('notification_preferences', 'emailEnabled');
    }
    if (tableInfo.smsEnabled) {
      await queryInterface.removeColumn('notification_preferences', 'smsEnabled');
    }
    if (tableInfo.pushEnabled) {
      await queryInterface.removeColumn('notification_preferences', 'pushEnabled');
    }
    if (tableInfo.inAppEnabled) {
      await queryInterface.removeColumn('notification_preferences', 'inAppEnabled');
    }
    if (tableInfo.bookingNotifications) {
      await queryInterface.removeColumn('notification_preferences', 'bookingNotifications');
    }
    if (tableInfo.transactionNotifications) {
      await queryInterface.removeColumn('notification_preferences', 'transactionNotifications');
    }
    if (tableInfo.messageNotifications) {
      await queryInterface.removeColumn('notification_preferences', 'messageNotifications');
    }
    if (tableInfo.accountNotifications) {
      await queryInterface.removeColumn('notification_preferences', 'accountNotifications');
    }
    if (tableInfo.marketingNotifications) {
      await queryInterface.removeColumn('notification_preferences', 'marketingNotifications');
    }
    if (tableInfo.systemNotifications) {
      await queryInterface.removeColumn('notification_preferences', 'systemNotifications');
    }
    if (tableInfo.doNotDisturbStart) {
      await queryInterface.removeColumn('notification_preferences', 'doNotDisturbStart');
    }
    if (tableInfo.doNotDisturbEnd) {
      await queryInterface.removeColumn('notification_preferences', 'doNotDisturbEnd');
    }
    if (tableInfo.timezone) {
      await queryInterface.removeColumn('notification_preferences', 'timezone');
    }
    if (tableInfo.language) {
      await queryInterface.removeColumn('notification_preferences', 'language');
    }
  }
};

