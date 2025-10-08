# Settings Page API Documentation

This document outlines all the API endpoints needed for the Provider Settings page.

## 🔐 Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 📋 Account Settings

### 1. Update Profile
**Endpoint:** `PUT /api/auth/profile`  
**Description:** Update user profile information (name, phone)  
**Request Body:**
```json
{
  "fullName": "John Doe",
  "phone": "+2348012345678"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+2348012345678",
      "role": "provider",
      "status": "active"
    }
  }
}
```

---

## 🔒 Security Settings

### 2. Change Password
**Endpoint:** `PUT /api/auth/change-password`  
**Description:** Change user password  
**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```
**Error Responses:**
- `400` - Current password is incorrect
- `400` - New password must be at least 8 characters long

---

## 🔔 Notification Preferences

### 3. Get Notification Preferences
**Endpoint:** `GET /api/notifications/preferences`  
**Description:** Get user's notification preferences  
**Response:**
```json
{
  "success": true,
  "data": {
    "emailEnabled": true,
    "smsEnabled": false,
    "pushEnabled": true,
    "inAppEnabled": true,
    "bookingNotifications": {
      "email": true,
      "sms": false,
      "push": true,
      "inApp": true
    },
    "transactionNotifications": {
      "email": true,
      "sms": true,
      "push": true,
      "inApp": true
    },
    "messageNotifications": {
      "email": true,
      "sms": false,
      "push": true,
      "inApp": true
    },
    "accountNotifications": {
      "email": true,
      "sms": false,
      "push": false,
      "inApp": true
    },
    "marketingNotifications": {
      "email": false,
      "sms": false,
      "push": false,
      "inApp": false
    },
    "systemNotifications": {
      "email": true,
      "sms": false,
      "push": true,
      "inApp": true
    }
  }
}
```

### 4. Update Notification Preferences
**Endpoint:** `PUT /api/notifications/preferences`  
**Description:** Update notification preferences  
**Request Body:**
```json
{
  "emailEnabled": true,
  "smsEnabled": false,
  "pushEnabled": true,
  "inAppEnabled": true,
  "bookingNotifications": {
    "email": true,
    "sms": false,
    "push": true,
    "inApp": true
  },
  "transactionNotifications": {
    "email": true,
    "sms": true,
    "push": true,
    "inApp": true
  }
}
```
**Response:**
```json
{
  "success": true,
  "message": "Notification preferences updated successfully",
  "data": {
    // Updated preferences object
  }
}
```

---

## 💳 Subscription Management

### 5. Get Active Subscription
**Endpoint:** `GET /api/subscriptions/my-subscription`  
**Description:** Get provider's active subscription  
**Response:**
```json
{
  "success": true,
  "message": "Subscription retrieved successfully",
  "data": {
    "id": "uuid",
    "providerId": "uuid",
    "planId": "uuid",
    "status": "active",
    "currentPeriodStart": "2025-01-01T00:00:00.000Z",
    "currentPeriodEnd": "2025-02-01T00:00:00.000Z",
    "autoRenew": true,
    "plan": {
      "id": "uuid",
      "name": "Professional Plan",
      "price": 15000.00,
      "interval": "monthly",
      "benefits": ["Unlimited bookings", "Priority support", "Analytics"]
    }
  }
}
```

### 6. Get Subscription History
**Endpoint:** `GET /api/subscriptions/history`  
**Description:** Get provider's subscription history  
**Response:**
```json
{
  "success": true,
  "message": "Subscription history retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "providerId": "uuid",
      "planId": "uuid",
      "status": "active",
      "currentPeriodStart": "2025-01-01T00:00:00.000Z",
      "currentPeriodEnd": "2025-02-01T00:00:00.000Z",
      "autoRenew": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "plan": {
        "name": "Professional Plan",
        "price": 15000.00,
        "interval": "monthly"
      }
    }
  ]
}
```

### 7. Cancel Subscription
**Endpoint:** `POST /api/subscriptions/cancel`  
**Description:** Cancel provider's subscription  
**Request Body:**
```json
{
  "subscriptionId": "uuid"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

### 8. Reactivate Subscription
**Endpoint:** `POST /api/subscriptions/reactivate`  
**Description:** Reactivate a cancelled subscription  
**Request Body:**
```json
{
  "subscriptionId": "uuid"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Subscription reactivated successfully",
  "data": {
    "id": "uuid",
    "status": "active",
    "autoRenew": true
  }
}
```

### 9. Get Available Plans
**Endpoint:** `GET /api/subscription-plans/plans`  
**Description:** Get all available subscription plans (for upgrade/downgrade)  
**Response:**
```json
{
  "success": true,
  "message": "Subscription plans retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Basic Plan",
      "slug": "basic-plan",
      "price": 5000.00,
      "interval": "monthly",
      "benefits": ["Basic listing", "Customer support"]
    },
    {
      "id": "uuid",
      "name": "Professional Plan",
      "slug": "professional-plan",
      "price": 15000.00,
      "interval": "monthly",
      "benefits": ["Unlimited bookings", "Priority support", "Analytics"]
    }
  ]
}
```

---

## 🗑️ Account Deletion

### 10. Delete Account
**Endpoint:** `DELETE /api/auth/delete-account`  
**Description:** Permanently delete user account and all associated data  
**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```
**Note:** This action is irreversible and will delete:
- User account
- Provider profile
- All bookings
- All documents
- All notifications
- All subscriptions

---

## 📊 Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied: Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 🔄 Usage Flow

### Settings Page Load:
1. Fetch user profile: `GET /api/auth/verify`
2. Fetch notification preferences: `GET /api/notifications/preferences`
3. Fetch active subscription: `GET /api/subscriptions/my-subscription`

### Update Account:
1. Update profile: `PUT /api/auth/profile`

### Change Password:
1. Change password: `PUT /api/auth/change-password`

### Update Notifications:
1. Update preferences: `PUT /api/notifications/preferences`

### Manage Subscription:
1. View current plan: `GET /api/subscriptions/my-subscription`
2. View available plans: `GET /api/subscription-plans/plans`
3. Cancel subscription: `POST /api/subscriptions/cancel`
4. Reactivate subscription: `POST /api/subscriptions/reactivate`

### Delete Account:
1. Confirm deletion (frontend)
2. Delete account: `DELETE /api/auth/delete-account`
3. Clear local storage and redirect to home

---

## 🧪 Testing

### Test with cURL:

**Get Notification Preferences:**
```bash
curl -X GET http://localhost:8000/api/notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Change Password:**
```bash
curl -X PUT http://localhost:8000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldpass123",
    "newPassword": "newpass123"
  }'
```

**Get Active Subscription:**
```bash
curl -X GET http://localhost:8000/api/subscriptions/my-subscription \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Delete Account:**
```bash
curl -X DELETE http://localhost:8000/api/auth/delete-account \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ API Checklist

- [x] Update Profile - `PUT /api/auth/profile`
- [x] Change Password - `PUT /api/auth/change-password`
- [x] Get Notification Preferences - `GET /api/notifications/preferences`
- [x] Update Notification Preferences - `PUT /api/notifications/preferences`
- [x] Get Active Subscription - `GET /api/subscriptions/my-subscription`
- [x] Get Subscription History - `GET /api/subscriptions/history`
- [x] Cancel Subscription - `POST /api/subscriptions/cancel`
- [x] Reactivate Subscription - `POST /api/subscriptions/reactivate`
- [x] Get Available Plans - `GET /api/subscription-plans/plans`
- [x] Delete Account - `DELETE /api/auth/delete-account`

All endpoints are now implemented and ready for use! 🎉
