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
    allowNull: true // Make optional for registration payments
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true // Make optional for registration payments
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: true // Make optional for booking payments
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
    type: DataTypes.ENUM('pending', 'successful', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  reference: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  paymentMethod: {
    type: DataTypes.ENUM('paystack', 'flutterwave', 'stripe', 'manual'),
    allowNull: false,
    defaultValue: 'paystack'
  },
  customerEmail: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  paymentType: {
    type: DataTypes.ENUM('booking', 'registration', 'subscription', 'withdrawal'),
    allowNull: false,
    defaultValue: 'booking'
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
    { fields: ['status'] },
    { fields: ['reference'] },
    { fields: ['paymentType'] },
    { fields: ['customerEmail'] }
  ]
});

export default Payment;











