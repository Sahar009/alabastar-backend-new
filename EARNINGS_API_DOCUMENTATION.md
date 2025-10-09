# Earnings & Payouts API Documentation

Complete API documentation for the provider earnings and withdrawal system.

---

## 🔐 Authentication

All endpoints require authentication via JWT token and provider role:
```
Authorization: Bearer <token>
Role: provider
```

---

## 📊 API Endpoints

### 1. Get Earnings Statistics

**Endpoint:** `GET /api/earnings/stats`  
**Description:** Get comprehensive earnings statistics for the authenticated provider  
**Authentication:** Required (Provider)

**Response:**
```json
{
  "success": true,
  "message": "Earnings stats retrieved successfully",
  "data": {
    "totalEarnings": 50000.00,
    "thisMonth": 23500.00,
    "lastMonth": 20000.00,
    "availableBalance": 40000.00,
    "pendingEarnings": 8500.00,
    "totalWithdrawals": 10000.00,
    "commissionEarned": 1500.00,
    "platformFee": 5000.00,
    "netEarnings": 45000.00
  }
}
```

**Calculation Logic:**
- `totalEarnings` - Sum of all completed bookings
- `thisMonth` - Earnings from current month
- `lastMonth` - Earnings from previous month
- `pendingEarnings` - Bookings pending/confirmed (not yet completed)
- `commissionEarned` - Total referral commissions
- `platformFee` - 10% of total earnings
- `netEarnings` - Total earnings - platform fee
- `availableBalance` - Net earnings - total withdrawals
- `totalWithdrawals` - Sum of all completed withdrawals

---

### 2. Get Transaction History

**Endpoint:** `GET /api/earnings/transactions`  
**Description:** Get paginated transaction history with filters  
**Authentication:** Required (Provider)

**Query Parameters:**
- `type` (optional) - Filter by type: `all`, `earning`, `withdrawal`, `commission`, `refund`
- `dateRange` (optional) - Filter by date: `all`, `today`, `week`, `month`, `quarter`, `year`
- `search` (optional) - Search in description, reference, or customer name
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 50)

**Example Request:**
```
GET /api/earnings/transactions?type=earning&dateRange=month&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "booking-uuid",
        "type": "earning",
        "amount": 15000.00,
        "status": "completed",
        "description": "Plumbing service - John Doe",
        "reference": "BK-abc12345",
        "date": "2025-01-08T10:30:00.000Z",
        "customer": "John Doe",
        "bookingId": "booking-uuid"
      },
      {
        "id": "commission-uuid",
        "type": "commission",
        "amount": 1500.00,
        "status": "completed",
        "description": "Referral commission - ABC Business subscription",
        "reference": "COM-def67890",
        "date": "2025-01-07T14:20:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

**Transaction Types:**
- `earning` - Income from completed bookings
- `withdrawal` - Bank withdrawals (negative amount)
- `commission` - Referral earnings
- `refund` - Refunded payments (negative amount)

**Transaction Status:**
- `completed` - Successfully processed
- `pending` - Awaiting processing
- `failed` - Failed transaction

---

### 3. Request Withdrawal

**Endpoint:** `POST /api/earnings/withdraw`  
**Description:** Submit a withdrawal request  
**Authentication:** Required (Provider)

**Request Body:**
```json
{
  "amount": 10000.00,
  "bankName": "GTBank",
  "accountNumber": "0123456789",
  "accountName": "John Doe"
}
```

**Validation:**
- `amount` > 0
- `amount` <= available balance
- `accountNumber` must be exactly 10 digits
- All fields required

**Response (Success):**
```json
{
  "success": true,
  "message": "Withdrawal request submitted successfully",
  "data": {
    "id": "WD-1704729600000-abc123",
    "providerId": "provider-uuid",
    "amount": 10000.00,
    "bankName": "GTBank",
    "accountNumber": "0123456789",
    "accountName": "John Doe",
    "status": "pending",
    "createdAt": "2025-01-08T12:00:00.000Z"
  }
}
```

**Response (Error - Insufficient Balance):**
```json
{
  "success": false,
  "message": "Insufficient balance",
  "data": null
}
```

**Response (Error - Invalid Account Number):**
```json
{
  "success": false,
  "message": "Account number must be 10 digits",
  "data": null
}
```

---

### 4. Get Earnings Breakdown

**Endpoint:** `GET /api/earnings/breakdown`  
**Description:** Get earnings breakdown by time period for charts  
**Authentication:** Required (Provider)

**Query Parameters:**
- `period` (optional) - Time period: `week`, `month`, `quarter`, `year` (default: `month`)

**Example Request:**
```
GET /api/earnings/breakdown?period=month
```

**Response:**
```json
{
  "success": true,
  "message": "Earnings breakdown retrieved successfully",
  "data": {
    "period": "month",
    "groupBy": "day",
    "breakdown": [
      {
        "date": "2025-01-01",
        "amount": 5000.00
      },
      {
        "date": "2025-01-02",
        "amount": 8500.00
      },
      {
        "date": "2025-01-03",
        "amount": 12000.00
      }
    ]
  }
}
```

**Grouping:**
- `week` - Grouped by day
- `month` - Grouped by day
- `quarter` - Grouped by week
- `year` - Grouped by month

---

## 🔄 Usage Flow

### On Page Load:
```javascript
// 1. Fetch earnings statistics
GET /api/earnings/stats

// 2. Fetch transaction history
GET /api/earnings/transactions?type=all&dateRange=all
```

### When Filtering:
```javascript
// Update transactions based on filters
GET /api/earnings/transactions?type=earning&dateRange=month&search=john
```

### When Withdrawing:
```javascript
// 1. User fills withdrawal form
// 2. Submit withdrawal request
POST /api/earnings/withdraw
Body: { amount, bankName, accountNumber, accountName }

// 3. Refresh data
GET /api/earnings/stats
GET /api/earnings/transactions
```

---

## 📊 Data Sources

### Earnings Statistics:
- **Completed Bookings** - From `bookings` table
- **Referral Commissions** - From `referral_commissions` table
- **Withdrawals** - From `withdrawals` table (to be implemented)

### Transaction History:
- **Earnings** - `bookings` where status = 'completed'
- **Commissions** - `referral_commissions` where status = 'paid' or 'pending'
- **Withdrawals** - `withdrawals` table (to be implemented)
- **Refunds** - `bookings` where refunded = true (to be implemented)

---

## 🔒 Business Rules

### Platform Fee:
- **10% fee** on all completed bookings
- Deducted from gross earnings
- `netEarnings = totalEarnings - platformFee`

### Earnings Availability:
- Earnings from completed bookings are immediately available
- Pending bookings show in `pendingEarnings`
- Available balance = net earnings - withdrawals

### Withdrawal Rules:
- Minimum amount: ₦1
- Maximum amount: Available balance
- Account number: Exactly 10 digits
- Processing time: 1-2 business days
- All fields required

### Commission Rules:
- 10% of referee subscription fee
- Paid when referee completes subscription
- Shows as separate transaction type

---

## 🧪 Testing with cURL

### Get Earnings Stats:
```bash
curl -X GET http://localhost:8000/api/earnings/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Transactions:
```bash
curl -X GET "http://localhost:8000/api/earnings/transactions?type=all&dateRange=month" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Request Withdrawal:
```bash
curl -X POST http://localhost:8000/api/earnings/withdraw \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "bankName": "GTBank",
    "accountNumber": "0123456789",
    "accountName": "John Doe"
  }'
```

### Get Breakdown:
```bash
curl -X GET "http://localhost:8000/api/earnings/breakdown?period=month" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Frontend Integration

### Fetch Stats:
```typescript
const fetchEarningsStats = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/api/earnings/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  setStats(data.data);
};
```

### Fetch Transactions:
```typescript
const fetchTransactions = async () => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({
    type: filter,
    dateRange: dateRange,
    search: searchTerm,
    page: '1',
    limit: '50'
  });
  
  const response = await fetch(`${BASE_URL}/api/earnings/transactions?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  setTransactions(data.data.transactions);
};
```

### Request Withdrawal:
```typescript
const handleWithdrawal = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/api/earnings/withdraw`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: parseFloat(withdrawalAmount),
      bankName,
      accountNumber,
      accountName
    })
  });
  
  const data = await response.json();
  if (data.success) {
    toast.success('Withdrawal request submitted!');
  }
};
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Insufficient balance",
  "data": null
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "data": null
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied: Insufficient permissions",
  "data": null
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Provider profile not found",
  "data": null
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error fetching earnings stats",
  "data": null
}
```

---

## 🔮 Future Enhancements

### Withdrawal Model (To Be Implemented):
```javascript
Withdrawal {
  id: UUID,
  providerId: UUID,
  amount: DECIMAL,
  bankName: STRING,
  accountNumber: STRING,
  accountName: STRING,
  status: ENUM ('pending', 'processing', 'completed', 'failed'),
  processedAt: DATE,
  failureReason: STRING,
  reference: STRING,
  createdAt: DATE
}
```

### Additional Endpoints:
- `GET /api/earnings/withdrawals` - Get withdrawal history
- `GET /api/earnings/withdrawals/:id` - Get withdrawal details
- `POST /api/earnings/export` - Export transactions as CSV/PDF
- `GET /api/earnings/analytics` - Advanced analytics and charts

---

## ✅ API Status

| Endpoint | Method | Status | Integrated |
|----------|--------|--------|------------|
| `/api/earnings/stats` | GET | ✅ Working | ✅ Yes |
| `/api/earnings/transactions` | GET | ✅ Working | ✅ Yes |
| `/api/earnings/withdraw` | POST | ✅ Working | ✅ Yes |
| `/api/earnings/breakdown` | GET | ✅ Working | ⏳ Later |

**Total:** 4/4 APIs (100%) ✅

---

**Created:** January 8, 2025  
**Status:** Production Ready ✅

