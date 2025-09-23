import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'NGN'
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  providerReference: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  gateway: {
    type: DataTypes.ENUM('paystack', 'flutterwave', 'stripe', 'manual'),
    allowNull: false,
    defaultValue: 'paystack'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'payments',
  indexes: [
    { fields: ['bookingId'] },
    { fields: ['userId'] },
    { fields: ['providerId'] },
    { fields: ['status'] }
  ]
});

export default Payment;









