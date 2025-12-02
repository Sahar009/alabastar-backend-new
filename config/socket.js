import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

let io = null;

// Store active user connections (userId -> socketId[])
const activeUsers = new Map();

// Store socket to user mapping
const socketToUser = new Map();

/**
 * Initialize Socket.io server
 * @param {Object} server - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Use the same JWT secret as the auth service
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, jwtSecret);
      
      // JWT payload uses 'userId', but support both 'userId' and 'id' for compatibility
      socket.userId = decoded.userId || decoded.id;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`✅ User ${userId} connected with socket ${socket.id}`);

    // Add user to active users
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId).add(socket.id);
    socketToUser.set(socket.id, userId);

    // Emit user online status
    socket.broadcast.emit('user:online', { userId });

    // Handle user joining their personal room
    socket.join(`user:${userId}`);

    // Handle joining conversation rooms
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Handle typing indicator
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        userId,
        conversationId
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        userId,
        conversationId
      });
    });

    // Handle message read receipts
    socket.on('message:read', ({ messageId, conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('message:read', {
        messageId,
        userId,
        conversationId,
        readAt: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ User ${userId} disconnected from socket ${socket.id}`);
      
      // Remove socket from active users
      if (activeUsers.has(userId)) {
        activeUsers.get(userId).delete(socket.id);
        
        // If user has no more active connections, remove from map and broadcast offline
        if (activeUsers.get(userId).size === 0) {
          activeUsers.delete(userId);
          socket.broadcast.emit('user:offline', { userId });
        }
      }
      
      socketToUser.delete(socket.id);
    });
  });

  console.log('🔌 Socket.io initialized successfully');
  return io;
};

/**
 * Get Socket.io server instance
 * @returns {Server|null}
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

/**
 * Emit event to specific user(s)
 * @param {number|number[]} userIds - User ID or array of user IDs
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
export const emitToUser = (userIds, event, data) => {
  if (!io) return;

  const users = Array.isArray(userIds) ? userIds : [userIds];
  users.forEach(userId => {
    io.to(`user:${userId}`).emit(event, data);
  });
};

/**
 * Emit event to all users in a conversation
 * @param {number} conversationId - Conversation ID
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
export const emitToConversation = (conversationId, event, data) => {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit(event, data);
};

/**
 * Check if user is online
 * @param {number} userId - User ID
 * @returns {boolean}
 */
export const isUserOnline = (userId) => {
  return activeUsers.has(userId);
};

/**
 * Get all online users
 * @returns {number[]} Array of online user IDs
 */
export const getOnlineUsers = () => {
  return Array.from(activeUsers.keys());
};

/**
 * Get count of user's active connections
 * @param {number} userId - User ID
 * @returns {number}
 */
export const getUserConnectionCount = (userId) => {
  return activeUsers.has(userId) ? activeUsers.get(userId).size : 0;
};

export default {
  initializeSocket,
  getIO,
  emitToUser,
  emitToConversation,
  isUserOnline,
  getOnlineUsers,
  getUserConnectionCount
};



