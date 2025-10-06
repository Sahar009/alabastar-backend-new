# Notification System Integrations

## Overview
This document outlines all the notification integrations implemented across the Alabastar platform.

## ✅ Integrations Completed

### 1. **Booking Service** (`services/bookingService.js`)

#### Booking Created
**When:** A new booking is created
**Notifications Sent:**
- ✅ **To Provider:** New booking request notification
  - Type: `booking_created`
  - Priority: `high`
  - Channels: `in_app`, `email`, `push`
  - Action: View booking details
  
- ✅ **To Customer:** Booking request confirmation
  - Type: `booking_created`
  - Priority: `normal`
  - Channels: `in_app`, `email`
  - Action: View booking status

**Code Location:** Line 117-147 in `bookingService.js`

#### Booking Status Updated
**When:** Provider updates booking status (accepted, in_progress, completed)

**Status: Accepted**
- ✅ **To Customer:** Booking confirmed notification
  - Type: `booking_confirmed`
  - Priority: `high`
  - Channels: `in_app`, `email`, `push`, `sms`
  - Action: View booking details

**Status: In Progress**
- ✅ **To Customer:** Service started notification
  - Type: `booking_created`
  - Priority: `high`
  - Channels: `in_app`, `push`, `sms`
  - Action: Track service progress

**Status: Completed**
- ✅ **To Customer:** Service completed, request review
  - Type: `booking_completed`
  - Priority: `normal`
  - Channels: `in_app`, `email`, `push`
  - Action: Leave a review

**Code Location:** Line 347-386 in `bookingService.js`

#### Booking Cancelled
**When:** Customer or provider cancels a booking
**Notifications Sent:**
- ✅ **If Customer Cancels:**
  - Notify provider about cancellation
  - Type: `booking_cancelled`
  - Priority: `high`
  - Channels: `in_app`, `email`, `push`, `sms`

- ✅ **If Provider Cancels:**
  - Notify customer about cancellation
  - Type: `booking_cancelled`
  - Priority: `high`
  - Channels: `in_app`, `email`, `push`, `sms`

**Code Location:** Line 448-470 in `bookingService.js`

---

### 2. **Provider Service** (`services/providerService.js`)

#### Provider Registration
**When:** A new provider account is created
**Notifications Sent:**
- ✅ **To Provider:** Welcome message
  - Type: `account_update`
  - Priority: `normal`
  - Channels: `in_app`, `email`
  - Message: "Welcome to Alabastar! Start by setting up your profile and services."
  - Action: `/provider/setup`

**Code Location:** Line 186-193 in `providerService.js`

---

### 3. **Auth Service** (`services/authService.js`)

#### Customer Registration
**When:** A new customer account is created
**Notifications Sent:**
- ✅ **To Customer:** Welcome message
  - Type: `account_update`
  - Priority: `normal`
  - Channels: `in_app`, `email`
  - Message: "Welcome to Alabastar! Find and book trusted service providers near you."
  - Action: `/explore`

**Code Location:** Line 83-90 in `authService.js`

---

## 📊 Notification Summary

### By User Type

#### Customers Receive:
1. ✅ Welcome notification (on signup)
2. ✅ Booking request sent confirmation
3. ✅ Booking confirmed (provider accepted)
4. ✅ Service started (in progress)
5. ✅ Service completed (request review)
6. ✅ Booking cancelled (by provider)

#### Providers Receive:
1. ✅ Welcome notification (on signup)
2. ✅ New booking request
3. ✅ Booking cancelled (by customer)

### By Event Type

| Event | Customer | Provider | Channels |
|-------|----------|----------|----------|
| Registration | ✅ Welcome | ✅ Welcome | In-app, Email |
| Booking Created | ✅ Confirmation | ✅ New Request | In-app, Email, Push |
| Booking Accepted | ✅ Confirmed | - | In-app, Email, Push, SMS |
| Service Started | ✅ In Progress | - | In-app, Push, SMS |
| Service Completed | ✅ Request Review | - | In-app, Email, Push |
| Booking Cancelled | ✅ (if provider) | ✅ (if customer) | In-app, Email, Push, SMS |

---

## 🔔 Notification Channels Used

### In-App (`in_app`)
- Used for ALL notifications
- Always delivered immediately
- Shows in notification center

### Email (`email`)
- User registration welcome
- Booking created/confirmed
- Service completed
- Cancellations

### Push Notifications (`push`)
- Booking requests (providers)
- Booking confirmations (customers)
- Service started
- Service completed
- Cancellations

### SMS (`sms`)
- Booking confirmations (high priority)
- Service started
- Cancellations

---

## 🎯 Priority Levels Used

### High Priority
- Booking confirmations
- Service started
- Cancellations
- New booking requests (providers)

### Normal Priority
- Welcome messages
- Booking request sent (customers)
- Service completed

---

## 🔗 Action URLs

All notifications include action URLs for quick navigation:

| Notification | Action URL |
|--------------|------------|
| Welcome (Customer) | `/explore` |
| Welcome (Provider) | `/provider/setup` |
| Booking Created | `/bookings/{bookingId}` |
| Booking Confirmed | `/bookings/{bookingId}` |
| Service Started | `/bookings/{bookingId}` |
| Service Completed | `/bookings/{bookingId}/review` |
| Booking Cancelled | `/bookings/{bookingId}` |
| New Booking (Provider) | `/provider/bookings/{bookingId}` |

---

## 📦 Metadata Included

Each notification includes relevant metadata:

### Booking Notifications
```json
{
  "bookingId": "uuid",
  "providerId": "uuid",
  "serviceId": "uuid",
  "customerId": "uuid",
  "status": "accepted"
}
```

### Welcome Notifications
- No additional metadata required

---

## 🚀 Future Enhancements

### Planned Notifications (Not Yet Implemented)

1. **Payment Notifications**
   - Payment received
   - Payment failed
   - Withdrawal processed

2. **Review Notifications**
   - New review received (provider)
   - Review response (customer)

3. **Message Notifications**
   - New chat message
   - New message in thread

4. **Reminder Notifications**
   - Booking reminder (24h before)
   - Service completion reminder
   - Payment due reminder

5. **Promotional Notifications**
   - Special offers
   - Seasonal promotions
   - New features

6. **Account Notifications**
   - Email verified
   - Phone verified
   - Profile completed
   - Provider approved/rejected

---

## 🛠️ How to Add New Notifications

### Using Helper Functions

```javascript
import NotificationHelper from '../utils/notificationHelper.js';

// Example: Send payment notification
await NotificationHelper.notifyPaymentReceived(
  payment,
  userId,
  amount,
  bookingId
);
```

### Using Notification Service Directly

```javascript
import notificationService from '../services/notificationService.js';

await notificationService.createNotification({
  userId: 'user-id',
  title: 'Your Title',
  body: 'Your message',
  type: 'general',
  category: 'system',
  priority: 'normal',
  channels: ['in_app', 'email', 'push'],
  actionUrl: '/path/to/action',
  meta: { /* additional data */ }
});
```

---

## 📈 Best Practices

1. **Always use fire-and-forget** - Don't block the main operation
   ```javascript
   (async () => {
     try {
       await NotificationHelper.notifyBookingCreated(...);
     } catch (e) {
       console.warn('Notification failed:', e);
     }
   })();
   ```

2. **Include action URLs** - Help users navigate to relevant content

3. **Set appropriate priorities** - Don't overuse `urgent` priority

4. **Respect user preferences** - The system automatically filters based on preferences

5. **Include metadata** - Store relevant IDs for tracking and reference

6. **Use appropriate channels** - Not all notifications need SMS

---

## 🧪 Testing Notifications

### Test Booking Notifications
```bash
# Create a test booking (after logging in)
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "provider-uuid",
    "scheduledAt": "2025-10-15T10:00:00Z",
    "totalAmount": 5000
  }'
```

### Check Notifications
```bash
# Get all notifications
curl http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get unread count
curl http://localhost:5000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Configuration

### Environment Variables
```env
# Email notifications (already configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password

# Push notifications (optional - for future)
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=your-key
FIREBASE_CLIENT_EMAIL=your-email

# SMS notifications (optional - for future)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-number
```

---

## ✅ Checklist for New Integrations

When adding notifications to a new feature:

- [ ] Import `NotificationHelper` or `notificationService`
- [ ] Choose appropriate notification type
- [ ] Set correct priority level
- [ ] Select relevant channels
- [ ] Include action URL
- [ ] Add metadata for reference
- [ ] Use fire-and-forget pattern
- [ ] Handle errors gracefully
- [ ] Test notification delivery
- [ ] Update this documentation

---

## 📞 Support

For issues or questions:
1. Check `NOTIFICATION_SYSTEM.md` for detailed documentation
2. Review `NOTIFICATION_QUICKSTART.md` for examples
3. Check server logs for notification errors
4. Test with `/api/notifications/test` endpoint

---

**Last Updated:** 2025
**Status:** ✅ Active and Production-Ready

