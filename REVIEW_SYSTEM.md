# Review System Documentation

## Overview
The review system allows customers to rate and review service providers after completing bookings. It includes comprehensive functionality for creating, managing, and displaying reviews with proper validation and notifications.

## Database Schema

### Review Model
```javascript
{
  id: UUID (Primary Key)
  bookingId: UUID (Foreign Key to Booking)
  reviewerId: UUID (Foreign Key to User)
  providerId: UUID (Foreign Key to ProviderProfile)
  rating: INTEGER (1-5)
  comment: TEXT (Optional)
  isVisible: BOOLEAN (Default: true)
  createdAt: DATE
  updatedAt: DATE
}
```

### ProviderProfile Model
```javascript
{
  id: UUID (Primary Key)
  userId: UUID (Foreign Key to User)
  businessName: STRING(200)
  category: STRING(100)
  subcategories: JSON
  bio: TEXT
  verificationStatus: ENUM('pending', 'verified', 'rejected')
  verifiedAt: DATE
  locationCity: STRING(100)
  locationState: STRING(100)
  latitude: DECIMAL(10,8)
  longitude: DECIMAL(11,8)
  portfolio: JSON
  createdAt: DATE
  updatedAt: DATE
}
```

### Important Design Decision
**Provider ratings are calculated dynamically** from the Review table rather than stored as separate fields. This ensures:
- **Data consistency** - No risk of rating fields getting out of sync
- **Real-time accuracy** - Ratings are always current
- **Simplified maintenance** - No need to update multiple fields when reviews change

### Associations
- Review belongs to Booking
- Review belongs to User (reviewer)
- Review belongs to ProviderProfile
- ProviderProfile has many Reviews
- User has many Reviews (as reviewer)

## API Endpoints

### Public Endpoints

#### GET /api/reviews/provider/:providerId
Get reviews for a specific provider with pagination and statistics.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `rating` (optional): Filter by specific rating (1-5)

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalReviews": 50,
      "hasNext": true,
      "hasPrev": false
    },
    "statistics": {
      "averageRating": 4.2,
      "totalReviews": 50,
      "ratingDistribution": {
        "5": 20,
        "4": 15,
        "3": 10,
        "2": 3,
        "1": 2
      }
    }
  }
}
```

#### GET /api/reviews/provider/:providerId/stats
Get review statistics for a provider.

**Response:**
```json
{
  "success": true,
  "data": {
    "averageRating": 4.2,
    "totalReviews": 50,
    "ratingDistribution": {
      "5": 20,
      "4": 15,
      "3": 10,
      "2": 3,
      "1": 2
    }
  }
}
```

#### GET /api/reviews/provider/:providerId/info
Get provider information with rating details included.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessName": "ABC Services",
    "category": "plumbing",
    "bio": "Professional plumbing services...",
    "verificationStatus": "verified",
    "locationCity": "Lagos",
    "locationState": "Lagos",
    "ratingInfo": {
      "averageRating": 4.2,
      "totalReviews": 50,
      "ratingDistribution": {
        "5": 20,
        "4": 15,
        "3": 10,
        "2": 3,
        "1": 2
      }
    }
  }
}
```

### Protected Endpoints (Require Authentication)

#### POST /api/reviews
Create a new review for a completed booking.

**Request Body:**
```json
{
  "bookingId": "uuid",
  "rating": 5,
  "comment": "Excellent service!"
}
```

**Validation Rules:**
- Booking must exist and belong to the reviewer
- Booking must be completed
- Rating must be between 1-5
- Only one review per booking allowed

**Response:**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": "uuid",
    "bookingId": "uuid",
    "reviewerId": "uuid",
    "providerId": "uuid",
    "rating": 5,
    "comment": "Excellent service!",
    "isVisible": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "reviewer": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "provider": {
      "id": "uuid",
      "businessName": "ABC Services",
      "category": "plumbing"
    },
    "booking": {
      "id": "uuid",
      "serviceType": "Pipe Repair",
      "scheduledAt": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

#### GET /api/reviews/my-reviews
Get reviews created by the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

#### DELETE /api/reviews/:reviewId
Delete a review (only by reviewer or admin).

### Admin Endpoints

#### GET /api/reviews/admin/all
Get all reviews with filters (admin only).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `providerId` (optional): Filter by provider
- `rating` (optional): Filter by rating
- `isVisible` (optional): Filter by visibility

#### PATCH /api/reviews/admin/:reviewId/visibility
Update review visibility (admin only).

**Request Body:**
```json
{
  "isVisible": false
}
```

## Business Logic

### Review Creation Process
1. Validate booking exists and belongs to reviewer
2. Check if booking is completed
3. Verify no existing review for the booking
4. Create review record
5. Send notification to provider
6. Return created review with associations

### Review Statistics Calculation
- **Average Rating**: Sum of all ratings divided by total reviews
- **Rating Distribution**: Count of reviews for each rating (1-5)
- **Total Reviews**: Count of visible reviews

### Notification System
When a review is created:
- Provider receives notification with rating and comment preview
- Notification includes action URL to view reviews
- Notification is sent via in-app and email channels

## Service Methods

### ReviewService.createReview(reviewData)
Creates a new review with validation and notifications.

### ReviewService.getProviderReviews(providerId, options)
Gets paginated reviews for a provider with statistics.

### ReviewService.getProviderRatingInfo(providerId)
Gets rating information for a provider (replaces old ratingAverage/ratingCount fields).

### ReviewService.getProviderWithRating(providerId)
Gets provider profile with rating information included.

### ReviewService.getProvidersWithRatings(providers)
Gets multiple providers with their rating information included.

### ReviewService.getUserReviews(userId, options)
Gets reviews created by a specific user.

### ReviewService.canReviewBooking(bookingId, userId)
Checks if a user can review a specific booking.

### ReviewService.getRecentReviews(limit)
Gets recent reviews across all providers.

### ReviewService.getTopRatedProviders(limit)
Gets top-rated providers based on average rating and review count.

## Error Handling

### Common Error Responses
- **400 Bad Request**: Invalid data, booking not completed, review already exists
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions (not reviewer or admin)
- **404 Not Found**: Booking or review not found
- **500 Internal Server Error**: Server-side errors

### Validation Errors
- Rating must be between 1-5
- Booking must belong to reviewer
- Booking must be completed
- Only one review per booking allowed

## Security Considerations

### Access Control
- Users can only review their own bookings
- Users can only delete their own reviews
- Admins can manage all reviews
- Public endpoints only show visible reviews

### Data Validation
- Input sanitization for comments
- Rating range validation
- Booking ownership verification
- Review uniqueness per booking

## Performance Optimizations

### Database Indexes
- `bookingId` index for quick booking lookups
- `reviewerId` index for user review queries
- `providerId` index for provider review queries
- `rating` index for rating-based filters

### Caching Strategy
- Provider statistics can be cached
- Recent reviews can be cached
- Top-rated providers can be cached

## Integration Points

### Booking System
- Reviews are linked to completed bookings
- Booking completion triggers review eligibility

### Notification System
- Review creation triggers provider notifications
- Notification preferences respected

### User Management
- Reviews are associated with user accounts
- User deletion considerations for review retention

## Future Enhancements

### Planned Features
- Review moderation system
- Review response from providers
- Review helpfulness voting
- Review photo attachments
- Review analytics dashboard
- Review export functionality

### API Versioning
- Current version: v1
- Backward compatibility maintained
- New features added incrementally



