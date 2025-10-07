import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const ReferralCommission = sequelize.define('ReferralCommission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  referralId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Reference to the ProviderReferral'
  },
  referrerId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Provider who earned the commission'
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Subscription that generated the commission'
  },
  subscriptionAmount: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    comment: 'Original subscription amount'
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
    comment: 'Commission percentage applied'
  },
  commissionAmount: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    comment: 'Calculated commission amount'
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Commission payment status'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the commission was paid'
  },
  paymentMethod: {
    type: DataTypes.ENUM('wallet', 'bank_transfer', 'mobile_money'),
    allowNull: true,
    comment: 'How the commission was paid'
  },
  paymentReference: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Payment reference number'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional commission data'
  }
}, {
  timestamps: true,
  tableName: 'referral_commissions',
  indexes: [
    { fields: ['referralId'] },
    { fields: ['referrerId'] },
    { fields: ['subscriptionId'] },
    { fields: ['status'] },
    { fields: ['paidAt'] },
    { fields: ['createdAt'] }
  ]
});

export default ReferralCommission;
