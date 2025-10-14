# Favorites/Saved Providers API Documentation

## Overview

The Favorites API allows users to save their favorite service providers for quick access later. Users can add providers to favorites, remove them, view all favorites, and check favorite status.

## Base URL

```
http://localhost:8000/api/favorites
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Add Provider to Favorites

**POST** `/api/favorites`

Add a provider to the user's favorites list.

#### Request Body

```json
{
  "providerId": "uuid-of-provider"
}
```

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Provider added to favorites successfully",
  "data": {
    "id": "favorite-uuid",
    "userId": "user-uuid",
    "providerId": "provider-uuid",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

**400 Bad Request** - Missing provider ID
```json
{
  "success": false,
  "message": "Provider ID is required"
}
```

**400 Bad Request** - Already favorited
```json
{
  "success": false,
  "message": "Provider is already in favorites"
}
```

**404 Not Found** - Provider doesn't exist
```json
{
  "success": false,
  "message": "Provider not found"
}
```

---

### 2. Remove Provider from Favorites

**DELETE** `/api/favorites/:providerId`

Remove a provider from the user's favorites list.

#### URL Parameters

- `providerId` (string, required) - UUID of the provider to remove

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Provider removed from favorites successfully"
}
```

#### Error Responses

**404 Not Found** - Favorite doesn't exist
```json
{
  "success": false,
  "message": "Favorite not found"
}
```

---

### 3. Get All User Favorites

**GET** `/api/favorites`

Retrieve all favorite providers for the authenticated user with pagination and filtering.

#### Query Parameters

- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 10)
- `category` (string, optional) - Filter by provider category
- `location` (string, optional) - Filter by location (city or state)
- `search` (string, optional) - Search in business name, bio, or category

#### Example Request

```
GET /api/favorites?page=1&limit=10&category=plumbing&location=Lagos
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Favorites retrieved successfully",
  "data": {
    "favorites": [
      {
        "id": "favorite-uuid",
        "providerId": "provider-uuid",
        "savedAt": "2024-01-15T10:30:00.000Z",
        "provider": {
          "id": "provider-uuid",
          "userId": "user-uuid",
          "businessName": "Premium Plumbing Services",
          "category": "plumbing",
          "subcategories": ["pipe repair", "leak fixing"],
          "locationCity": "Lagos",
          "locationState": "Lagos State",
          "startingPrice": 5000,
          "hourlyRate": 2000,
          "bio": "Professional plumbing services with 10 years experience",
          "verificationStatus": "verified",
          "isAvailable": true,
          "yearsOfExperience": 10,
          "User": {
            "id": "user-uuid",
            "fullName": "John Doe",
            "email": "john@example.com",
            "phone": "+2348012345678",
            "avatarUrl": "https://example.com/avatar.jpg"
          }
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 48,
      "itemsPerPage": 10
    }
  }
}
```

---

### 4. Check Favorite Status

**GET** `/api/favorites/check/:providerId`

Check if a specific provider is in the user's favorites.

#### URL Parameters

- `providerId` (string, required) - UUID of the provider to check

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "isFavorited": true,
    "providerId": "provider-uuid"
  }
}
```

---

### 5. Get Favorite Count

**GET** `/api/favorites/count`

Get the total number of favorites for the authenticated user.

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "count": 12
  }
}
```

---

### 6. Bulk Check Favorite Status

**POST** `/api/favorites/bulk-check`

Check favorite status for multiple providers at once.

#### Request Body

```json
{
  "providerIds": [
    "provider-uuid-1",
    "provider-uuid-2",
    "provider-uuid-3"
  ]
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "provider-uuid-1": true,
    "provider-uuid-2": false,
    "provider-uuid-3": true
  }
}
```

#### Error Responses

**400 Bad Request** - Invalid request
```json
{
  "success": false,
  "message": "Provider IDs array is required"
}
```

---

### 7. Toggle Favorite Status

**POST** `/api/favorites/toggle`

Toggle favorite status for a provider (add if not favorited, remove if already favorited).

#### Request Body

```json
{
  "providerId": "provider-uuid"
}
```

#### Success Response (200 OK)

When adding to favorites:
```json
{
  "success": true,
  "message": "Provider added to favorites",
  "data": {
    "action": "added",
    "isFavorited": true,
    "providerId": "provider-uuid"
  }
}
```

When removing from favorites:
```json
{
  "success": true,
  "message": "Provider removed from favorites",
  "data": {
    "action": "removed",
    "isFavorited": false,
    "providerId": "provider-uuid"
  }
}
```

---

## Database Schema

### saved_providers Table

```sql
CREATE TABLE saved_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider_id)
);

CREATE INDEX idx_saved_providers_provider_id ON saved_providers(provider_id);
```

---

## Usage Examples

### JavaScript/TypeScript (Frontend)

```javascript
// Add to favorites
const addToFavorites = async (providerId) => {
  try {
    const response = await fetch('http://localhost:8000/api/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ providerId })
    });
    
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error adding to favorites:', error);
  }
};

// Remove from favorites
const removeFromFavorites = async (providerId) => {
  try {
    const response = await fetch(`http://localhost:8000/api/favorites/${providerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error removing from favorites:', error);
  }
};

// Get all favorites
const getFavorites = async (page = 1, limit = 10) => {
  try {
    const response = await fetch(
      `http://localhost:8000/api/favorites?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error fetching favorites:', error);
  }
};

// Check if favorited
const checkFavoriteStatus = async (providerId) => {
  try {
    const response = await fetch(
      `http://localhost:8000/api/favorites/check/${providerId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    return data.data.isFavorited;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

// Toggle favorite
const toggleFavorite = async (providerId) => {
  try {
    const response = await fetch('http://localhost:8000/api/favorites/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ providerId })
    });
    
    const data = await response.json();
    console.log(`Favorite ${data.data.action}:`, data.data.isFavorited);
    return data.data;
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
};

// Bulk check favorites (useful for provider lists)
const checkMultipleFavorites = async (providerIds) => {
  try {
    const response = await fetch('http://localhost:8000/api/favorites/bulk-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ providerIds })
    });
    
    const data = await response.json();
    return data.data; // Returns object with providerId: boolean mapping
  } catch (error) {
    console.error('Error checking bulk favorites:', error);
    return {};
  }
};
```

---

## Common Use Cases

### 1. Provider Card with Favorite Button

```jsx
const ProviderCard = ({ provider, token }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    // Check if favorited on mount
    checkFavoriteStatus(provider.id).then(setIsFavorited);
  }, [provider.id]);

  const handleToggleFavorite = async () => {
    const result = await toggleFavorite(provider.id);
    setIsFavorited(result.isFavorited);
  };

  return (
    <div className="provider-card">
      <h3>{provider.businessName}</h3>
      <button onClick={handleToggleFavorite}>
        {isFavorited ? '❤️ Favorited' : '🤍 Add to Favorites'}
      </button>
    </div>
  );
};
```

### 2. Provider List with Bulk Favorite Check

```jsx
const ProviderList = ({ providers, token }) => {
  const [favoriteMap, setFavoriteMap] = useState({});

  useEffect(() => {
    // Check all providers at once
    const providerIds = providers.map(p => p.id);
    checkMultipleFavorites(providerIds).then(setFavoriteMap);
  }, [providers]);

  return (
    <div className="provider-list">
      {providers.map(provider => (
        <ProviderCard 
          key={provider.id}
          provider={provider}
          isFavorited={favoriteMap[provider.id] || false}
        />
      ))}
    </div>
  );
};
```

### 3. Favorites Page

```jsx
const FavoritesPage = ({ token }) => {
  const [favorites, setFavorites] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getFavorites(currentPage, 10).then(data => {
      setFavorites(data.favorites);
      setPagination(data.pagination);
    });
  }, [currentPage]);

  return (
    <div className="favorites-page">
      <h1>My Favorite Providers</h1>
      <div className="favorites-list">
        {favorites.map(fav => (
          <ProviderCard 
            key={fav.id}
            provider={fav.provider}
            savedAt={fav.savedAt}
          />
        ))}
      </div>
      <Pagination 
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development mode)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Resource not found
- `500` - Internal server error

---

## Rate Limiting

There are no rate limits currently implemented for favorites endpoints. However, it's recommended to implement caching on the frontend for better performance:

- Cache favorite status for 5-10 minutes
- Use bulk check for lists instead of individual checks
- Debounce toggle actions to prevent rapid clicking

---

## Best Practices

1. **Use Toggle Instead of Add/Remove**: The toggle endpoint is recommended for UI interactions as it handles both states.

2. **Bulk Check for Lists**: When displaying multiple providers, use the bulk check endpoint instead of checking each provider individually.

3. **Optimistic UI Updates**: Update the UI immediately when toggling favorites, then sync with the server response.

4. **Cache Favorite Status**: Store favorite status in local state to avoid unnecessary API calls.

5. **Handle Errors Gracefully**: Always handle errors and provide user feedback.

---

## Security Considerations

- All endpoints require authentication
- Users can only manage their own favorites
- Cascade delete: If a user or provider is deleted, related favorites are automatically removed
- Unique constraint prevents duplicate favorites
- SQL injection protection via Sequelize ORM

---

## Migration

If you need to create the table manually:

```sql
-- Create table
CREATE TABLE IF NOT EXISTS saved_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT saved_providers_user_provider_unique UNIQUE (user_id, provider_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_providers_user_id ON saved_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_providers_provider_id ON saved_providers(provider_id);

-- Add updated_at trigger (PostgreSQL)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_providers_updated_at BEFORE UPDATE ON saved_providers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Support

For issues or questions about the Favorites API, please contact the development team or create an issue in the project repository.


