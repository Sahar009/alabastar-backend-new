import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const ChatThread = sequelize.define('ChatThread', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'chat_threads',
  indexes: [
    { fields: ['bookingId'] },
    { fields: ['userId', 'providerId'] }
  ]
});

export default ChatThread;


