import Notification from '../schema/Notification.js';
import NotificationPreference from '../schema/NotificationPreference.js';
import DeviceToken from '../schema/DeviceToken.js';
import User from '../schema/User.js';
import { sendEmail } from '../modules/notifications/email.js';
import { Op } from 'sequelize';

class NotificationService {
  /**
   * Create and send a notification to a user
   * @param {Object} notificationData - Notification details
   * @returns {Object} - Created notification
   */
  async createNotification({
    userId,
    title,
    body,
    type = 'general',
    category = 'system',
    priority = 'normal',
    channels = ['in_app'],
    actionUrl = null,
    imageUrl = null,
    expiresAt = null,
    meta = null,
    sendImmediately = true
  }) {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);
      
      // Filter channels based on user preferences
      const allowedChannels = await this.filterChannelsByPreferences(
        channels,
        category,
        preferences
      );

      // Create notification record
      const notification = await Notification.create({
        userId,
        title,
        body,
        type,
        category,
        priority,
        channels: allowedChannels,
        actionUrl,
        imageUrl,
        expiresAt,
        meta,
        deliveryStatus: {}
      });

      // Send notification through allowed channels
      if (sendImmediately && allowedChannels.length > 0) {
        await this.sendNotification(notification.id);
      }

      return {
        success: true,
        data: notification,
        message: 'Notification created successfully'
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        message: 'Failed to create notification',
        error: error.message
      };
    }
  }

  /**
   * Send a notification through all configured channels
   * @param {string} notificationId - Notification ID
   */
  async sendNotification(notificationId) {
    try {
      const notification = await Notification.findByPk(notificationId, {
        include: [{ model: User, attributes: ['email', 'phone', 'fullName'] }]
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      const { channels } = notification;
      const deliveryStatus = {};

      // Send through each channel
      const promises = channels.map(async (channel) => {
        try {
          switch (channel) {
            case 'in_app':
              deliveryStatus.in_app = 'delivered';
              break;

            case 'email':
              if (notification.User?.email) {
                await this.sendEmailNotification(notification);
                deliveryStatus.email = 'sent';
                await notification.update({ emailSentAt: new Date() });
              } else {
                deliveryStatus.email = 'failed_no_email';
              }
              break;

            case 'push':
              const pushResult = await this.sendPushNotification(notification);
              deliveryStatus.push = pushResult.success ? 'sent' : 'failed';
              if (pushResult.success) {
                await notification.update({ pushSentAt: new Date() });
              }
              break;

            case 'sms':
              if (notification.User?.phone) {
                await this.sendSMSNotification(notification);
                deliveryStatus.sms = 'sent';
                await notification.update({ smsSentAt: new Date() });
              } else {
                deliveryStatus.sms = 'failed_no_phone';
              }
              break;

            default:
              console.warn(`Unknown channel: ${channel}`);
          }
        } catch (error) {
          console.error(`Failed to send ${channel} notification:`, error);
          deliveryStatus[channel] = 'failed';
        }
      });

      await Promise.allSettled(promises);

      // Update delivery status
      await notification.update({ deliveryStatus });

      return { success: true, deliveryStatus };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(notification) {
    const emailSubject = notification.title;
    const emailBody = notification.body;

    await sendEmail(
      notification.User.email,
      emailSubject,
      emailBody,
      'plain',
      {
        title: notification.title,
        body: notification.body,
        actionUrl: notification.actionUrl,
        userName: notification.User.fullName
      }
    );
  }

  /**
   * Send push notification (FCM)
   * This is a placeholder - actual implementation depends on Firebase setup
   */
  async sendPushNotification(notification) {
    try {
      // Get user's device tokens
      const deviceTokens = await DeviceToken.findAll({
        where: {
          userId: notification.userId,
          isActive: true
        }
      });

      if (deviceTokens.length === 0) {
        return { success: false, reason: 'no_devices' };
      }

      // TODO: Implement FCM push notification
      // This is where you'd integrate with Firebase Cloud Messaging
      // For now, we'll just log and mark as ready for implementation
      console.log(`[Push Notification Ready] Would send to ${deviceTokens.length} devices:`, {
        title: notification.title,
        body: notification.body,
        data: {
          notificationId: notification.id,
          type: notification.type,
          actionUrl: notification.actionUrl,
          ...notification.meta
        }
      });

      /* Example FCM implementation (commented out for now):
      const admin = require('firebase-admin');
      const tokens = deviceTokens.map(dt => dt.token);
      
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: {
          notificationId: notification.id,
          type: notification.type,
          actionUrl: notification.actionUrl || '',
          ...notification.meta
        },
        tokens: tokens
      };

      const response = await admin.messaging().sendMulticast(message);
      return { success: true, response };
      */

      // For now, return success to indicate readiness
      return { success: true, deviceCount: deviceTokens.length };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS notification
   * This is a placeholder - actual implementation depends on SMS provider
   */
  async sendSMSNotification(notification) {
    // TODO: Implement SMS sending (Twilio, etc.)
    console.log(`[SMS Ready] Would send to ${notification.User.phone}:`, {
      body: `${notification.title}: ${notification.body}`
    });

    /* Example Twilio implementation (commented out for now):
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: `${notification.title}: ${notification.body}`,
      to: notification.User.phone,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    */
  }

  /**
   * Get user's notification preferences
   */
  async getUserPreferences(userId) {
    let preferences = await NotificationPreference.findOne({
      where: { userId }
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await NotificationPreference.create({ userId });
    }

    return preferences;
  }

  /**
   * Filter channels based on user preferences
   */
  async filterChannelsByPreferences(channels, category, preferences) {
    const filtered = [];

    for (const channel of channels) {
      // Check global channel preference
      let isEnabled = false;
      
      switch (channel) {
        case 'email':
          isEnabled = preferences.emailEnabled;
          break;
        case 'push':
          isEnabled = preferences.pushEnabled;
          break;
        case 'sms':
          isEnabled = preferences.smsEnabled;
          break;
        case 'in_app':
          isEnabled = preferences.inAppEnabled;
          break;
        default:
          isEnabled = true;
      }

      if (!isEnabled) continue;

      // Check category-specific preference
      const categoryPrefKey = `${category}Notifications`;
      const categoryPrefs = preferences[categoryPrefKey];
      
      if (categoryPrefs) {
        const channelKey = channel === 'in_app' ? 'inApp' : channel;
        if (categoryPrefs[channelKey]) {
          filtered.push(channel);
        }
      } else {
        filtered.push(channel);
      }
    }

    return filtered;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      isRead = null,
      category = null,
      type = null
    } = options;

    const where = { userId };
    
    if (isRead !== null) {
      where.isRead = isRead;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (type) {
      where.type = type;
    }

    // Filter out expired notifications
    where[Op.or] = [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } }
    ];

    const notifications = await Notification.findAndCountAll({
      where,
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit,
      offset: (page - 1) * limit
    });

    return {
      success: true,
      data: notifications.rows,
      pagination: {
        total: notifications.count,
        page,
        limit,
        totalPages: Math.ceil(notifications.count / limit)
      }
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { id: notificationId, userId }
      });

      if (!notification) {
        return { success: false, message: 'Notification not found' };
      }

      await notification.update({
        isRead: true,
        readAt: new Date()
      });

      return { success: true, data: notification };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { userId, isRead: false } }
      );

      return { success: true, message: 'All notifications marked as read' };
    } catch (error) {
      console.error('Error marking all as read:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const deleted = await Notification.destroy({
        where: { id: notificationId, userId }
      });

      if (!deleted) {
        return { success: false, message: 'Notification not found' };
      }

      return { success: true, message: 'Notification deleted' };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: {
          userId,
          isRead: false,
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } }
          ]
        }
      });

      return { success: true, count };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId, preferences) {
    try {
      const [pref] = await NotificationPreference.findOrCreate({
        where: { userId }
      });

      await pref.update(preferences);

      return { success: true, data: pref };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(userId, tokenData) {
    try {
      const { token, platform, deviceId, deviceName, appVersion, osVersion } = tokenData;

      // Check if device already exists
      let deviceToken = await DeviceToken.findOne({
        where: { userId, deviceId }
      });

      if (deviceToken) {
        // Update existing token
        await deviceToken.update({
          token,
          platform,
          deviceName,
          appVersion,
          osVersion,
          isActive: true,
          lastUsedAt: new Date()
        });
      } else {
        // Create new device token
        deviceToken = await DeviceToken.create({
          userId,
          token,
          platform,
          deviceId,
          deviceName,
          appVersion,
          osVersion,
          lastUsedAt: new Date()
        });
      }

      return { success: true, data: deviceToken };
    } catch (error) {
      console.error('Error registering device token:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(userId, deviceId) {
    try {
      await DeviceToken.update(
        { isActive: false },
        { where: { userId, deviceId } }
      );

      return { success: true, message: 'Device unregistered' };
    } catch (error) {
      console.error('Error unregistering device:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Bulk notification creation (for system-wide announcements)
   */
  async createBulkNotification(userIds, notificationData) {
    try {
      const notifications = userIds.map(userId => ({
        ...notificationData,
        userId,
        deliveryStatus: {}
      }));

      const created = await Notification.bulkCreate(notifications);

      // Send notifications asynchronously
      if (notificationData.sendImmediately !== false) {
        created.forEach(notification => {
          this.sendNotification(notification.id).catch(err => {
            console.error(`Failed to send bulk notification ${notification.id}:`, err);
          });
        });
      }

      return {
        success: true,
        message: `Created ${created.length} notifications`,
        count: created.length
      };
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications() {
    try {
      const deleted = await Notification.destroy({
        where: {
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      });

      console.log(`Cleaned up ${deleted} expired notifications`);
      return { success: true, deleted };
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      return { success: false, message: error.message };
    }
  }
}

export default new NotificationService();






