import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const ProviderSetting = sequelize.define('ProviderSetting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    unique: true,
  },
  notifications: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      email: true,
      sms: false,
      push: true,
    },
  },
  privacy: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      showProfile: true,
      showContactInfo: true,
      showPortfolio: true,
    },
  },
  autoAcceptBookings: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  twoFactorAuth: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  allowDirectMessages: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'provider_settings',
  indexes: [
    { unique: true, fields: ['userId'] },
  ],
});

export default ProviderSetting;
