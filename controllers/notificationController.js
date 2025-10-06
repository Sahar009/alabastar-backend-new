import notificationService from '../services/notificationService.js';
import { 
  SUCCESS, 
  CREATED, 
  BAD_REQUEST, 
  NOT_FOUND, 
  FORBIDDEN, 
  INTERNAL_SERVER_ERROR 
} from '../constants/statusCode.js';

class NotificationController {
  /**
   * Get user's notifications
   * GET /api/notifications
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { page, limit, isRead, category, type } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        isRead: isRead !== undefined ? isRead === 'true' : null,
        category,
        type
      };

      const result = await notificationService.getUserNotifications(userId, options);

      if (!result.success) {
        return res.status(INTERNAL_SERVER_ERROR).json({
          success: false,
          message: result.message
        });
      }

      return res.status(SUCCESS).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to retrieve notifications',
        error: error.message
      });
    }
  }

  /**
   * Get unread notifications count
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const result = await notificationService.getUnreadCount(userId);

      return res.status(SUCCESS).json({
        success: true,
        count: result.count
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message
      });
    }
  }

  /**
   * Mark notification as read
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await notificationService.markAsRead(id, userId);

      if (!result.success) {
        return res.status(NOT_FOUND).json({
          success: false,
          message: result.message
        });
      }

      return res.status(SUCCESS).json({
        success: true,
        message: 'Notification marked as read',
        data: result.data
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/mark-all-read
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const result = await notificationService.markAllAsRead(userId);

      return res.status(SUCCESS).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to mark all as read',
        error: error.message
      });
    }
  }

  /**
   * Delete notification
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await notificationService.deleteNotification(id, userId);

      if (!result.success) {
        return res.status(NOT_FOUND).json({
          success: false,
          message: result.message
        });
      }

      return res.status(SUCCESS).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  }

  /**
   * Get user's notification preferences
   * GET /api/notifications/preferences
   */
  async getPreferences(req, res) {
    try {
      const userId = req.user.id;
      const preferences = await notificationService.getUserPreferences(userId);

      return res.status(SUCCESS).json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Error getting preferences:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to get preferences',
        error: error.message
      });
    }
  }

  /**
   * Update notification preferences
   * PUT /api/notifications/preferences
   */
  async updatePreferences(req, res) {
    try {
      const userId = req.user.id;
      const preferences = req.body;

      const result = await notificationService.updatePreferences(userId, preferences);

      if (!result.success) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: result.message
        });
      }

      return res.status(SUCCESS).json({
        success: true,
        message: 'Preferences updated successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to update preferences',
        error: error.message
      });
    }
  }

  /**
   * Register device token for push notifications
   * POST /api/notifications/device-token
   */
  async registerDeviceToken(req, res) {
    try {
      const userId = req.user.id;
      const { token, platform, deviceId, deviceName, appVersion, osVersion } = req.body;

      // Validation
      if (!token || !platform || !deviceId) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: 'Token, platform, and deviceId are required'
        });
      }

      const result = await notificationService.registerDeviceToken(userId, {
        token,
        platform,
        deviceId,
        deviceName,
        appVersion,
        osVersion
      });

      if (!result.success) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: result.message
        });
      }

      return res.status(CREATED).json({
        success: true,
        message: 'Device token registered successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Error registering device token:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to register device token',
        error: error.message
      });
    }
  }

  /**
   * Unregister device token
   * DELETE /api/notifications/device-token/:deviceId
   */
  async unregisterDeviceToken(req, res) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;

      const result = await notificationService.unregisterDeviceToken(userId, deviceId);

      return res.status(SUCCESS).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error unregistering device token:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to unregister device token',
        error: error.message
      });
    }
  }

  /**
   * Create notification (Admin only)
   * POST /api/notifications/create
   */
  async createNotification(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(FORBIDDEN).json({
          success: false,
          message: 'Only admins can create notifications'
        });
      }

      const notificationData = req.body;
      const result = await notificationService.createNotification(notificationData);

      if (!result.success) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: result.message
        });
      }

      return res.status(CREATED).json({
        success: true,
        message: 'Notification created successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create notification',
        error: error.message
      });
    }
  }

  /**
   * Send bulk notifications (Admin only)
   * POST /api/notifications/bulk
   */
  async createBulkNotification(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(FORBIDDEN).json({
          success: false,
          message: 'Only admins can send bulk notifications'
        });
      }

      const { userIds, ...notificationData } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: 'userIds array is required'
        });
      }

      const result = await notificationService.createBulkNotification(
        userIds,
        notificationData
      );

      if (!result.success) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: result.message
        });
      }

      return res.status(CREATED).json({
        success: true,
        message: result.message,
        count: result.count
      });
    } catch (error) {
      console.error('Error creating bulk notification:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create bulk notification',
        error: error.message
      });
    }
  }

  /**
   * Test notification (for development)
   * POST /api/notifications/test
   */
  async sendTestNotification(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationService.createNotification({
        userId,
        title: 'Test Notification',
        body: 'This is a test notification from Alabastar',
        type: 'general',
        category: 'system',
        priority: 'normal',
        channels: ['in_app', 'email', 'push'],
        sendImmediately: true
      });

      return res.status(SUCCESS).json({
        success: true,
        message: 'Test notification sent',
        data: result.data
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send test notification',
        error: error.message
      });
    }
  }
}

export default new NotificationController();

