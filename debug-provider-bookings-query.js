import { Booking, User, ProviderProfile, Service } from './schema/index.js';
import sequelize from './database/db.js';
import { Op } from 'sequelize';

// Test with a real provider that should have bookings
async function debugProviderBookingsQuery() {
  try {
    console.log('='.repeat(80));
    console.log('DEBUGGING PROVIDER BOOKINGS QUERY');
    console.log('='.repeat(80));
    console.log('');

    // First, find a provider that has bookings
    console.log('Step 1: Finding providers with bookings...\n');
    
    const bookingsWithProviders = await Booking.findAll({
      include: [{
        model: ProviderProfile,
        as: 'providerProfile',
        attributes: ['id', 'userId', 'businessName'],
        required: true
      }],
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    if (bookingsWithProviders.length === 0) {
      console.log('❌ No bookings found with valid providers!');
      return;
    }

    // Test with the first provider that has bookings
    const testBooking = bookingsWithProviders[0];
    const testProviderProfileId = testBooking.providerId;
    const testProviderProfile = testBooking.providerProfile;
    const testUserId = testProviderProfile.userId;

    console.log(`Using test provider:`);
    console.log(`  ProviderProfile.id: ${testProviderProfileId}`);
    console.log(`  User.id: ${testUserId}`);
    console.log(`  Business Name: ${testProviderProfile.businessName}`);
    console.log(`  Test Booking ID: ${testBooking.id}`);
    console.log(`  Test Booking Status: ${testBooking.status}\n`);

    // Step 2: Simulate what getBookings does
    console.log('='.repeat(80));
    console.log('Step 2: Simulating getBookings query logic');
    console.log('='.repeat(80));
    console.log('');

    console.log(`Looking up ProviderProfile by userId: ${testUserId}`);
    const lookupProfile = await ProviderProfile.findOne({
      where: { userId: testUserId }
    });

    if (!lookupProfile) {
      console.error('❌ ProviderProfile not found by userId lookup!');
      return;
    }

    console.log(`✅ Found ProviderProfile: ${lookupProfile.id}`);
    console.log(`   Matches test booking's providerId? ${lookupProfile.id === testProviderProfileId ? '✅ YES' : '❌ NO'}\n`);

    if (lookupProfile.id !== testProviderProfileId) {
      console.error('⚠️  MISMATCH: ProviderProfile.id from lookup does not match booking.providerId!');
      console.error(`   This means bookings were created with a different providerId!\n`);
    }

    // Step 3: Query bookings using the same logic as getBookings
    console.log('='.repeat(80));
    console.log('Step 3: Querying bookings with getBookings logic');
    console.log('='.repeat(80));
    console.log('');

    const whereClause = {
      providerId: lookupProfile.id
    };

    const includeClause = [
      {
        model: User,
        as: 'customer',
        attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
      },
      {
        model: ProviderProfile,
        as: 'providerProfile',
        include: [{ model: User, attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl'] }]
      },
      {
        model: Service,
        as: 'service',
        attributes: ['id', 'title', 'description', 'pricingType', 'basePrice'],
        required: false
      }
    ];

    console.log(`Query whereClause:`, JSON.stringify(whereClause, null, 2));
    console.log('');

    // Count query
    const countResult = await Booking.count({
      where: whereClause
    });
    console.log(`✅ Raw count (no includes): ${countResult} bookings`);

    // Count with includes
    const countWithIncludes = await Booking.findAndCountAll({
      where: whereClause,
      include: includeClause
    });
    console.log(`✅ Count with includes: ${countWithIncludes.count} bookings`);
    console.log(`✅ Retrieved rows: ${countWithIncludes.rows.length} bookings\n`);

    if (countResult > 0 && countWithIncludes.count === 0) {
      console.error('⚠️  PROBLEM FOUND: Raw count shows bookings, but with includes returns 0!');
      console.error('   This suggests an include is filtering out bookings.\n');
    }

    // Step 4: Check each include individually
    console.log('='.repeat(80));
    console.log('Step 4: Testing includes individually');
    console.log('='.repeat(80));
    console.log('');

    // Test with just customer include
    const withCustomer = await Booking.count({
      where: whereClause,
      include: [{
        model: User,
        as: 'customer',
        required: true
      }]
    });
    console.log(`With customer include (required: true): ${withCustomer}`);

    // Test with just providerProfile include
    const withProviderProfile = await Booking.count({
      where: whereClause,
      include: [{
        model: ProviderProfile,
        as: 'providerProfile',
        required: true
      }]
    });
    console.log(`With providerProfile include (required: true): ${withProviderProfile}`);

    // Test with providerProfile include (not required)
    const withProviderProfileOptional = await Booking.count({
      where: whereClause,
      include: [{
        model: ProviderProfile,
        as: 'providerProfile',
        required: false
      }]
    });
    console.log(`With providerProfile include (required: false): ${withProviderProfileOptional}\n`);

    // Step 5: Get actual bookings
    if (countWithIncludes.rows.length > 0) {
      console.log('='.repeat(80));
      console.log('Step 5: Retrieved Bookings');
      console.log('='.repeat(80));
      console.log('');

      countWithIncludes.rows.forEach((booking, index) => {
        console.log(`Booking ${index + 1}:`);
        console.log(`  ID: ${booking.id}`);
        console.log(`  Status: ${booking.status}`);
        console.log(`  ProviderId: ${booking.providerId}`);
        console.log(`  Customer: ${booking.customer?.fullName || 'N/A'}`);
        console.log(`  Provider: ${booking.providerProfile?.businessName || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No bookings retrieved with the query!\n');
      
      // Check if bookings exist with different structure
      console.log('Checking for bookings with different providerId...');
      const allBookingsForProvider = await Booking.findAll({
        where: {
          [Op.or]: [
            { providerId: lookupProfile.id },
            { providerId: testUserId }
          ]
        },
        limit: 5
      });
      
      console.log(`Found ${allBookingsForProvider.length} bookings with either providerId`);
      allBookingsForProvider.forEach(booking => {
        console.log(`  - Booking ${booking.id}: providerId=${booking.providerId}, status=${booking.status}`);
      });
    }

    console.log('='.repeat(80));
    console.log('DEBUG COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

debugProviderBookingsQuery();

