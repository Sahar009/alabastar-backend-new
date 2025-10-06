import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(
      'booking_created',
      'booking_confirmed', 
      'booking_cancelled',
      'booking_completed',
      'booking_reminder',
      'payment_received',
      'payment_failed',
      'review_received',
      'message_received',
      'account_update',
      'promotion',
      'system_alert',
      'general'
    ),
    allowNull: false,
    defaultValue: 'general'
  },
  category: {
    type: DataTypes.ENUM('transaction', 'booking', 'message', 'account', 'marketing', 'system'),
    allowNull: false,
    defaultValue: 'system'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'normal'
  },
  channels: {
    type: DataTypes.JSON, // ['in_app', 'email', 'push', 'sms']
    allowNull: false,
    defaultValue: ['in_app']
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveryStatus: {
    type: DataTypes.JSON, // { in_app: 'delivered', email: 'sent', push: 'failed', sms: 'pending' }
    allowNull: true
  },
  actionUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL or deep link for notification action'
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Optional image for rich notifications'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Optional expiration date for time-sensitive notifications'
  },
  meta: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata (bookingId, amount, etc.)'
  },
  pushSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emailSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  smsSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'notifications',
  indexes: [
    { fields: ['userId'] },
    { fields: ['isRead'] },
    { fields: ['type'] },
    { fields: ['category'] },
    { fields: ['priority'] },
    { fields: ['createdAt'] },
    { fields: ['expiresAt'] }
  ]
});

export default Notification;



























