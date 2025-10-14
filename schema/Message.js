import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Message = sequelize.define('Message', {
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
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sender_id'
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file', 'audio', 'video', 'location', 'system'),
    defaultValue: 'text',
    allowNull: false,
    field: 'message_type',
    comment: 'Type of message content'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Text content of the message'
  },
  mediaUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'media_url',
    comment: 'URL for media files (images, videos, files, etc.)'
  },
  mediaType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'media_type',
    comment: 'MIME type of media file'
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'file_name',
    comment: 'Original filename for file uploads'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_size',
    comment: 'Size of uploaded file in bytes'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata (location coordinates, reply info, etc.)'
  },
  replyToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reply_to_id',
    comment: 'ID of message being replied to'
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'is_edited',
    comment: 'Whether message has been edited'
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'edited_at',
    comment: 'When message was last edited'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'is_deleted',
    comment: 'Soft delete flag'
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at',
    comment: 'When message was deleted'
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
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['conversation_id', 'created_at'] },
    { fields: ['sender_id'] },
    { fields: ['reply_to_id'] },
    { fields: ['is_deleted'] }
  ]
});

export default Message;

