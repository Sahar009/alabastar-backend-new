# Database Seeding Instructions

This document explains how to seed your database with sample provider data.

## Available Seeding Methods

### Method 1: Step-by-Step SQL Scripts (Recommended for troubleshooting)

If you're getting foreign key constraint errors, use the step-by-step approach:

```bash
# Connect to your MySQL database
mysql -u your_username -p your_database_name

# Run each step in order:
source step1-categories.sql
source step2-users.sql
source step3-profiles.sql
source step4-services.sql
```

### Method 2: Single SQL Script (If tables already exist)

If your database tables are already created and working:

```bash
# Connect to your MySQL database
mysql -u your_username -p your_database_name

# Run the simple script
source seed-providers-simple.sql
```

### Method 3: Node.js Script (Recommended for development)

Use the Node.js seeding script which handles all the relationships and data validation:

```bash
# Navigate to backend directory
cd backend

# Run the seeding script
npm run seed-providers
```

## What Gets Created

The seeding script creates the following data:

### 1. Service Categories (4 categories)
- Plumbing
- Electrical  
- Cleaning
- Carpentry

### 2. Provider Users (4 users)
- **John Adebayo** (Plumber) - Lagos
- **Sarah Johnson** (Electrician) - Abuja
- **Mike Wilson** (Cleaner) - Port Harcourt
- **Lisa Brown** (Carpenter) - Ibadan

### 3. Provider Profiles (4 profiles)
Each provider has:
- Professional bio
- Years of experience
- Hourly rates and starting prices
- Verification status (all verified)
- Location data (city, state, coordinates)
- Portfolio images
- Ratings and review counts

### 4. Services (12 services total)
Each provider has 3 services:
- **John (Plumbing)**: Emergency Pipe Repair, Faucet Installation, Drain Cleaning
- **Sarah (Electrical)**: Electrical Wiring, Outlet Installation, Lighting Installation
- **Mike (Cleaning)**: House Cleaning, Office Cleaning, Post-Construction Cleanup
- **Lisa (Carpentry)**: Custom Furniture, Cabinet Installation, Furniture Repair

### 5. Reviews (5 sample reviews)
Sample customer reviews with ratings for each provider.

## Provider Login Credentials

All providers can login with:
- **Password**: `password123`
- **Email**: Use the email addresses from the provider data

## Sample Provider Data

### John Adebayo (Plumber)
- **Email**: john.adebayo@example.com
- **Phone**: +2348012345678
- **Location**: Lagos, Lagos
- **Experience**: 8 years
- **Hourly Rate**: ₦3,500
- **Rating**: 4.8/5 (127 reviews)

### Sarah Johnson (Electrician)
- **Email**: sarah.johnson@example.com
- **Phone**: +2348023456789
- **Location**: Abuja, FCT
- **Experience**: 6 years
- **Hourly Rate**: ₦4,000
- **Rating**: 4.9/5 (89 reviews)

### Mike Wilson (Cleaner)
- **Email**: mike.wilson@example.com
- **Phone**: +2348034567890
- **Location**: Port Harcourt, Rivers
- **Experience**: 5 years
- **Hourly Rate**: ₦2,500
- **Rating**: 4.7/5 (156 reviews)

### Lisa Brown (Carpenter)
- **Email**: lisa.brown@example.com
- **Phone**: +2348045678901
- **Location**: Ibadan, Oyo
- **Experience**: 10 years
- **Hourly Rate**: ₦4,500
- **Rating**: 4.9/5 (203 reviews)

## Customizing the Data

To add your own provider URLs or modify the data:

1. **Edit the Node.js script** (`seed-providers.js`):
   - Update the `avatarUrl` field in the providers array
   - Modify the `portfolio` array in the profiles array
   - Update the `photos` array in the services array

2. **Edit the SQL script** (`seed-providers.sql`):
   - Update the `avatarUrl` values in the users INSERT
   - Modify the `portfolio` JSON in the provider_profiles INSERT
   - Update the `photos` JSON in the services INSERT

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure your database is running
   - Check your database credentials in `.env`
   - Verify the database exists

2. **Duplicate Key Error**
   - The scripts use `findOrCreate` to avoid duplicates
   - If you get duplicate errors, clear the existing data first

3. **Permission Error**
   - Ensure your database user has INSERT permissions
   - Check that all required tables exist

### Clearing Existing Data

To clear the seeded data and start fresh:

```sql
-- Clear reviews
DELETE FROM reviews WHERE providerId IN ('profile-1', 'profile-2', 'profile-3', 'profile-4');

-- Clear services
DELETE FROM services WHERE providerId IN ('profile-1', 'profile-2', 'profile-3', 'profile-4');

-- Clear provider profiles
DELETE FROM provider_profiles WHERE id IN ('profile-1', 'profile-2', 'profile-3', 'profile-4');

-- Clear provider users
DELETE FROM users WHERE id IN ('user-provider-1', 'user-provider-2', 'user-provider-3', 'user-provider-4');

-- Clear service categories
DELETE FROM service_categories WHERE id IN ('cat-1', 'cat-2', 'cat-3', 'cat-4');
```

## Next Steps

After seeding:

1. **Test the API endpoints** to ensure providers are returned correctly
2. **Test the frontend** to see providers displayed in the UI
3. **Add more providers** by modifying the scripts or using the API
4. **Test booking functionality** with the seeded providers

## API Testing

You can test the seeded data using these endpoints:

```bash
# Get all providers
GET /api/providers/search

# Get providers by category
GET /api/providers/category/plumbing

# Get specific provider profile
GET /api/providers/profile/profile-1
```
