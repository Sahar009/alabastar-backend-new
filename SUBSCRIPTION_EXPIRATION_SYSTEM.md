# Subscription Expiration System Documentation

## Overview

The Subscription Expiration System automatically manages provider subscription lifecycles, including expiration detection, notifications, grace periods, and automatic renewal attempts. This system ensures that expired subscriptions are properly handled and users are notified about upcoming expirations.

## Features Implemented

### ✅ **Automatic Expiration Detection**
- **Cron Job**: Runs every hour to check for expired subscriptions
- **Status Updates**: Automatically changes `status` from `'active'` to `'expired'`
- **Payment Status**: Updates provider `paymentStatus` to `'pending'` when subscription expires

### ✅ **Pre-Expiration Notifications**
- **Notification Schedule**: 7 days, 3 days, and 1 day before expiration
- **Cron Job**: Runs daily at 9 AM to check for upcoming expirations
- **Notification Types**: 
  - `subscription_expiring` - Upcoming expiration warnings
  - `subscription_expired` - When subscription expires
  - `subscription_grace_period_expired` - When grace period ends

### ✅ **Grace Period Handling**
- **Grace Period**: 3 days for failed payments
- **Status Management**: Subscriptions marked as `'past_due'` during grace period
- **Automatic Expiration**: After grace period, status changes to `'expired'`
- **Cron Job**: Runs daily at 10 AM to check grace period expirations

### ✅ **Automatic Renewal Attempts**
- **Auto-Renewal**: Attempts renewal for subscriptions with `autoRenew: true`
- **Payment Processing**: Integrates with Paystack for renewal payments
- **Fallback Handling**: Marks as `'past_due'` if renewal fails

### ✅ **Enhanced Feature Access Control**
- **SubscriptionHelper Updates**: Now properly handles expired subscriptions
- **Feature Restrictions**: Blocks photo/video uploads for expired subscriptions
- **Status Information**: Returns subscription status in API responses

### ✅ **Admin Management**
- **Statistics Dashboard**: `/api/admin/subscription-expiration-stats`
- **Manual Triggers**: `/api/admin/subscription-expiration-check`
- **Expired Subscriptions**: `/api/admin/expired-subscriptions`
- **Renewal Management**: `/api/admin/subscriptions/:id/renew`

## Technical Implementation

### **Service Architecture**

```javascript
// SubscriptionExpirationService
class SubscriptionExpirationService {
  constructor() {
    this.gracePeriodDays = 3;
    this.notificationDays = [7, 3, 1];
  }
  
  start() {
    // Hourly expiration check
    cron.schedule('0 * * * *', this.checkExpiredSubscriptions);
    
    // Daily upcoming expiration check (9 AM)
    cron.schedule('0 9 * * *', this.checkUpcomingExpirations);
    
    // Daily grace period check (10 AM)
    cron.schedule('0 10 * * *', this.checkGracePeriodExpirations);
  }
}
```

### **Database Schema Updates**

The system uses existing database tables with enhanced status handling:

```sql
-- ProviderSubscription status values
status: ENUM('active', 'past_due', 'cancelled', 'expired')

-- ProviderProfile payment status
paymentStatus: ENUM('pending', 'paid', 'failed')
```

### **Notification System**

Notifications are created in the `notifications` table with specific types:

```javascript
// Notification types
'subscription_expiring'     // 7, 3, 1 days before expiration
'subscription_expired'      // When subscription expires
'subscription_grace_period_expired' // When grace period ends
```

## API Endpoints

### **Admin Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/subscription-expiration-stats` | GET | Get expiration statistics |
| `/api/admin/subscription-expiration-check` | POST | Manually trigger expiration check |
| `/api/admin/expired-subscriptions` | GET | Get expired subscriptions with pagination |
| `/api/admin/subscriptions/:id/renew` | POST | Renew expired subscription |

### **Example API Responses**

#### **Expiration Statistics**
```json
{
  "success": true,
  "data": {
    "statusBreakdown": [
      { "status": "active", "count": 14 },
      { "status": "expired", "count": 2 }
    ],
    "upcomingExpirations": 3,
    "expiredCount": 2,
    "gracePeriodDays": 3
  }
}
```

#### **Feature Limits (Updated)**
```json
{
  "success": true,
  "data": {
    "hasSubscription": false,
    "planName": "Premium Plan",
    "subscriptionStatus": "expired",
    "features": {
      "maxPhotos": 0,
      "maxVideos": 0
    },
    "expiredAt": "2025-10-20T00:00:00.000Z"
  }
}
```

## Cron Job Schedule

| Schedule | Description | Function |
|----------|-------------|----------|
| `0 * * * *` | Every hour | Check for expired subscriptions |
| `0 9 * * *` | Daily at 9 AM | Check for upcoming expirations |
| `0 10 * * *` | Daily at 10 AM | Check for grace period expirations |

## User Experience Flow

### **Active Subscription**
1. ✅ User has full access to premium features
2. ✅ Photo/video uploads work normally
3. ✅ Top listing features available

### **7 Days Before Expiration**
1. 🔔 Notification sent: "Subscription expires in 7 days"
2. ✅ Features still work normally
3. 📧 User encouraged to renew

### **3 Days Before Expiration**
1. 🔔 Notification sent: "Subscription expires in 3 days"
2. ✅ Features still work normally
3. ⚠️ Urgent renewal reminder

### **1 Day Before Expiration**
1. 🔔 Notification sent: "Subscription expires in 1 day"
2. ✅ Features still work normally
3. 🚨 Final renewal warning

### **Subscription Expires**
1. ❌ Status changes to `'expired'`
2. ❌ `paymentStatus` changes to `'pending'`
3. 🔔 Notification sent: "Subscription expired"
4. ❌ Premium features disabled
5. ❌ Photo/video uploads blocked

### **Grace Period (3 days)**
1. ⏰ Status changes to `'past_due'`
2. ❌ Features still disabled
3. 🔄 Automatic renewal attempts (if enabled)
4. 📧 Payment failure notifications

### **After Grace Period**
1. ❌ Status changes to `'expired'`
2. 🔔 Final notification sent
3. ❌ All premium features permanently disabled
4. 📞 Manual renewal required

## Configuration

### **Environment Variables**
```bash
# Grace period (days)
GRACE_PERIOD_DAYS=3

# Notification days before expiration
NOTIFICATION_DAYS=7,3,1

# Auto-renewal enabled by default
DEFAULT_AUTO_RENEW=true
```

### **Service Configuration**
```javascript
// In SubscriptionExpirationService constructor
this.gracePeriodDays = 3;           // 3 days grace period
this.notificationDays = [7, 3, 1];  // Notify 7, 3, 1 days before
```

## Monitoring and Maintenance

### **Logs to Monitor**
- `🔍 Checking for expired subscriptions...`
- `🔔 Checking for upcoming subscription expirations...`
- `⏰ Checking for grace period expirations...`
- `📧 [Type] notification sent to user [ID]`

### **Key Metrics**
- Number of active subscriptions
- Number of expired subscriptions
- Upcoming expirations (next 7 days)
- Grace period subscriptions
- Notification delivery rates

### **Troubleshooting**

#### **Service Not Running**
```bash
# Check if service is initialized in server logs
grep "Subscription expiration monitoring started" logs/server.log
```

#### **Notifications Not Sending**
```bash
# Check notification table
SELECT * FROM notifications WHERE type LIKE 'subscription_%' ORDER BY createdAt DESC LIMIT 10;
```

#### **Expired Subscriptions Not Updating**
```bash
# Check for subscriptions past expiration date
SELECT * FROM provider_subscriptions 
WHERE status = 'active' 
AND currentPeriodEnd < NOW();
```

## Security Considerations

1. **Admin Access**: All admin endpoints require authentication
2. **Data Validation**: Input validation on all renewal operations
3. **Audit Trail**: All status changes are logged
4. **Rate Limiting**: Cron jobs have built-in rate limiting

## Future Enhancements

### **Planned Features**
- [ ] Email notifications (currently only in-app)
- [ ] SMS notifications for critical events
- [ ] Webhook integrations for external systems
- [ ] Advanced analytics dashboard
- [ ] Bulk renewal operations
- [ ] Custom grace period per subscription plan

### **Integration Opportunities**
- [ ] Payment processor webhooks
- [ ] Customer support system integration
- [ ] Marketing automation triggers
- [ ] Revenue analytics

## Testing

The system has been tested with:
- ✅ Database connectivity
- ✅ Cron job execution
- ✅ Notification creation
- ✅ Status updates
- ✅ Feature access control
- ✅ Admin API endpoints

## Support

For issues or questions about the subscription expiration system:
1. Check server logs for error messages
2. Verify cron job execution in logs
3. Test admin API endpoints manually
4. Review database status consistency

---

**Last Updated**: October 22, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready


