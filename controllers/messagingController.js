import messagingService from '../services/messagingService.js';
import { isUserOnline, getOnlineUsers } from '../config/socket.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

class MessagingController {
  /**
   * Get message type from MIME type
   */
  static getMessageTypeFromMimeType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'file';
    if (mimeType.includes('document') || mimeType.includes('text')) return 'file';
    return 'file'; // Default to file for other types
  }

  /**
   * Create or get direct conversation
   * POST /api/messages/conversations/direct
   */
  async createDirectConversation(req, res) {
    try {
      const currentUserId = req.user.id;
      const { recipientId } = req.body;

      if (!recipientId) {
        return res.status(400).json({
          success: false,
          message: 'Recipient ID is required'
        });
      }

      if (recipientId === currentUserId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create conversation with yourself'
        });
      }

      const conversation = await messagingService.createOrGetDirectConversation(
        currentUserId,
        recipientId
      );

      return res.status(200).json({
        success: true,
        message: 'Conversation retrieved successfully',
        data: conversation
      });
    } catch (error) {
      console.error('Error in createDirectConversation:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create conversation',
        error: error.message
      });
    }
  }

  /**
   * Create group conversation
   * POST /api/messages/conversations/group
   */
  async createGroupConversation(req, res) {
    try {
      const currentUserId = req.user.id;
      const { participantIds, title } = req.body;

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least 2 participants are required for a group'
        });
      }

      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Group title is required'
        });
      }

      const conversation = await messagingService.createGroupConversation(
        currentUserId,
        participantIds,
        title
      );

      return res.status(201).json({
        success: true,
        message: 'Group conversation created successfully',
        data: conversation
      });
    } catch (error) {
      console.error('Error in createGroupConversation:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create group conversation',
        error: error.message
      });
    }
  }

  /**
   * Get user's conversations
   * GET /api/messages/conversations
   */
  async getUserConversations(req, res) {
    try {
      const currentUserId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await messagingService.getUserConversations(
        currentUserId,
        page,
        limit
      );

      return res.status(200).json({
        success: true,
        message: 'Conversations retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get conversations',
        error: error.message
      });
    }
  }

  /**
   * Get conversation details
   * GET /api/messages/conversations/:conversationId
   */
  async getConversationDetails(req, res) {
    try {
      const currentUserId = req.user.id;
      const { conversationId } = req.params;

      const conversation = await messagingService.getConversationDetails(
        conversationId,
        currentUserId
      );

      return res.status(200).json({
        success: true,
        message: 'Conversation details retrieved successfully',
        data: conversation
      });
    } catch (error) {
      console.error('Error in getConversationDetails:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get conversation details',
        error: error.message
      });
    }
  }

  /**
   * Send message
   * POST /api/messages/conversations/:conversationId/messages
   */
  async sendMessage(req, res) {
    try {
      const currentUserId = req.user.id;
      const { conversationId } = req.params;
      const messageData = req.body;

      // Handle file upload if present
      if (req.file) {
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'alabastar/messages',
          resource_type: 'auto',
          mimeType: req.file.mimetype
        });
        
        if (uploadResult.success) {
          messageData.mediaUrl = uploadResult.data.secure_url;
          messageData.mediaType = req.file.mimetype;
          messageData.fileName = req.file.originalname;
          messageData.fileSize = req.file.size;
          messageData.messageType = MessagingController.getMessageTypeFromMimeType(req.file.mimetype);
        } else {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload file',
            error: uploadResult.error
          });
        }
      }

      const message = await messagingService.sendMessage(
        conversationId,
        currentUserId,
        messageData
      );

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: message
      });
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  }

  /**
   * Get conversation messages
   * GET /api/messages/conversations/:conversationId/messages
   */
  async getConversationMessages(req, res) {
    try {
      const currentUserId = req.user.id;
      const { conversationId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const result = await messagingService.getConversationMessages(
        conversationId,
        currentUserId,
        page,
        limit
      );

      return res.status(200).json({
        success: true,
        message: 'Messages retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get messages',
        error: error.message
      });
    }
  }

  /**
   * Mark messages as read
   * POST /api/messages/conversations/:conversationId/read
   */
  async markAsRead(req, res) {
    try {
      const currentUserId = req.user.id;
      const { conversationId } = req.params;
      const { messageIds } = req.body;

      await messagingService.markAsRead(conversationId, currentUserId, messageIds);

      return res.status(200).json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read',
        error: error.message
      });
    }
  }

  /**
   * Add reaction to message
   * POST /api/messages/:messageId/reactions
   */
  async addReaction(req, res) {
    try {
      const currentUserId = req.user.id;
      const { messageId } = req.params;
      const { emoji } = req.body;

      if (!emoji) {
        return res.status(400).json({
          success: false,
          message: 'Emoji is required'
        });
      }

      const reaction = await messagingService.addReaction(
        messageId,
        currentUserId,
        emoji
      );

      return res.status(201).json({
        success: true,
        message: 'Reaction added successfully',
        data: reaction
      });
    } catch (error) {
      console.error('Error in addReaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add reaction',
        error: error.message
      });
    }
  }

  /**
   * Remove reaction from message
   * DELETE /api/messages/reactions/:reactionId
   */
  async removeReaction(req, res) {
    try {
      const currentUserId = req.user.id;
      const { reactionId } = req.params;

      await messagingService.removeReaction(reactionId, currentUserId);

      return res.status(200).json({
        success: true,
        message: 'Reaction removed successfully'
      });
    } catch (error) {
      console.error('Error in removeReaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove reaction',
        error: error.message
      });
    }
  }

  /**
   * Delete message
   * DELETE /api/messages/:messageId
   */
  async deleteMessage(req, res) {
    try {
      const currentUserId = req.user.id;
      const { messageId } = req.params;

      await messagingService.deleteMessage(messageId, currentUserId);

      return res.status(200).json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete message',
        error: error.message
      });
    }
  }

  /**
   * Edit message
   * PUT /api/messages/:messageId
   */
  async editMessage(req, res) {
    try {
      const currentUserId = req.user.id;
      const { messageId } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Content is required'
        });
      }

      const message = await messagingService.editMessage(
        messageId,
        currentUserId,
        content
      );

      return res.status(200).json({
        success: true,
        message: 'Message edited successfully',
        data: message
      });
    } catch (error) {
      console.error('Error in editMessage:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to edit message',
        error: error.message
      });
    }
  }

  /**
   * Leave conversation
   * POST /api/messages/conversations/:conversationId/leave
   */
  async leaveConversation(req, res) {
    try {
      const currentUserId = req.user.id;
      const { conversationId } = req.params;

      await messagingService.leaveConversation(conversationId, currentUserId);

      return res.status(200).json({
        success: true,
        message: 'Left conversation successfully'
      });
    } catch (error) {
      console.error('Error in leaveConversation:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to leave conversation',
        error: error.message
      });
    }
  }

  /**
   * Mute/unmute conversation
   * PUT /api/messages/conversations/:conversationId/mute
   */
  async toggleMute(req, res) {
    try {
      const currentUserId = req.user.id;
      const { conversationId } = req.params;
      const { isMuted } = req.body;

      await messagingService.toggleMute(conversationId, currentUserId, isMuted);

      return res.status(200).json({
        success: true,
        message: `Conversation ${isMuted ? 'muted' : 'unmuted'} successfully`,
        data: { isMuted }
      });
    } catch (error) {
      console.error('Error in toggleMute:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to toggle mute',
        error: error.message
      });
    }
  }

  /**
   * Get online users
   * GET /api/messages/online-users
   */
  async getOnlineUsers(req, res) {
    try {
      const onlineUsers = getOnlineUsers();

      return res.status(200).json({
        success: true,
        message: 'Online users retrieved successfully',
        data: { onlineUsers }
      });
    } catch (error) {
      console.error('Error in getOnlineUsers:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get online users',
        error: error.message
      });
    }
  }

  /**
   * Check if user is online
   * GET /api/messages/users/:userId/online
   */
  async checkUserOnline(req, res) {
    try {
      const { userId } = req.params;
      const isOnline = isUserOnline(parseInt(userId));

      return res.status(200).json({
        success: true,
        data: { 
          userId: parseInt(userId),
          isOnline 
        }
      });
    } catch (error) {
      console.error('Error in checkUserOnline:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check user status',
        error: error.message
      });
    }
  }

  // Helper method to determine message type from MIME type
  getMessageTypeFromMimeType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  }
}

export default new MessagingController();

