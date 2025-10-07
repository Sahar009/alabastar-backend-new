/**
 * Notification System Integration Examples
 * 
 * This file demonstrates how to integrate the notification system
 * into various parts of your application.
 */

import notificationService from '../services/notificationService.js';
import NotificationHelper from '../utils/notificationHelper.js';

// ============================================
// Example 1: Basic Notification Creation
// ============================================
async function basicNotificationExample(userId) {
  const result = await notificationService.createNotification({
    userId,
    title: 'Welcome!',
    body: 'Thanks for joining Alabastar',
    type: 'general',
    category: 'system',
    priority: 'normal',
    channels: ['in_app', 'email'],
    sendImmediately: true
  });

  console.log('Notification created:', result);
}

// ============================================
// Example 2: Using Helper Functions
// ============================================
async function helperFunctionExample(booking, customer, provider, service) {
  // Send booking created notification
  await NotificationHelper.notifyBookingCreated(
    booking,
    provider,
    customer,
    service
  );

  // Send booking confirmation
  await NotificationHelper.notifyBookingConfirmed(
    booking,
    customer,
    provider,
    service
  );
}

// ============================================
// Example 3: Integration in Booking Flow
// ============================================
async function bookingFlowExample() {
  // After booking is created
  const booking = { id: '123', scheduledAt: new Date(), userId: 'customer-id' };
  const customer = { id: 'customer-id', fullName: 'John Doe' };
  const provider = { userId: 'provider-id', businessName: 'ABC Services' };
  const service = { title: 'House Cleaning', id: 'service-id' };

  // Notify provider of new booking
  await NotificationHelper.notifyBookingCreated(
    booking,
    provider,
    customer,
    service
  );

  // After provider confirms booking
  await NotificationHelper.notifyBookingConfirmed(
    booking,
    customer,
    provider,
    service
  );

  // Set up reminder (24 hours before)
  const reminderTime = new Date(booking.scheduledAt);
  reminderTime.setHours(reminderTime.getHours() - 24);

  setTimeout(async () => {
    await NotificationHelper.notifyBookingReminder(
      booking,
      customer.id,
      24
    );
  }, reminderTime - Date.now());
}

// ============================================
// Example 4: Payment Notifications
// ============================================
async function paymentNotificationExample(payment, userId) {
  // Success notification
  await NotificationHelper.notifyPaymentReceived(
    payment,
    userId,
    payment.amount,
    payment.bookingId
  );

  // Or failure notification
  await NotificationHelper.notifyPaymentFailed(
    userId,
    payment.amount,
    'Insufficient funds',
    payment.bookingId
  );
}

// ============================================
// Example 5: Bulk Notifications (Admin)
// ============================================
async function bulkNotificationExample(allUserIds) {
  // Send system-wide announcement
  await NotificationHelper.notifySystemAlert(
    allUserIds,
    'Scheduled Maintenance',
    'System will be down for maintenance on Sunday from 2-4 AM',
    'normal'
  );

  // Or send promotion to specific users
  const targetUserIds = ['user1', 'user2', 'user3'];
  await Promise.all(
    targetUserIds.map(userId =>
      NotificationHelper.notifyPromotion(
        userId,
        'Special Offer!',
        'Get 20% off your next booking',
        'https://example.com/promo.jpg',
        7 * 24 * 60 * 60 * 1000 // 7 days
      )
    )
  );
}

// ============================================
// Example 6: Managing User Preferences
// ============================================
async function preferenceManagementExample(userId) {
  // Get user preferences
  const prefs = await notificationService.getUserPreferences(userId);
  console.log('Current preferences:', prefs);

  // Update preferences
  await notificationService.updatePreferences(userId, {
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    bookingNotifications: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    },
    marketingNotifications: {
      email: false,
      push: false,
      sms: false,
      inApp: true
    }
  });
}

// ============================================
// Example 7: Device Token Management
// ============================================
async function deviceTokenExample(userId) {
  // Register device for push notifications (called from mobile app)
  await notificationService.registerDeviceToken(userId, {
    token: 'fcm-token-from-firebase',
    platform: 'android',
    deviceId: 'unique-device-id',
    deviceName: 'Samsung Galaxy S21',
    appVersion: '1.0.0',
    osVersion: 'Android 12'
  });

  // Unregister device (on logout)
  await notificationService.unregisterDeviceToken(userId, 'unique-device-id');
}

// ============================================
// Example 8: Reading and Managing Notifications
// ============================================
async function notificationManagementExample(userId) {
  // Get all unread notifications
  const unread = await notificationService.getUserNotifications(userId, {
    isRead: false,
    page: 1,
    limit: 20
  });

  // Get booking-related notifications only
  const bookingNotifs = await notificationService.getUserNotifications(userId, {
    category: 'booking',
    page: 1,
    limit: 10
  });

  // Get unread count for badge
  const { count } = await notificationService.getUnreadCount(userId);
  console.log(`Unread count: ${count}`);

  // Mark specific notification as read
  await notificationService.markAsRead('notification-id', userId);

  // Mark all as read
  await notificationService.markAllAsRead(userId);

  // Delete notification
  await notificationService.deleteNotification('notification-id', userId);
}

// ============================================
// Example 9: Advanced Notification with Metadata
// ============================================
async function advancedNotificationExample(userId) {
  await notificationService.createNotification({
    userId,
    title: 'Booking Request',
    body: 'You have a new booking request from John Doe',
    type: 'booking_created',
    category: 'booking',
    priority: 'high',
    channels: ['in_app', 'email', 'push'],
    actionUrl: '/provider/bookings/123',
    imageUrl: 'https://example.com/booking-image.jpg',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    meta: {
      bookingId: '123',
      customerId: 'customer-id',
      serviceId: 'service-id',
      scheduledAt: new Date(),
      location: 'Lagos, Nigeria',
      estimatedPrice: 50000
    },
    sendImmediately: true
  });
}

// ============================================
// Example 10: Error Handling
// ============================================
async function errorHandlingExample(userId) {
  try {
    const result = await notificationService.createNotification({
      userId,
      title: 'Test Notification',
      body: 'Testing error handling',
      type: 'general',
      category: 'system'
    });

    if (!result.success) {
      console.error('Failed to create notification:', result.message);
      // Handle failure gracefully
      return;
    }

    console.log('Notification created successfully:', result.data);
  } catch (error) {
    console.error('Error creating notification:', error);
    // Log to error tracking service
    // Don't block the main flow
  }
}

// ============================================
// Example 11: Scheduled Notifications
// ============================================
async function scheduledNotificationExample(booking) {
  // Schedule reminder 24 hours before booking
  const reminderTime = new Date(booking.scheduledAt);
  reminderTime.setHours(reminderTime.getHours() - 24);
  
  const delay = reminderTime.getTime() - Date.now();
  
  if (delay > 0) {
    setTimeout(async () => {
      await NotificationHelper.notifyBookingReminder(
        booking,
        booking.userId,
        24
      );
    }, delay);
  }

  // Or use a job queue (recommended for production)
  // await jobQueue.add('send-notification', {
  //   notificationData: {...},
  //   scheduledFor: reminderTime
  // });
}

// ============================================
// Example 12: Multi-User Notifications
// ============================================
async function multiUserNotificationExample(booking) {
  // Notify both customer and provider
  await Promise.all([
    NotificationHelper.notifyBookingCreated(
      booking,
      booking.provider,
      booking.customer,
      booking.service
    ),
    notificationService.createNotification({
      userId: booking.customerId,
      title: 'Booking Request Sent',
      body: 'Your booking request has been sent to the provider',
      type: 'booking_created',
      category: 'booking',
      priority: 'normal',
      channels: ['in_app'],
      actionUrl: `/bookings/${booking.id}`
    })
  ]);
}

export {
  basicNotificationExample,
  helperFunctionExample,
  bookingFlowExample,
  paymentNotificationExample,
  bulkNotificationExample,
  preferenceManagementExample,
  deviceTokenExample,
  notificationManagementExample,
  advancedNotificationExample,
  errorHandlingExample,
  scheduledNotificationExample,
  multiUserNotificationExample
};




