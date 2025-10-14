import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const MessageReaction = sequelize.define('MessageReaction', {
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
  emoji: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Emoji reaction'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'message_reactions',
  timestamps: false,
  indexes: [
    { fields: ['message_id'] },
    { fields: ['user_id'] },
    {
      unique: true,
      fields: ['message_id', 'user_id', 'emoji'],
      name: 'unique_message_reaction'
    }
  ]
});

export default MessageReaction;

