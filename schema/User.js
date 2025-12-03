import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fullName: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING(32),
    allowNull: true,
    unique: true
  },
  alternativePhone: {
    type: DataTypes.STRING(32),
    allowNull: true
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('customer', 'provider', 'admin'),
    allowNull: false,
    defaultValue: 'customer'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    allowNull: false,
    defaultValue: 'active'
  },
  avatarUrl: {
    type: DataTypes.STRING(2048),
    allowNull: true
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isPhoneVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  provider: {
    type: DataTypes.ENUM('email', 'google', 'firebase'),
    allowNull: false,
    defaultValue: 'email'
  },
  firebaseUid: {
    type: DataTypes.STRING(128),
    allowNull: true,
    unique: true
  },
  privacySettings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      showProfile: true,
      showContactInfo: true,
      showPortfolio: true
    },
    comment: 'Privacy preferences for both customers and providers: showProfile, showContactInfo, showPortfolio'
  }
}, {
  timestamps: true,
  tableName: 'users',
  indexes: [
    { unique: true, fields: ['email'] },
    { unique: true, fields: ['phone'] },
    { fields: ['role'] },
    { fields: ['alternativePhone'] },
    { unique: true, fields: ['firebaseUid'] }
  ]
});

export default User;



