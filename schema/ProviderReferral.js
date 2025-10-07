import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const ProviderReferral = sequelize.define('ProviderReferral', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  referrerId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Provider who made the referral'
  },
  refereeId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Provider who was referred'
  },
  referralCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Unique referral code used'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Status of the referral'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the referee completed subscription'
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    defaultValue: 10.00,
    comment: 'Commission percentage (e.g., 10.00 for 10%)'
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Reference to the subscription that triggered commission'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional referral data'
  }
}, {
  timestamps: true,
  tableName: 'provider_referrals',
  indexes: [
    { fields: ['referrerId'] },
    { fields: ['refereeId'] },
    { fields: ['referralCode'] },
    { fields: ['status'] },
    { fields: ['completedAt'] },
    { unique: true, fields: ['referrerId', 'refereeId'] }
  ]
});

export default ProviderReferral;
