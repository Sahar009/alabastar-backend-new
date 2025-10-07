import notificationService from '../services/notificationService.js';

/**
 * Notification Helper Utilities
 * Provides convenient methods for creating common notification types
 */

class NotificationHelper {
  /**
   * Send booking created notification to provider
   */
  static async notifyBookingCreated(booking, provider, customer, service) {
    return await notificationService.createNotification({
      userId: provider.userId,
      title: 'New Booking Request',
      body: `${customer.fullName} has requested ${service.title} on ${new Date(booking.scheduledAt).toLocaleDateString()}`,
      type: 'booking_created',
      category: 'booking',
      priority: 'high',
      channels: ['in_app', 'email', 'push'],
      actionUrl: `/provider/bookings/${booking.id}`,
      meta: {
        bookingId: booking.id,
        customerId: customer.id,
        serviceId: service.id,
        scheduledAt: booking.scheduledAt
      }
    });
  }

  /**
   * Send booking confirmation to customer
   */
  static async notifyBookingConfirmed(booking, customer, provider, service) {
    return await notificationService.createNotification({
      userId: customer.id,
      title: 'Booking Confirmed',
      body: `Your booking for ${service.title} has been confirmed by ${provider.businessName || provider.User?.fullName}`,
      type: 'booking_confirmed',
      category: 'booking',
      priority: 'high',
      channels: ['in_app', 'email', 'push', 'sms'],
      actionUrl: `/bookings/${booking.id}`,
      meta: {
        bookingId: booking.id,
        providerId: provider.id,
        serviceId: service.id
      }
    });
  }

  /**
   * Send booking cancellation notification
   */
  static async notifyBookingCancelled(booking, recipientUserId, reason = '') {
    return await notificationService.createNotification({
      userId: recipientUserId,
      title: 'Booking Cancelled',
      body: `Booking for ${booking.service?.title || 'service'} has been cancelled. ${reason}`,
      type: 'booking_cancelled',
      category: 'booking',
      priority: 'high',
      channels: ['in_app', 'email', 'push', 'sms'],
      actionUrl: `/bookings/${booking.id}`,
      meta: {
        bookingId: booking.id,
        reason
      }
    });
  }

  /**
   * Send booking completion notification
   */
  static async notifyBookingCompleted(booking, customer, provider, service) {
    return await notificationService.createNotification({
      userId: customer.id,
      title: 'Booking Completed',
      body: `Your booking for ${service.title} has been completed. Please leave a review!`,
      type: 'booking_completed',
      category: 'booking',
      priority: 'normal',
      channels: ['in_app', 'email', 'push'],
      actionUrl: `/bookings/${booking.id}/review`,
      meta: {
        bookingId: booking.id,
        providerId: provider.id,
        serviceId: service.id
      }
    });
  }

  /**
   * Send booking reminder notification
   */
  static async notifyBookingReminder(booking, userId, hoursUntil = 24) {
    return await notificationService.createNotification({
      userId,
      title: 'Booking Reminder',
      body: `Reminder: Your booking for ${booking.service?.title} is in ${hoursUntil} hours`,
      type: 'booking_reminder',
      category: 'booking',
      priority: 'normal',
      channels: ['in_app', 'push', 'sms'],
      actionUrl: `/bookings/${booking.id}`,
      expiresAt: new Date(booking.scheduledAt),
      meta: {
        bookingId: booking.id,
        hoursUntil
      }
    });
  }

  /**
   * Send payment received notification
   */
  static async notifyPaymentReceived(payment, userId, amount, bookingId = null) {
    return await notificationService.createNotification({
      userId,
      title: 'Payment Received',
      body: `Payment of ₦${amount.toLocaleString()} has been received successfully`,
      type: 'payment_received',
      category: 'transaction',
      priority: 'high',
      channels: ['in_app', 'email'],
      actionUrl: bookingId ? `/bookings/${bookingId}` : '/wallet',
      meta: {
        paymentId: payment.id,
        amount,
        bookingId
      }
    });
  }

  /**
   * Send payment failed notification
   */
  static async notifyPaymentFailed(userId, amount, reason = '', bookingId = null) {
    return await notificationService.createNotification({
      userId,
      title: 'Payment Failed',
      body: `Your payment of ₦${amount.toLocaleString()} failed. ${reason}`,
      type: 'payment_failed',
      category: 'transaction',
      priority: 'urgent',
      channels: ['in_app', 'email', 'push'],
      actionUrl: bookingId ? `/bookings/${bookingId}/payment` : '/wallet',
      meta: {
        amount,
        reason,
        bookingId
      }
    });
  }

  /**
   * Send new review notification
   */
  static async notifyReviewReceived(providerId, customerName, rating, comment = '') {
    return await notificationService.createNotification({
      userId: providerId,
      title: 'New Review Received',
      body: `${customerName} left you a ${rating}-star review${comment ? ': "' + comment.substring(0, 50) + (comment.length > 50 ? '..."' : '"') : ''}`,
      type: 'review_received',
      category: 'account',
      priority: 'normal',
      channels: ['in_app', 'email'],
      actionUrl: '/provider/reviews',
      meta: {
        rating,
        customerName,
        comment: comment ? comment.substring(0, 100) : null
      }
    });
  }

  /**
   * Send new message notification
   */
  static async notifyNewMessage(message, recipientId, senderName, threadId) {
    return await notificationService.createNotification({
      userId: recipientId,
      title: 'New Message',
      body: `${senderName}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
      type: 'message_received',
      category: 'message',
      priority: 'normal',
      channels: ['in_app', 'push'],
      actionUrl: `/messages/${threadId}`,
      meta: {
        messageId: message.id,
        threadId,
        senderId: message.senderId
      }
    });
  }

  /**
   * Send account verification notification
   */
  static async notifyAccountVerified(userId) {
    return await notificationService.createNotification({
      userId,
      title: 'Account Verified',
      body: 'Your account has been successfully verified!',
      type: 'account_update',
      category: 'account',
      priority: 'normal',
      channels: ['in_app', 'email'],
      actionUrl: '/profile'
    });
  }

  /**
   * Send promotional notification
   */
  static async notifyPromotion(userId, title, message, imageUrl = null, expiresIn = null) {
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : null;

    return await notificationService.createNotification({
      userId,
      title,
      body: message,
      type: 'promotion',
      category: 'marketing',
      priority: 'low',
      channels: ['in_app', 'email'],
      imageUrl,
      expiresAt,
      actionUrl: '/promotions'
    });
  }

  /**
   * Send system alert to all users
   */
  static async notifySystemAlert(userIds, title, message, priority = 'normal') {
    return await notificationService.createBulkNotification(userIds, {
      title,
      body: message,
      type: 'system_alert',
      category: 'system',
      priority,
      channels: ['in_app', 'email'],
      sendImmediately: true
    });
  }

  /**
   * Send welcome notification to new user
   */
  static async notifyWelcome(userId, userName, role = 'customer') {
    const message = role === 'provider' 
      ? 'Welcome to Alabastar! Start by setting up your profile and services.'
      : 'Welcome to Alabastar! Find and book trusted service providers near you.';

    return await notificationService.createNotification({
      userId,
      title: `Welcome to Alabastar, ${userName}!`,
      body: message,
      type: 'account_update',
      category: 'account',
      priority: 'normal',
      channels: ['in_app', 'email'],
      actionUrl: role === 'provider' ? '/provider/setup' : '/explore'
    });
  }

  /**
   * Send provider approval notification
   */
  static async notifyProviderApproved(userId, providerName) {
    return await notificationService.createNotification({
      userId,
      title: 'Provider Account Approved',
      body: `Congratulations ${providerName}! Your provider account has been approved. You can now start receiving bookings.`,
      type: 'account_update',
      category: 'account',
      priority: 'high',
      channels: ['in_app', 'email', 'push'],
      actionUrl: '/provider/dashboard'
    });
  }

  /**
   * Send provider rejection notification
   */
  static async notifyProviderRejected(userId, reason = '') {
    return await notificationService.createNotification({
      userId,
      title: 'Provider Application Update',
      body: `Your provider application requires additional information. ${reason}`,
      type: 'account_update',
      category: 'account',
      priority: 'high',
      channels: ['in_app', 'email'],
      actionUrl: '/provider/application'
    });
  }

  /**
   * Send withdrawal processed notification
   */
  static async notifyWithdrawalProcessed(userId, amount, accountNumber) {
    return await notificationService.createNotification({
      userId,
      title: 'Withdrawal Processed',
      body: `Your withdrawal of ₦${amount.toLocaleString()} to account ${accountNumber} has been processed successfully`,
      type: 'payment_received',
      category: 'transaction',
      priority: 'high',
      channels: ['in_app', 'email', 'sms'],
      actionUrl: '/wallet/transactions'
    });
  }

  /**
   * Send support ticket response notification
   */
  static async notifySupportResponse(userId, ticketId, title) {
    return await notificationService.createNotification({
      userId,
      title: 'Support Ticket Update',
      body: `You have a new response on your support ticket: ${title}`,
      type: 'general',
      category: 'system',
      priority: 'normal',
      channels: ['in_app', 'email'],
      actionUrl: `/support/tickets/${ticketId}`
    });
  }
}

export default NotificationHelper;

