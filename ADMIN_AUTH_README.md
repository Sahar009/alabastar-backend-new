# Admin Authentication System

A comprehensive admin authentication and management system for the Alabastar platform.

## Features

### 🔐 **Authentication**
- Admin login with JWT tokens
- Password hashing with bcrypt
- Token verification and refresh
- Role-based access control
- Rate limiting for admin routes

### 👥 **User Management**
- View all users with pagination
- Search and filter users
- Update user status (active/inactive/suspended)
- View detailed user profiles
- Track user activity

### 🔧 **Provider Management**
- Manage service providers
- Verify/unverify providers
- View provider profiles and ratings
- Track provider earnings
- Monitor provider activity

### 📅 **Booking Management**
- View all bookings
- Update booking status
- Monitor booking trends
- Track customer-provider interactions

### ⭐ **Review Management**
- Moderate customer reviews
- Approve/reject reviews
- Flag inappropriate content
- Track review statistics

### 🔔 **Notification System**
- Send notifications to users
- Target specific user groups
- Manage notification preferences
- Track notification delivery

### 📊 **Analytics Dashboard**
- Platform statistics
- User growth metrics
- Revenue tracking
- Activity monitoring

## API Endpoints

### Authentication Routes (`/api/admin/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | Admin login | No |
| POST | `/create` | Create admin user | No |
| GET | `/verify` | Verify admin token | No |
| GET | `/profile` | Get admin profile | Yes |
| PUT | `/profile` | Update admin profile | Yes |
| PUT | `/change-password` | Change admin password | Yes |

### Management Routes (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard/stats` | Dashboard statistics | Yes |
| GET | `/users` | Get all users | Yes |
| GET | `/users/:id` | Get user details | Yes |
| PUT | `/users/:id/status` | Update user status | Yes |
| GET | `/providers` | Get all providers | Yes |
| PUT | `/providers/:id/verify` | Verify provider | Yes |
| GET | `/bookings` | Get all bookings | Yes |
| PUT | `/bookings/:id/status` | Update booking status | Yes |
| GET | `/reviews` | Get all reviews | Yes |
| PUT | `/reviews/:id/status` | Update review status | Yes |
| POST | `/notifications/send` | Send notification | Yes |
| POST | `/create-admin` | Create admin user | Super Admin |

## Setup Instructions

### 1. **Install Dependencies**
```bash
cd backend
npm install
```

### 2. **Create Initial Admin User**
```bash
npm run setup-admin
```

This will create an admin user with:
- **Email**: admin@alabastar.com
- **Password**: admin123

### 3. **Environment Variables**
Make sure your `.env` file includes:
```env
JWT_SECRET=your-secret-key
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
```

### 4. **Start the Server**
```bash
npm run dev
```

## Authentication Flow

### 1. **Admin Login**
```javascript
// POST /api/admin/auth/login
{
  "email": "admin@alabastar.com",
  "password": "admin123"
}

// Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "uuid",
      "fullName": "Alabastar Admin",
      "email": "admin@alabastar.com",
      "role": "admin"
    }
  }
}
```

### 2. **Using Admin Token**
```javascript
// Include token in headers
headers: {
  'Authorization': 'Bearer your-jwt-token',
  'Content-Type': 'application/json'
}
```

### 3. **Token Verification**
```javascript
// GET /api/admin/auth/verify
// Returns admin info if token is valid
```

## Middleware

### **authenticateAdmin**
- Verifies JWT token
- Checks admin role
- Ensures user is active
- Adds admin info to request

### **authenticateSuperAdmin**
- Same as authenticateAdmin
- Additional check for super admin privileges
- Required for critical operations

### **adminRateLimit**
- Limits requests to 100 per minute per admin
- Prevents abuse and DDoS attacks

## Security Features

### 🔒 **Password Security**
- bcrypt hashing with salt rounds
- Password strength validation
- Secure password change flow

### 🛡️ **Token Security**
- JWT tokens with expiration
- Role-based token validation
- Secure token verification

### 🚫 **Rate Limiting**
- Request rate limiting
- Per-admin rate tracking
- Abuse prevention

### 🔐 **Access Control**
- Role-based permissions
- Super admin privileges
- Secure route protection

## Database Schema

The admin system uses the existing `User` model with:
- `role: 'admin'` for admin users
- `status: 'active'` for active admins
- Standard user fields (email, password, etc.)

## Error Handling

All endpoints return consistent error responses:
```javascript
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

## Testing

### **Test Admin Login**
```bash
curl -X POST http://localhost:8000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alabastar.com","password":"admin123"}'
```

### **Test Protected Route**
```bash
curl -X GET http://localhost:8000/api/admin/dashboard/stats \
  -H "Authorization: Bearer your-jwt-token"
```

## Frontend Integration

The admin dashboard frontend can integrate with these endpoints:

1. **Login**: Use `/api/admin/auth/login`
2. **Token Storage**: Store JWT in localStorage
3. **API Calls**: Include token in Authorization header
4. **Token Refresh**: Use `/api/admin/auth/verify` to check validity

## Production Considerations

### **Security**
- Use strong JWT secrets
- Enable HTTPS
- Implement proper CORS
- Use environment variables

### **Performance**
- Implement Redis for rate limiting
- Add database indexing
- Use connection pooling
- Monitor API performance

### **Monitoring**
- Log all admin actions
- Monitor failed login attempts
- Track API usage
- Set up alerts

## Troubleshooting

### **Common Issues**

1. **"Admin user not found"**
   - Run `npm run setup-admin`
   - Check database connection

2. **"Invalid token"**
   - Check JWT_SECRET in .env
   - Verify token format

3. **"Access denied"**
   - Check user role and status
   - Verify token expiration

### **Debug Mode**
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=admin:*
```

---

**Built with ❤️ for Alabastar Admin Team**





