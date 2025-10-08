import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  threadId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file', 'system'),
    allowNull: false,
    defaultValue: 'text'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachmentUrl: {
    type: DataTypes.STRING(2048),
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'chat_messages',
  indexes: [
    { fields: ['threadId'] },
    { fields: ['senderId'] },
    { fields: ['isRead'] }
  ]
});

export default ChatMessage;
































