import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const MessageReadReceipt = sequelize.define('MessageReadReceipt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  messageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'message_id'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'read_at',
    defaultValue: DataTypes.NOW
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'message_read_receipts',
  timestamps: false,
  indexes: [
    { fields: ['message_id'] },
    { fields: ['user_id'] },
    {
      unique: true,
      fields: ['message_id', 'user_id'],
      name: 'unique_message_read_receipt'
    }
  ]
});

export default MessageReadReceipt;

