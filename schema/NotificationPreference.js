import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const NotificationPreference = sequelize.define('NotificationPreference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  // Global channel preferences
  emailEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  smsEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  pushEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  inAppEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  
  // Category-specific preferences
  bookingNotifications: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    }
  },
  transactionNotifications: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    }
  },
  messageNotifications: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    }
  },
  accountNotifications: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    }
  },
  marketingNotifications: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      email: true,
      push: false,
      sms: false,
      inApp: true
    }
  },
  systemNotifications: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    }
  },
  
  // Additional preferences
  doNotDisturbStart: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Start time for Do Not Disturb (e.g., 22:00:00)'
  },
  doNotDisturbEnd: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'End time for Do Not Disturb (e.g., 08:00:00)'
  },
  timezone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'UTC'
  },
  language: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'en'
  }
}, {
  timestamps: true,
  tableName: 'notification_preferences',
  indexes: [
    { unique: true, fields: ['userId'] }
  ]
});

export default NotificationPreference;



























