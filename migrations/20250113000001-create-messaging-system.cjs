'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create conversations table
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('direct', 'group'),
        defaultValue: 'direct',
        allowNull: false,
        comment: 'Type of conversation - direct (1-on-1) or group'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Title for group conversations'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who created the conversation (for groups)'
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp of last message in conversation'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add index for faster queries
    await queryInterface.addIndex('conversations', ['last_message_at']);
    await queryInterface.addIndex('conversations', ['created_by']);

    // Create conversation_participants table (many-to-many between users and conversations)
    await queryInterface.createTable('conversation_participants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      conversation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.ENUM('member', 'admin'),
        defaultValue: 'member',
        allowNull: false,
        comment: 'Role in the conversation (for group chats)'
      },
      is_muted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether user has muted this conversation'
      },
      last_read_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last time user read messages in this conversation'
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      left_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When user left the conversation (for groups)'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint to prevent duplicate participants
    await queryInterface.addConstraint('conversation_participants', {
      fields: ['conversation_id', 'user_id'],
      type: 'unique',
      name: 'unique_conversation_participant'
    });

    // Add indexes for faster queries
    await queryInterface.addIndex('conversation_participants', ['conversation_id']);
    await queryInterface.addIndex('conversation_participants', ['user_id']);
    await queryInterface.addIndex('conversation_participants', ['last_read_at']);

    // Create messages table
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      conversation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      message_type: {
        type: Sequelize.ENUM('text', 'image', 'file', 'audio', 'video', 'location', 'system'),
        defaultValue: 'text',
        allowNull: false,
        comment: 'Type of message content'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Text content of the message'
      },
      media_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL for media files (images, videos, files, etc.)'
      },
      media_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'MIME type of media file'
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Original filename for file uploads'
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Size of uploaded file in bytes'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional metadata (location coordinates, reply info, etc.)'
      },
      reply_to_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'ID of message being replied to'
      },
      is_edited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether message has been edited'
      },
      edited_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When message was last edited'
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Soft delete flag'
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When message was deleted'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for faster queries
    await queryInterface.addIndex('messages', ['conversation_id', 'created_at']);
    await queryInterface.addIndex('messages', ['sender_id']);
    await queryInterface.addIndex('messages', ['reply_to_id']);
    await queryInterface.addIndex('messages', ['is_deleted']);

    // Create message_read_receipts table
    await queryInterface.createTable('message_read_receipts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      message_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint to prevent duplicate read receipts
    await queryInterface.addConstraint('message_read_receipts', {
      fields: ['message_id', 'user_id'],
      type: 'unique',
      name: 'unique_message_read_receipt'
    });

    // Add indexes
    await queryInterface.addIndex('message_read_receipts', ['message_id']);
    await queryInterface.addIndex('message_read_receipts', ['user_id']);

    // Create message_reactions table (for emoji reactions)
    await queryInterface.createTable('message_reactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      message_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      emoji: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Emoji reaction'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint - user can only react with same emoji once per message
    await queryInterface.addConstraint('message_reactions', {
      fields: ['message_id', 'user_id', 'emoji'],
      type: 'unique',
      name: 'unique_message_reaction'
    });

    // Add indexes
    await queryInterface.addIndex('message_reactions', ['message_id']);
    await queryInterface.addIndex('message_reactions', ['user_id']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('message_reactions');
    await queryInterface.dropTable('message_read_receipts');
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('conversation_participants');
    await queryInterface.dropTable('conversations');
  }
};

