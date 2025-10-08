# Notification System Documentation

## Overview
The Alabastar notification system provides a comprehensive multi-channel notification platform supporting:
- **In-app notifications** - Real-time notifications within the application
- **Email notifications** - Email delivery via SMTP
- **Push notifications** - Mobile push notifications via Firebase Cloud Messaging (FCM)
- **SMS notifications** - SMS delivery (integration ready)

## Architecture

### Models

#### 1. Notification Model
Stores all notification records with the following key features:
- Multiple notification types (booking, payment, message, etc.)
- Priority levels (low, normal, high, urgent)
- Category-based organization
- Multi-channel delivery tracking
- Expiration support for time-sensitive notifications
- Rich metadata support

**Fields:**
- `id` - UUID primary key
- `userId` - User receiving the notification
- `title` - Notification title
- `body` - Notification content
- `type` - Notification type (enum)
- `category` - Notification category (transaction, booking, message, account, marketing, system)
- `priority` - Priority level (low, normal, high, urgent)
- `channels` - Array of delivery channels
- `isRead` - Read status
- `readAt` - Timestamp when read
- `deliveryStatus` - JSON object tracking delivery status per channel
- `actionUrl` - Deep link or URL for notification action
- `imageUrl` - Optional image for rich notifications
- `expiresAt` - Expiration timestamp
- `meta` - Additional metadata (bookingId, amount, etc.)
- `pushSentAt`, `emailSentAt`, `smsSentAt` - Delivery timestamps

#### 2. NotificationPreference Model
User preferences for notification delivery:
- Global channel toggles (email, SMS, push, in-app)
- Category-specific preferences for fine-grained control
- Do Not Disturb time windows
- Timezone and language preferences

**Fields:**
- `emailEnabled`, `smsEnabled`, `pushEnabled`, `inAppEnabled` - Global toggles
- `bookingNotifications`, `transactionNotifications`, etc. - Category-specific settings
- `doNotDisturbStart`, `doNotDisturbEnd` - DND time window
- `timezone`, `language` - User preferences

#### 3. DeviceToken Model
Manages user devices for push notifications:
- FCM token storage
- Platform tracking (iOS, Android, Web)
- Device metadata (name, version, OS)
- Active status management

**Fields:**
- `userId` - Owner of the device
- `token` - FCM token
- `platform` - Device platform (ios, android, web)
- `deviceId`, `deviceName` - Device identifiers
- `appVersion`, `osVersion` - App/OS versions
- `isActive` - Active status
- `lastUsedAt` - Last usage timestamp

## API Endpoints

### User Endpoints

#### Get Notifications
```
GET /api/notifications
Authorization: Bearer <token>

Query Parameters:
- page (default: 1)
- limit (default: 20)
- isRead (boolean)
- category (string)
- type (string)

Response:
{
  "success": true,
  "data": [...notifications],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

#### Get Unread Count
```
GET /api/notifications/unread-count
Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 5
}
```

#### Mark as Read
```
PATCH /api/notifications/:id/read
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Notification marked as read",
  "data": {...notification}
}
```

#### Mark All as Read
```
PATCH /api/notifications/mark-all-read
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "All notifications marked as read"
}
```

#### Delete Notification
```
DELETE /api/notifications/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Notification deleted"
}
```

#### Get Preferences
```
GET /api/notifications/preferences
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {...preferences}
}
```

#### Update Preferences
```
PUT /api/notifications/preferences
Authorization: Bearer <token>

Body:
{
  "emailEnabled": true,
  "pushEnabled": true,
  "bookingNotifications": {
    "email": true,
    "push": true,
    "sms": false,
    "inApp": true
  }
}

Response:
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {...preferences}
}
```

#### Register Device Token
```
POST /api/notifications/device-token
Authorization: Bearer <token>

Body:
{
  "token": "fcm-token-here",
  "platform": "android",
  "deviceId": "unique-device-id",
  "deviceName": "Samsung Galaxy S21",
  "appVersion": "1.0.0",
  "osVersion": "Android 12"
}

Response:
{
  "success": true,
  "message": "Device token registered successfully",
  "data": {...deviceToken}
}
```

#### Unregister Device Token
```
DELETE /api/notifications/device-token/:deviceId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Device unregistered"
}
```

#### Send Test Notification
```
POST /api/notifications/test
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Test notification sent",
  "data": {...notification}
}
```

### Admin Endpoints

#### Create Notification
```
POST /api/notifications/create
Authorization: Bearer <token>
Role: admin

Body:
{
  "userId": "user-uuid",
  "title": "Payment Received",
  "body": "Your payment of $100 has been received",
  "type": "payment_received",
  "category": "transaction",
  "priority": "high",
  "channels": ["in_app", "email", "push"],
  "actionUrl": "/bookings/123",
  "meta": {
    "bookingId": "123",
    "amount": 100
  }
}

Response:
{
  "success": true,
  "message": "Notification created successfully",
  "data": {...notification}
}
```

#### Send Bulk Notifications
```
POST /api/notifications/bulk
Authorization: Bearer <token>
Role: admin

Body:
{
  "userIds": ["user1-uuid", "user2-uuid", "user3-uuid"],
  "title": "System Maintenance",
  "body": "Scheduled maintenance on Sunday",
  "type": "system_alert",
  "category": "system",
  "priority": "normal",
  "channels": ["in_app", "email"]
}

Response:
{
  "success": true,
  "message": "Created 3 notifications",
  "count": 3
}
```

## Using the Notification Service

### Basic Usage

```javascript
import notificationService from '../services/notificationService.js';

// Create a simple notification
const result = await notificationService.createNotification({
  userId: 'user-uuid',
  title: 'Booking Confirmed',
  body: 'Your booking has been confirmed by the provider',
  type: 'booking_confirmed',
  category: 'booking',
  priority: 'high',
  channels: ['in_app', 'email', 'push'],
  actionUrl: '/bookings/123',
  meta: {
    bookingId: '123',
    providerId: 'provider-uuid'
  },
  sendImmediately: true
});
```

### Advanced Usage

```javascript
// Create notification with expiration
await notificationService.createNotification({
  userId: 'user-uuid',
  title: 'Limited Time Offer',
  body: 'Get 20% off your next booking!',
  type: 'promotion',
  category: 'marketing',
  priority: 'low',
  channels: ['in_app', 'push'],
  imageUrl: 'https://example.com/promo.jpg',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  meta: {
    promoCode: 'SAVE20'
  }
});

// Send bulk notifications
await notificationService.createBulkNotification(
  ['user1-uuid', 'user2-uuid'],
  {
    title: 'New Feature Available',
    body: 'Check out our new chat feature',
    type: 'system_alert',
    category: 'system',
    channels: ['in_app', 'email']
  }
);
```

### Integration in Booking Flow

```javascript
// In bookingService.js
import notificationService from './notificationService.js';

// After booking creation
await notificationService.createNotification({
  userId: booking.providerId,
  title: 'New Booking Request',
  body: `New booking request for ${service.title}`,
  type: 'booking_created',
  category: 'booking',
  priority: 'high',
  channels: ['in_app', 'email', 'push'],
  actionUrl: `/provider/bookings/${booking.id}`,
  meta: {
    bookingId: booking.id,
    customerId: booking.userId,
    serviceId: booking.serviceId
  }
});

// After booking confirmation
await notificationService.createNotification({
  userId: booking.userId,
  title: 'Booking Confirmed',
  body: `Your booking has been confirmed`,
  type: 'booking_confirmed',
  category: 'booking',
  priority: 'high',
  channels: ['in_app', 'email', 'push', 'sms'],
  actionUrl: `/bookings/${booking.id}`,
  meta: {
    bookingId: booking.id
  }
});
```

## Push Notification Setup (Firebase)

### Backend Setup

1. Install Firebase Admin SDK:
```bash
npm install firebase-admin
```

2. Add Firebase configuration to `.env`:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

3. Uncomment FCM code in `notificationService.js` (sendPushNotification method)

### Mobile App Integration

#### React Native (Expo)

```javascript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions and get token
async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return;
  }
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // Register with backend
  await fetch('https://api.yourdomain.com/api/notifications/device-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token,
      platform: Platform.OS,
      deviceId: await getDeviceId(),
      deviceName: await Device.deviceName,
      appVersion: '1.0.0',
      osVersion: Platform.Version
    })
  });
}
```

## Notification Types Reference

### Booking Notifications
- `booking_created` - New booking created
- `booking_confirmed` - Booking confirmed by provider
- `booking_cancelled` - Booking cancelled
- `booking_completed` - Booking completed
- `booking_reminder` - Reminder before scheduled time

### Transaction Notifications
- `payment_received` - Payment received
- `payment_failed` - Payment failed

### Message Notifications
- `message_received` - New message in chat

### Account Notifications
- `account_update` - Account settings updated

### Marketing Notifications
- `promotion` - Promotional offers

### System Notifications
- `system_alert` - System-wide announcements
- `general` - General notifications

## Best Practices

1. **Always respect user preferences** - The service automatically filters channels based on user settings

2. **Use appropriate priority levels**:
   - `urgent` - Critical alerts (payment failures, booking cancellations)
   - `high` - Important updates (booking confirmations, new messages)
   - `normal` - Regular notifications (reminders, general updates)
   - `low` - Marketing and promotional content

3. **Provide action URLs** - Include deep links for better user experience

4. **Use metadata** - Store relevant IDs and data for reference

5. **Set expiration for time-sensitive notifications** - Promotions, time-limited offers

6. **Clean up old notifications** - Run periodic cleanup:
```javascript
await notificationService.cleanupExpiredNotifications();
```

## Testing

Use the test endpoint to verify notification delivery:
```bash
curl -X POST https://api.yourdomain.com/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Migration

When deploying, ensure to run database migrations to create the new tables:
- `notifications` (enhanced)
- `notification_preferences` (enhanced)
- `device_tokens` (new)

The system will automatically create default preferences for users on first access.

## Troubleshooting

### Notifications not being sent
1. Check user preferences
2. Verify email/SMS configuration
3. Check Firebase FCM setup
4. Review server logs for errors

### Push notifications not received
1. Verify device token is registered
2. Check FCM configuration
3. Ensure app has notification permissions
4. Verify token is active in database

### Emails not being delivered
1. Check SMTP configuration in `.env`
2. Verify email templates exist
3. Check spam folders
4. Review email service logs






