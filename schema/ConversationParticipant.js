import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const ConversationParticipant = sequelize.define('ConversationParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'conversation_id'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  role: {
    type: DataTypes.ENUM('member', 'admin'),
    defaultValue: 'member',
    allowNull: false,
    comment: 'Role in the conversation (for group chats)'
  },
  isMuted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'is_muted',
    comment: 'Whether user has muted this conversation'
  },
  lastReadAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_read_at',
    comment: 'Last time user read messages in this conversation'
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'joined_at',
    defaultValue: DataTypes.NOW
  },
  leftAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'left_at',
    comment: 'When user left the conversation (for groups)'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'conversation_participants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['conversation_id'] },
    { fields: ['user_id'] },
    { fields: ['last_read_at'] },
    {
      unique: true,
      fields: ['conversation_id', 'user_id'],
      name: 'unique_conversation_participant'
    }
  ]
});

export default ConversationParticipant;

