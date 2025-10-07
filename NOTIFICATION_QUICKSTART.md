# Notification System - Quick Start Guide

## 🚀 What's New

Your Alabastar application now has a **comprehensive multi-channel notification system** supporting:

- ✅ **In-app notifications** - Real-time notifications in the application
- ✅ **Email notifications** - Automated email delivery
- ✅ **Push notifications** - Mobile push notifications (ready for FCM integration)
- ✅ **SMS notifications** - SMS delivery (integration ready)

## 📁 Files Created/Modified

### New Files:
- `backend/schema/DeviceToken.js` - Model for managing push notification tokens
- `backend/services/notificationService.js` - Core notification service
- `backend/controllers/notificationController.js` - API controllers
- `backend/routes/notificationRoutes.js` - API routes
- `backend/utils/notificationHelper.js` - Helper functions for common notifications
- `backend/NOTIFICATION_SYSTEM.md` - Complete documentation
- `backend/examples/notification-integration-example.js` - Integration examples

### Enhanced Files:
- `backend/schema/Notification.js` - Enhanced with push notification support
- `backend/schema/NotificationPreference.js` - Enhanced with granular preferences
- `backend/schema/index.js` - Added DeviceToken model
- `backend/routes/index.js` - Registered notification routes

## 🎯 Quick Examples

### 1. Send a Simple Notification

```javascript
import NotificationHelper from '../utils/notificationHelper.js';

// After booking is created
await NotificationHelper.notifyBookingCreated(
  booking,
  provider,
  customer,
  service
);
```

### 2. Send a Payment Notification

```javascript
// Payment received
await NotificationHelper.notifyPaymentReceived(
  payment,
  userId,
  amount,
  bookingId
);
```

### 3. Send Custom Notification

```javascript
import notificationService from '../services/notificationService.js';

await notificationService.createNotification({
  userId: 'user-uuid',
  title: 'Hello!',
  body: 'This is a test notification',
  type: 'general',
  category: 'system',
  channels: ['in_app', 'email', 'push']
});
```

## 📡 API Endpoints

All endpoints require authentication (`Authorization: Bearer <token>`)

### User Endpoints:
- `GET /api/notifications` - Get user's notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences
- `POST /api/notifications/device-token` - Register device for push
- `DELETE /api/notifications/device-token/:deviceId` - Unregister device
- `POST /api/notifications/test` - Send test notification

### Admin Endpoints:
- `POST /api/notifications/create` - Create single notification
- `POST /api/notifications/bulk` - Send bulk notifications

## 🔧 Integration Steps

### Step 1: Use in Your Booking Flow

```javascript
// In bookingService.js
import NotificationHelper from '../utils/notificationHelper.js';

// After creating booking
await NotificationHelper.notifyBookingCreated(booking, provider, customer, service);

// After confirming booking
await NotificationHelper.notifyBookingConfirmed(booking, customer, provider, service);

// After completing booking
await NotificationHelper.notifyBookingCompleted(booking, customer, provider, service);
```

### Step 2: Use in Payment Flow

```javascript
// In paymentController.js
import NotificationHelper from '../utils/notificationHelper.js';

// After successful payment
await NotificationHelper.notifyPaymentReceived(payment, userId, amount, bookingId);

// If payment fails
await NotificationHelper.notifyPaymentFailed(userId, amount, reason, bookingId);
```

### Step 3: Use in Chat/Messaging

```javascript
// After sending message
await NotificationHelper.notifyNewMessage(message, recipientId, senderName, threadId);
```

## 📱 Mobile App Setup (Push Notifications)

### For React Native / Expo:

```javascript
import * as Notifications from 'expo-notifications';

// Get FCM token
const token = await Notifications.getExpoPushTokenAsync();

// Register with backend
await fetch('https://api.yourdomain.com/api/notifications/device-token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: token.data,
    platform: Platform.OS,
    deviceId: 'unique-device-id',
    deviceName: 'Device Name',
    appVersion: '1.0.0',
    osVersion: Platform.Version
  })
});
```

## 🎨 Frontend Integration

### Get Notifications:

```javascript
const response = await fetch('/api/notifications?page=1&limit=20', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data, pagination } = await response.json();
```

### Get Unread Count (for badge):

```javascript
const response = await fetch('/api/notifications/unread-count', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { count } = await response.json();
```

### Mark as Read:

```javascript
await fetch(`/api/notifications/${notificationId}/read`, {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Update Preferences:

```javascript
await fetch('/api/notifications/preferences', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    emailEnabled: true,
    pushEnabled: true,
    bookingNotifications: {
      email: true,
      push: true,
      sms: false,
      inApp: true
    }
  })
});
```

## 🔔 Notification Types

The system supports these notification types:

### Booking:
- `booking_created` - New booking request
- `booking_confirmed` - Booking confirmed
- `booking_cancelled` - Booking cancelled
- `booking_completed` - Booking completed
- `booking_reminder` - Upcoming booking reminder

### Transaction:
- `payment_received` - Payment successful
- `payment_failed` - Payment failed

### Communication:
- `message_received` - New chat message

### Account:
- `account_update` - Account changes
- `review_received` - New review

### Marketing:
- `promotion` - Promotional offers

### System:
- `system_alert` - System announcements
- `general` - General notifications

## 🎚️ Priority Levels

- `urgent` - Critical alerts (shown prominently)
- `high` - Important updates
- `normal` - Regular notifications (default)
- `low` - Marketing/promotional

## 🛠️ Testing

### Test the System:

```bash
# Send test notification
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Notification Delivery:

```bash
# Get all notifications
curl http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get unread count
curl http://localhost:5000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔐 Security

- All endpoints require authentication
- Users can only access their own notifications
- Admin-only endpoints for creating notifications
- User preferences are respected automatically

## 📊 Database Tables

The system creates/modifies these tables:
- `notifications` (enhanced) - Stores all notifications
- `notification_preferences` (enhanced) - User preferences
- `device_tokens` (new) - Push notification tokens

## 🎁 Helper Functions Available

Check `backend/utils/notificationHelper.js` for pre-built functions:
- `notifyBookingCreated()`
- `notifyBookingConfirmed()`
- `notifyBookingCancelled()`
- `notifyBookingCompleted()`
- `notifyBookingReminder()`
- `notifyPaymentReceived()`
- `notifyPaymentFailed()`
- `notifyReviewReceived()`
- `notifyNewMessage()`
- `notifyWelcome()`
- `notifyPromotion()`
- `notifySystemAlert()`
- And more!

## 📖 Full Documentation

For complete documentation, see:
- `backend/NOTIFICATION_SYSTEM.md` - Complete system documentation
- `backend/examples/notification-integration-example.js` - Code examples

## 🚨 Next Steps

1. ✅ System is ready to use for in-app and email notifications
2. 🔄 Set up Firebase Cloud Messaging for push notifications
3. 🔄 Integrate SMS provider (Twilio, etc.) if needed
4. ✅ Start using helper functions in your booking/payment flows
5. ✅ Update frontend to display notifications
6. ✅ Implement notification badge in UI

## 💡 Tips

1. Always use helper functions when available
2. Set appropriate priority levels
3. Include actionUrl for better UX
4. Use metadata to store reference IDs
5. Set expiration for time-sensitive notifications
6. Test with `/api/notifications/test` endpoint

## 🆘 Support

If you need help:
1. Check the full documentation in `NOTIFICATION_SYSTEM.md`
2. Review examples in `examples/notification-integration-example.js`
3. Test endpoints with the test route

---

**Ready to use!** Start sending notifications by importing the helper functions or service in your code. 🎉




