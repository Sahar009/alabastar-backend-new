import express from 'express';
import messagingController from '../controllers/messagingController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { uploadMessageFile } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messaging
 *   description: Real-time messaging and conversation management
 */

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Get user's conversations
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/conversations', authenticateToken, messagingController.getUserConversations);

/**
 * @swagger
 * /api/messages/conversations/direct:
 *   post:
 *     summary: Create or get direct conversation
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *             properties:
 *               recipientId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Conversation retrieved/created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/conversations/direct', authenticateToken, messagingController.createDirectConversation);

/**
 * @swagger
 * /api/messages/conversations/group:
 *   post:
 *     summary: Create group conversation
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - participantIds
 *             properties:
 *               title:
 *                 type: string
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Group conversation created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/conversations/group', authenticateToken, messagingController.createGroupConversation);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}:
 *   get:
 *     summary: Get conversation details
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conversation details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.get('/conversations/:conversationId', authenticateToken, messagingController.getConversationDetails);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get conversation messages
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Send message
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 enum: [text, image, file, audio, video, location, system]
 *               replyToId:
 *                 type: integer
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/conversations/:conversationId/messages', authenticateToken, messagingController.getConversationMessages);
router.post('/conversations/:conversationId/messages', authenticateToken, uploadMessageFile, messagingController.sendMessage);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/read:
 *   post:
 *     summary: Mark messages as read
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Messages marked as read
 *       401:
 *         description: Unauthorized
 */
router.post('/conversations/:conversationId/read', authenticateToken, messagingController.markAsRead);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/leave:
 *   post:
 *     summary: Leave conversation (for group chats)
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Left conversation successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/conversations/:conversationId/leave', authenticateToken, messagingController.leaveConversation);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/mute:
 *   put:
 *     summary: Mute/unmute conversation
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isMuted
 *             properties:
 *               isMuted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Conversation muted/unmuted successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/conversations/:conversationId/mute', authenticateToken, messagingController.toggleMute);

/**
 * @swagger
 * /api/messages/{messageId}:
 *   put:
 *     summary: Edit message
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message edited successfully
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete message
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/:messageId', authenticateToken, messagingController.editMessage);
router.delete('/:messageId', authenticateToken, messagingController.deleteMessage);

/**
 * @swagger
 * /api/messages/{messageId}/reactions:
 *   post:
 *     summary: Add reaction to message
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reaction added successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/:messageId/reactions', authenticateToken, messagingController.addReaction);

/**
 * @swagger
 * /api/messages/reactions/{reactionId}:
 *   delete:
 *     summary: Remove reaction from message
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reactionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reaction removed successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/reactions/:reactionId', authenticateToken, messagingController.removeReaction);

/**
 * @swagger
 * /api/messages/online-users:
 *   get:
 *     summary: Get list of online users
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Online users retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/online-users', authenticateToken, messagingController.getOnlineUsers);

/**
 * @swagger
 * /api/messages/users/{userId}/online:
 *   get:
 *     summary: Check if user is online
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User online status retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/users/:userId/online', authenticateToken, messagingController.checkUserOnline);

export default router;

