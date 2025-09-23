import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('requested', 'accepted', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'requested'
  },
  locationAddress: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  locationCity: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  locationState: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10,8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11,8),
    allowNull: true
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'NGN'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  escrowStatus: {
    type: DataTypes.ENUM('held', 'released', 'disputed'),
    allowNull: false,
    defaultValue: 'held'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'bookings',
  indexes: [
    { fields: ['userId'] },
    { fields: ['providerId'] },
    { fields: ['serviceId'] },
    { fields: ['status'] },
    { fields: ['paymentStatus'] }
  ]
});

export default Booking;









