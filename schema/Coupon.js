import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(40),
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('percent', 'fixed'),
    allowNull: false
  },
  value: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  maxRedemptions: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  redeemedCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  startsAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'coupons',
  indexes: [
    { unique: true, fields: ['code'] },
    { fields: ['isActive'] },
    { fields: ['expiresAt'] }
  ]
});

export default Coupon;
























