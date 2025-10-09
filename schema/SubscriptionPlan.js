import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(140),
    allowNull: false,
    unique: true
  },
  price: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  interval: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    allowNull: false
  },
  benefits: {
    type: DataTypes.JSON,
    allowNull: true
  },
  features: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      maxPhotos: 5,
      maxVideos: 0,
      videoMaxDuration: 0,
      topListingDays: 14,
      rewardsAccess: ['monthly'],
      promotionChannels: ['youtube'],
      promotionEvents: ['special'],
      priority: 1
    },
    comment: 'Feature limits and access based on subscription tier'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'subscription_plans',
  indexes: [
    { unique: true, fields: ['slug'] },
    { fields: ['isActive'] }
  ]
});

export default SubscriptionPlan;
































