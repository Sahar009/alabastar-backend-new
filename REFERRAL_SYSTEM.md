# Provider Referral System Documentation

## Overview

The Provider Referral System allows existing providers to refer new providers and earn commissions when their referrals subscribe to paid plans. This system incentivizes growth and helps providers build their network while earning additional income.

## Key Features

- **Unique Referral Codes**: Each provider gets a unique referral code
- **Commission Tracking**: Automatic commission calculation and tracking
- **Referral Statistics**: Comprehensive stats for referrers
- **Payment Processing**: Commission payout system
- **Top Referrers**: Leaderboard for top-performing referrers

## Database Schema

### ProviderProfile Updates
- `referralCode`: Unique referral code for the provider
- `referredBy`: ID of the provider who referred this provider
- `totalReferrals`: Total number of successful referrals
- `totalCommissionsEarned`: Total commissions earned from referrals
- `referralSettings`: JSON field for referral preferences

### ProviderReferral Table
Tracks individual referrals between providers:
- `referrerId`: Provider who made the referral
- `refereeId`: Provider who was referred
- `referralCode`: Code used for the referral
- `status`: pending, completed, cancelled
- `commissionRate`: Commission percentage (default 10%)
- `completedAt`: When referral was completed
- `subscriptionId`: Subscription that triggered commission

### ReferralCommission Table
Tracks commission payments:
- `referralId`: Reference to the referral
- `referrerId`: Provider who earned commission
- `subscriptionId`: Subscription that generated commission
- `subscriptionAmount`: Original subscription amount
- `commissionRate`: Commission percentage applied
- `commissionAmount`: Calculated commission amount
- `status`: pending, paid, cancelled
- `paidAt`: When commission was paid
- `paymentMethod`: How commission was paid

## API Endpoints

### Public Endpoints

#### GET `/api/referrals/code/:referralCode`
Get details about a referral code (public).

**Response:**
```json
{
  "success": true,
  "data": {
    "referrer": {
      "id": "uuid",
      "businessName": "Provider Name",
      "category": "plumbing",
      "referralCode": "PROV1234",
      "totalReferrals": 5
    }
  }
}
```

#### GET `/api/referrals/top-referrers?limit=10`
Get top referrers leaderboard.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "businessName": "Top Provider",
      "category": "electrical",
      "totalReferrals": 25,
      "totalCommissionsEarned": 1500.00
    }
  ]
}
```

### Protected Endpoints (Require Authentication)

#### POST `/api/referrals/process`
Process a referral when a new provider signs up.

**Request Body:**
```json
{
  "referralCode": "PROV1234"
}
```

**Response:**
```json
{
  "success": true,
  "referral": {
    "id": "uuid",
    "referrerId": "uuid",
    "refereeId": "uuid",
    "referralCode": "PROV1234",
    "status": "pending"
  },
  "referrer": {
    "id": "uuid",
    "businessName": "Referrer Name",
    "referralCode": "PROV1234"
  },
  "message": "Referral processed successfully"
}
```

#### POST `/api/referrals/generate/:providerId`
Generate a referral code for a provider.

**Response:**
```json
{
  "success": true,
  "referralCode": "PROV1234",
  "message": "Referral code created successfully"
}
```

#### GET `/api/referrals/stats/:providerId`
Get comprehensive referral statistics for a provider.

**Response:**
```json
{
  "success": true,
  "data": {
    "provider": {
      "id": "uuid",
      "businessName": "Provider Name",
      "referralCode": "PROV1234",
      "totalReferrals": 5,
      "totalCommissionsEarned": 250.00
    },
    "stats": {
      "totalReferrals": 5,
      "completedReferrals": 3,
      "pendingReferrals": 2,
      "totalCommissions": 250.00,
      "pendingCommissions": 100.00,
      "paidCommissions": 150.00
    },
    "referralsMade": [...],
    "commissions": [...]
  }
}
```

#### GET `/api/referrals/referrals/:providerId`
Get all referrals made by a provider.

#### GET `/api/referrals/commissions/:providerId`
Get all commissions earned by a provider.

### Admin Endpoints

#### POST `/api/referrals/pay/:commissionId`
Pay out a commission (admin only).

**Request Body:**
```json
{
  "paymentMethod": "wallet",
  "paymentReference": "PAY123456"
}
```

## Business Logic

### Referral Code Generation
- Codes are generated using business name prefix + random suffix
- Format: `BUSINESS_NAME_PREFIX + RANDOM_4_CHARS`
- Example: `PLUM1234` for "Plumber Pro"
- Fallback to UUID-based code if conflicts occur

### Commission Calculation
- Default commission rate: 10%
- Commission = (Subscription Amount × Commission Rate) / 100
- Example: ₦10,000 subscription × 10% = ₦1,000 commission

### Referral Process Flow
1. **Provider Registration**: New provider enters referral code during signup
2. **Referral Creation**: System creates referral record with "pending" status
3. **Subscription**: When referee subscribes to a paid plan
4. **Commission Processing**: System automatically calculates and records commission
5. **Status Update**: Referral status changes to "completed"
6. **Stats Update**: Referrer's stats are updated

### Commission Payment Flow
1. **Commission Generated**: When referee subscribes
2. **Pending Status**: Commission starts as "pending"
3. **Admin Review**: Admin reviews and approves payment
4. **Payment Processing**: Commission is paid via chosen method
5. **Status Update**: Commission status changes to "paid"

## Integration Points

### Provider Registration
When a new provider registers with a referral code:
```javascript
// In provider registration logic
if (referralCode) {
  await ReferralService.processReferral(providerId, referralCode);
}
```

### Subscription Creation
When a provider subscribes to a plan:
```javascript
// In subscription creation logic
const subscription = await SubscriptionService.createSubscription(providerId, planId);
// This automatically triggers commission processing
```

### Provider Profile Updates
When a provider profile is created:
```javascript
// Generate referral code for new provider
await ReferralService.createReferralCode(providerId);
```

## Usage Examples

### Frontend Integration

#### Generate Referral Code
```javascript
const generateReferralCode = async (providerId) => {
  const response = await fetch(`/api/referrals/generate/${providerId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Process Referral During Signup
```javascript
const processReferral = async (referralCode) => {
  const response = await fetch('/api/referrals/process', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ referralCode })
  });
  return response.json();
};
```

#### Get Referral Stats
```javascript
const getReferralStats = async (providerId) => {
  const response = await fetch(`/api/referrals/stats/${providerId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## Configuration

### Commission Rates
Default commission rate is 10%, but can be customized per referral:
- Set in `ProviderReferral.commissionRate` field
- Can be modified based on business rules
- Different rates for different subscription plans possible

### Referral Code Format
- Configurable in `ReferralService.generateReferralCode()`
- Current format: Business name prefix + 4 random characters
- Can be customized for different requirements

## Security Considerations

- Referral codes are unique and non-guessable
- Providers can only access their own referral data
- Admin endpoints require admin role
- Commission payments require admin approval
- All API endpoints are properly authenticated

## Monitoring and Analytics

### Key Metrics to Track
- Total referrals made
- Referral conversion rate
- Total commissions earned
- Average commission per referral
- Top performing referrers
- Commission payment status

### Reporting
- Monthly referral reports
- Commission payout reports
- Top referrer leaderboards
- Referral performance analytics

## Future Enhancements

- **Tiered Commission Rates**: Different rates based on referral count
- **Bonus Commissions**: Extra commissions for milestones
- **Referral Links**: Shareable referral links with tracking
- **Social Media Integration**: Share referral codes on social platforms
- **Mobile App Integration**: Push notifications for referral updates
- **Advanced Analytics**: Detailed referral performance metrics
