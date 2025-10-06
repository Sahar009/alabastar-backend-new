import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const DeviceToken = sequelize.define('DeviceToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'FCM token for push notifications'
  },
  platform: {
    type: DataTypes.ENUM('ios', 'android', 'web'),
    allowNull: false
  },
  deviceId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Unique device identifier'
  },
  deviceName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'User-friendly device name'
  },
  appVersion: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  osVersion: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Token expiration date (if applicable)'
  }
}, {
  timestamps: true,
  tableName: 'device_tokens',
  indexes: [
    { fields: ['userId'] },
    { fields: ['isActive'] },
    { fields: ['platform'] },
    { unique: true, fields: ['userId', 'deviceId'] }
  ]
});

export default DeviceToken;

