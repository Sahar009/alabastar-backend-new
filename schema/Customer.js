import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  emergencyContact: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  emergencyPhone: {
    type: DataTypes.STRING(32),
    allowNull: true
  },
  preferredLanguage: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: 'en'
  },
  notificationSettings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      email: true,
      sms: true,
      push: true
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    allowNull: false,
    defaultValue: 'active'
  }
}, {
  timestamps: true,
  tableName: 'customers',
  indexes: [
    { unique: true, fields: ['userId'] },
    { fields: ['status'] }
  ]
});

export default Customer;






















