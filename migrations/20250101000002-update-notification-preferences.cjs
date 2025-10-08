'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new preference columns
    await queryInterface.addColumn('notification_preferences', 'emailEnabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('notification_preferences', 'smsEnabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('notification_preferences', 'pushEnabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('notification_preferences', 'inAppEnabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('notification_preferences', 'bookingNotifications', {
      type: Sequelize.JSON,
      allowNull: false
    });

    await queryInterface.addColumn('notification_preferences', 'transactionNotifications', {
      type: Sequelize.JSON,
      allowNull: false
    });

    await queryInterface.addColumn('notification_preferences', 'messageNotifications', {
      type: Sequelize.JSON,
      allowNull: false
    });

    await queryInterface.addColumn('notification_preferences', 'accountNotifications', {
      type: Sequelize.JSON,
      allowNull: false
    });

    await queryInterface.addColumn('notification_preferences', 'marketingNotifications', {
      type: Sequelize.JSON,
      allowNull: false
    });

    await queryInterface.addColumn('notification_preferences', 'systemNotifications', {
      type: Sequelize.JSON,
      allowNull: false
    });

    await queryInterface.addColumn('notification_preferences', 'doNotDisturbStart', {
      type: Sequelize.TIME,
      allowNull: true
    });

    await queryInterface.addColumn('notification_preferences', 'doNotDisturbEnd', {
      type: Sequelize.TIME,
      allowNull: true
    });

    await queryInterface.addColumn('notification_preferences', 'timezone', {
      type: Sequelize.STRING(50),
      defaultValue: 'UTC'
    });

    await queryInterface.addColumn('notification_preferences', 'language', {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: 'en'
    });

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
  },

  async down(queryInterface, Sequelize) {
    // Remove columns
    await queryInterface.removeColumn('notification_preferences', 'emailEnabled');
    await queryInterface.removeColumn('notification_preferences', 'smsEnabled');
    await queryInterface.removeColumn('notification_preferences', 'pushEnabled');
    await queryInterface.removeColumn('notification_preferences', 'inAppEnabled');
    await queryInterface.removeColumn('notification_preferences', 'bookingNotifications');
    await queryInterface.removeColumn('notification_preferences', 'transactionNotifications');
    await queryInterface.removeColumn('notification_preferences', 'messageNotifications');
    await queryInterface.removeColumn('notification_preferences', 'accountNotifications');
    await queryInterface.removeColumn('notification_preferences', 'marketingNotifications');
    await queryInterface.removeColumn('notification_preferences', 'systemNotifications');
    await queryInterface.removeColumn('notification_preferences', 'doNotDisturbStart');
    await queryInterface.removeColumn('notification_preferences', 'doNotDisturbEnd');
    await queryInterface.removeColumn('notification_preferences', 'timezone');
    await queryInterface.removeColumn('notification_preferences', 'language');
  }
};






