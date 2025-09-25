# Booking API Documentation

## Overview
The Booking API provides endpoints for managing service bookings between customers and providers. All booking endpoints require authentication.

## Base URL
```
http://localhost:5000/api/bookings
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Booking
**POST** `/api/bookings`

Creates a new booking for a service.

**Request Body:**
```json
{
  "providerId": "uuid",
  "serviceId": "uuid", 
  "scheduledAt": "2024-01-15T10:00:00Z",
  "locationAddress": "123 Main Street",
  "locationCity": "Lagos",
  "locationState": "Lagos",
  "latitude": 6.5244,
  "longitude": 3.3792,
  "totalAmount": 5000.00,
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "statusCode": 201,
  "data": {
    "id": "booking-uuid",
    "userId": "customer-uuid",
    "providerId": "provider-uuid",
    "serviceId": "service-uuid",
    "scheduledAt": "2024-01-15T10:00:00Z",
    "status": "requested",
    "totalAmount": 5000.00,
    "currency": "NGN",
    "paymentStatus": "pending",
    "escrowStatus": "held",
    "customer": {
      "id": "customer-uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+234123456789"
    },
    "provider": {
      "id": "provider-uuid", 
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+234987654321"
    },
    "service": {
      "id": "service-uuid",
      "title": "Plumbing Repair",
      "description": "Fix leaky faucet",
      "pricingType": "fixed",
      "basePrice": 5000.00
    }
  }
}
```

### 2. Get Bookings
**GET** `/api/bookings`

Retrieves bookings for the authenticated user.

**Query Parameters:**
- `userType` (optional): "customer" or "provider" (default: "customer")
- `status` (optional): Filter by booking status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `startDate` (optional): Filter bookings from this date
- `endDate` (optional): Filter bookings to this date

**Example:**
```
GET /api/bookings?userType=customer&status=requested&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "statusCode": 200,
  "data": {
    "bookings": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

### 3. Get Booking by ID
**GET** `/api/bookings/:id`

Retrieves a specific booking by ID.

**Query Parameters:**
- `userType` (optional): "customer" or "provider" (default: "customer")

**Response:**
```json
{
  "success": true,
  "message": "Booking retrieved successfully",
  "statusCode": 200,
  "data": {
    "id": "booking-uuid",
    "userId": "customer-uuid",
    "providerId": "provider-uuid",
    "serviceId": "service-uuid",
    "scheduledAt": "2024-01-15T10:00:00Z",
    "status": "requested",
    "totalAmount": 5000.00,
    "currency": "NGN",
    "paymentStatus": "pending",
    "escrowStatus": "held",
    "customer": {...},
    "provider": {...},
    "service": {...}
  }
}
```

### 4. Update Booking Status
**PATCH** `/api/bookings/:id/status`

Updates the status of a booking.

**Request Body:**
```json
{
  "status": "accepted",
  "notes": "Optional notes about the status change"
}
```

**Valid Status Transitions:**
- `requested` → `accepted`, `cancelled`
- `accepted` → `in_progress`, `cancelled`
- `in_progress` → `completed`, `cancelled`
- `completed` → (no transitions)
- `cancelled` → (no transitions)

**Response:**
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "statusCode": 200,
  "data": {
    "id": "booking-uuid",
    "status": "accepted",
    "updatedAt": "2024-01-15T12:00:00Z",
    ...
  }
}
```

### 5. Cancel Booking
**PATCH** `/api/bookings/:id/cancel`

Cancels a booking.

**Request Body:**
```json
{
  "reason": "Customer requested cancellation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "statusCode": 200,
  "data": {
    "id": "booking-uuid",
    "status": "cancelled",
    "notes": "Cancelled: Customer requested cancellation",
    ...
  }
}
```

### 6. Get Provider Availability
**GET** `/api/bookings/provider/:providerId/availability`

Gets available time slots for a provider on a specific date.

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Example:**
```
GET /api/bookings/provider/provider-uuid/availability?date=2024-01-15
```

**Response:**
```json
{
  "success": true,
  "message": "Provider availability retrieved successfully",
  "statusCode": 200,
  "data": {
    "date": "2024-01-15",
    "availableSlots": [
      {
        "time": "2024-01-15T08:00:00Z",
        "displayTime": "08:00 AM"
      },
      {
        "time": "2024-01-15T10:00:00Z", 
        "displayTime": "10:00 AM"
      }
    ],
    "bookedSlots": 2
  }
}
```

### 7. Get Booking Statistics
**GET** `/api/bookings/stats`

Gets booking statistics for the authenticated user.

**Query Parameters:**
- `userType` (optional): "customer" or "provider" (default: "customer")

**Response:**
```json
{
  "success": true,
  "message": "Booking stats retrieved successfully",
  "statusCode": 200,
  "data": {
    "totalBookings": 25,
    "pendingBookings": 3,
    "completedBookings": 20,
    "cancelledBookings": 2,
    "totalEarnings": 125000.00
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided.",
  "statusCode": 401
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Booking not found",
  "statusCode": 404
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Provider is not available at the requested time",
  "statusCode": 409
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "statusCode": 500
}
```

## Booking Status Flow

```
requested → accepted → in_progress → completed
    ↓           ↓           ↓
cancelled ← cancelled ← cancelled
```

## Business Rules

1. **Booking Creation:**
   - Service must exist and be active
   - Provider must be available
   - No conflicting bookings within 2-hour window
   - Total amount must be positive

2. **Status Updates:**
   - Only valid status transitions are allowed
   - Users can only update their own bookings
   - Completed and cancelled bookings cannot be modified

3. **Availability:**
   - Providers are available 8 AM to 8 PM
   - 2-hour booking slots
   - No double bookings within the same time slot

4. **Authentication:**
   - All endpoints require valid JWT token
   - Users can only access their own bookings
   - Providers can only access bookings for their services

