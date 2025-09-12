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
  email: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  sms: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  push: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'notification_preferences',
  indexes: [
    { unique: true, fields: ['userId'] }
  ]
});

export default NotificationPreference;


