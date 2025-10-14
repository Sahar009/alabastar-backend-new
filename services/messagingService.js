import { Op } from 'sequelize';
import sequelize from '../database/db.js';
import { 
  Conversation, 
  ConversationParticipant, 
  Message, 
  MessageReadReceipt, 
  MessageReaction,
  User,
  ProviderProfile
} from '../schema/index.js';
import { emitToConversation, emitToUser } from '../config/socket.js';

class MessagingService {
  /**
   * Create or get existing direct conversation between two users
   */
  async createOrGetDirectConversation(userId1, userId2) {
    try {
      // Find existing direct conversation between these users using raw SQL
      const existingConversation = await sequelize.query(`
        SELECT c.* FROM conversations c
        WHERE c.type = 'direct'
        AND c.id IN (
          SELECT cp1.conversation_id 
          FROM conversation_participants cp1
          INNER JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
          WHERE cp1.user_id = :userId1 AND cp1.left_at IS NULL
          AND cp2.user_id = :userId2 AND cp2.left_at IS NULL
          GROUP BY cp1.conversation_id
          HAVING COUNT(DISTINCT cp1.user_id) = 2
        )
        LIMIT 1
      `, {
        replacements: { userId1, userId2 },
        type: sequelize.QueryTypes.SELECT,
        model: Conversation,
        mapToModel: true
      });

      if (existingConversation && existingConversation.length > 0) {
        return await this.getConversationDetails(existingConversation[0].id, userId1);
      }

      // Create new conversation
      const conversation = await Conversation.create({
        type: 'direct',
        createdBy: userId1,
        lastMessageAt: new Date()
      });

      // Add participants
      await Promise.all([
        ConversationParticipant.create({
          conversationId: conversation.id,
          userId: userId1,
          role: 'member'
        }),
        ConversationParticipant.create({
          conversationId: conversation.id,
          userId: userId2,
          role: 'member'
        })
      ]);

      return await this.getConversationDetails(conversation.id, userId1);
    } catch (error) {
      console.error('Error creating/getting direct conversation:', error);
      throw error;
    }
  }

  /**
   * Create a group conversation
   */
  async createGroupConversation(creatorId, participantIds, title) {
    try {
      // Create conversation
      const conversation = await Conversation.create({
        type: 'group',
        title,
        createdBy: creatorId,
        lastMessageAt: new Date()
      });

      // Add creator as admin
      await ConversationParticipant.create({
        conversationId: conversation.id,
        userId: creatorId,
        role: 'admin'
      });

      // Add other participants as members
      const participantPromises = participantIds
        .filter(id => id !== creatorId)
        .map(userId => 
          ConversationParticipant.create({
            conversationId: conversation.id,
            userId,
            role: 'member'
          })
        );

      await Promise.all(participantPromises);

      // Emit to all participants
      emitToUser([creatorId, ...participantIds], 'conversation:created', {
        conversation: await this.getConversationDetails(conversation.id, creatorId)
      });

      return await this.getConversationDetails(conversation.id, creatorId);
    } catch (error) {
      console.error('Error creating group conversation:', error);
      throw error;
    }
  }

  /**
   * Get conversation details with participants
   */
  async getConversationDetails(conversationId, currentUserId) {
    try {
      const conversation = await Conversation.findByPk(conversationId, {
        include: [
          {
            model: User,
            as: 'participants',
            through: { 
              attributes: ['role', 'isMuted', 'lastReadAt', 'joinedAt', 'leftAt'],
              where: { leftAt: null }
            },
            attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl'],
            include: [{
              model: ProviderProfile,
              attributes: ['id', 'businessName'],
              required: false
            }]
          },
          {
            model: Message,
            as: 'messages',
            limit: 1,
            order: [['createdAt', 'DESC']],
            include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'fullName', 'avatarUrl']
          }]
        }
      ]
    });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Get unread count for current user
      const participant = await ConversationParticipant.findOne({
        where: {
          conversationId,
          userId: currentUserId
        }
      });

      const unreadCount = await Message.count({
        where: {
          conversationId,
          createdAt: {
            [Op.gt]: participant?.lastReadAt || new Date(0)
          },
          senderId: { [Op.ne]: currentUserId }
        }
      });

      return {
        ...conversation.toJSON(),
        unreadCount,
        currentUserRole: participant?.role
      };
    } catch (error) {
      console.error('Error getting conversation details:', error);
      throw error;
    }
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const conversations = await Conversation.findAndCountAll({
        include: [
          {
            model: ConversationParticipant,
            as: 'participantList',
            where: { 
              userId,
              leftAt: null 
            },
            required: true
          },
          {
            model: User,
            as: 'participants',
            through: { 
              attributes: ['role', 'isMuted', 'lastReadAt'],
              where: { leftAt: null }
            },
            attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl'],
            include: [{
              model: ProviderProfile,
              attributes: ['id', 'businessName'],
              required: false
            }]
          },
          {
            model: Message,
            as: 'messages',
            limit: 1,
            order: [['createdAt', 'DESC']],
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'fullName', 'avatarUrl']
            }]
          }
        ],
        order: [['lastMessageAt', 'DESC']],
        limit,
        offset,
        distinct: true
      });

      // Calculate unread counts
      const conversationsWithUnread = await Promise.all(
        conversations.rows.map(async (conv) => {
          const participant = conv.participantList[0];
          const unreadCount = await Message.count({
            where: {
              conversationId: conv.id,
              createdAt: {
                [Op.gt]: participant.lastReadAt || new Date(0)
              },
              senderId: { [Op.ne]: userId }
            }
          });

          return {
            ...conv.toJSON(),
            unreadCount,
            currentUserRole: participant.role
          };
        })
      );

      return {
        conversations: conversationsWithUnread,
        total: conversations.count,
        page,
        totalPages: Math.ceil(conversations.count / limit)
      };
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId, senderId, messageData) {
    try {
      // Verify sender is participant
      const participant = await ConversationParticipant.findOne({
        where: {
          conversationId,
          userId: senderId,
          leftAt: null
        }
      });

      if (!participant) {
        throw new Error('User is not a participant of this conversation');
      }

      // Create message
      const message = await Message.create({
        conversationId,
        senderId,
        messageType: messageData.messageType || 'text',
        content: messageData.content,
        mediaUrl: messageData.mediaUrl,
        mediaType: messageData.mediaType,
        fileName: messageData.fileName,
        fileSize: messageData.fileSize,
        metadata: messageData.metadata,
        replyToId: messageData.replyToId
      });

      // Update conversation's lastMessageAt
      await Conversation.update(
        { lastMessageAt: new Date() },
        { where: { id: conversationId } }
      );

      // Get full message details
      const fullMessage = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'fullName', 'avatarUrl']
          },
          {
            model: Message,
            as: 'replyTo',
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'fullName']
            }]
          }
        ]
      });

      // Emit to conversation participants via Socket.io
      emitToConversation(conversationId, 'message:new', {
        message: fullMessage
      });

      return fullMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get conversation messages with pagination
   */
  async getConversationMessages(conversationId, userId, page = 1, limit = 50) {
    try {
      // Verify user is participant
      const participant = await ConversationParticipant.findOne({
        where: {
          conversationId,
          userId,
          leftAt: null
        }
      });

      if (!participant) {
        throw new Error('User is not a participant of this conversation');
      }

      const offset = (page - 1) * limit;

      const messages = await Message.findAndCountAll({
        where: {
          conversationId,
          isDeleted: false
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'fullName', 'avatarUrl']
          },
          {
            model: Message,
            as: 'replyTo',
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'fullName']
            }]
          },
          {
            model: MessageReadReceipt,
            as: 'readReceipts',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'avatarUrl']
            }]
          },
          {
            model: MessageReaction,
            as: 'reactions',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'fullName']
            }]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        messages: messages.rows.reverse(), // Reverse to show oldest first
        total: messages.count,
        page,
        totalPages: Math.ceil(messages.count / limit)
      };
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId, userId, messageIds = null) {
    try {
      // Update participant's lastReadAt
      await ConversationParticipant.update(
        { lastReadAt: new Date() },
        {
          where: {
            conversationId,
            userId
          }
        }
      );

      // If specific message IDs provided, create read receipts
      if (messageIds && messageIds.length > 0) {
        const receipts = messageIds.map(messageId => ({
          messageId,
          userId,
          readAt: new Date()
        }));

        await MessageReadReceipt.bulkCreate(receipts, {
          ignoreDuplicates: true
        });

        // Emit read receipts
        emitToConversation(conversationId, 'messages:read', {
          userId,
          messageIds,
          readAt: new Date()
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId, userId, emoji) {
    try {
      const reaction = await MessageReaction.create({
        messageId,
        userId,
        emoji
      });

      const message = await Message.findByPk(messageId);
      
      // Emit reaction event
      emitToConversation(message.conversationId, 'reaction:added', {
        messageId,
        userId,
        emoji,
        reactionId: reaction.id
      });

      return reaction;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(reactionId, userId) {
    try {
      const reaction = await MessageReaction.findOne({
        where: { id: reactionId, userId },
        include: [{ model: Message, as: 'message' }]
      });

      if (!reaction) {
        throw new Error('Reaction not found');
      }

      const conversationId = reaction.message.conversationId;
      await reaction.destroy();

      // Emit reaction removed event
      emitToConversation(conversationId, 'reaction:removed', {
        reactionId,
        messageId: reaction.messageId,
        userId
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(messageId, userId) {
    try {
      const message = await Message.findOne({
        where: {
          id: messageId,
          senderId: userId
        }
      });

      if (!message) {
        throw new Error('Message not found or unauthorized');
      }

      await message.update({
        isDeleted: true,
        deletedAt: new Date()
      });

      // Emit message deleted event
      emitToConversation(message.conversationId, 'message:deleted', {
        messageId,
        conversationId: message.conversationId
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Edit message
   */
  async editMessage(messageId, userId, newContent) {
    try {
      const message = await Message.findOne({
        where: {
          id: messageId,
          senderId: userId,
          isDeleted: false
        }
      });

      if (!message) {
        throw new Error('Message not found or unauthorized');
      }

      await message.update({
        content: newContent,
        isEdited: true,
        editedAt: new Date()
      });

      const updatedMessage = await Message.findByPk(messageId, {
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'avatarUrl']
        }]
      });

      // Emit message edited event
      emitToConversation(message.conversationId, 'message:edited', {
        message: updatedMessage
      });

      return updatedMessage;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  /**
   * Leave conversation (for group chats)
   */
  async leaveConversation(conversationId, userId) {
    try {
      const participant = await ConversationParticipant.findOne({
        where: {
          conversationId,
          userId,
          leftAt: null
        }
      });

      if (!participant) {
        throw new Error('User is not a participant of this conversation');
      }

      await participant.update({ leftAt: new Date() });

      // Emit user left event
      emitToConversation(conversationId, 'user:left', {
        userId,
        conversationId
      });

      return { success: true };
    } catch (error) {
      console.error('Error leaving conversation:', error);
      throw error;
    }
  }

  /**
   * Mute/unmute conversation
   */
  async toggleMute(conversationId, userId, isMuted) {
    try {
      await ConversationParticipant.update(
        { isMuted },
        {
          where: {
            conversationId,
            userId
          }
        }
      );

      return { success: true, isMuted };
    } catch (error) {
      console.error('Error toggling mute:', error);
      throw error;
    }
  }
}

export default new MessagingService();

