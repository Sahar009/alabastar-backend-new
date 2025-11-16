import { User, ProviderProfile, Booking } from './schema/index.js';
import sequelize from './database/db.js';
import jwt from 'jsonwebtoken';
import { getBookings } from './services/bookingService.js';

// Test with the provider email
const TEST_EMAIL = 'dev68@mail.com';

async function testFullAPIFlow() {
  try {
    console.log('='.repeat(80));
    console.log('TESTING FULL API FLOW (Login → Get Bookings)');
    console.log('='.repeat(80));
    console.log(`\nTest Email: ${TEST_EMAIL}\n`);

    // Step 1: Find user (simulating login)
    console.log('='.repeat(80));
    console.log('Step 1: Finding User (Simulating Login)');
    console.log('='.repeat(80));
    console.log('');

    const user = await User.findOne({
      where: { email: TEST_EMAIL }
    });

    if (!user) {
      console.error(`❌ User not found with email: ${TEST_EMAIL}`);
      return;
    }

    console.log('✅ User Found:');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Full Name: ${user.fullName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}\n`);

    // Step 2: Create JWT token (as authService does)
    console.log('='.repeat(80));
    console.log('Step 2: Creating JWT Token (As Login Does)');
    console.log('='.repeat(80));
    console.log('');

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Token Created');
    console.log(`   Token (first 50 chars): ${token.substring(0, 50)}...\n`);

    // Step 3: Decode token (as authMiddleware does)
    console.log('='.repeat(80));
    console.log('Step 3: Decoding Token (As Auth Middleware Does)');
    console.log('='.repeat(80));
    console.log('');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    console.log('✅ Token Decoded:');
    console.log(`   decoded.userId: ${decoded.userId}`);
    console.log(`   decoded.email: ${decoded.email}`);
    console.log(`   decoded.role: ${decoded.role}`);
    console.log(`   ✅ Matches user.id? ${decoded.userId === user.id ? 'YES' : 'NO'}\n`);

    if (decoded.userId !== user.id) {
      console.error('❌ ERROR: Token userId does not match user.id!');
      return;
    }

    // Step 4: Get provider profile (as bookingService does)
    console.log('='.repeat(80));
    console.log('Step 4: Getting Provider Profile');
    console.log('='.repeat(80));
    console.log('');

    const providerProfile = await ProviderProfile.findOne({
      where: { userId: decoded.userId }
    });

    if (!providerProfile) {
      console.error('❌ Provider Profile not found for this user!');
      console.log('   This user might not have a provider profile yet.\n');
      
      // Check if there are any bookings anyway
      const directBookings = await Booking.findAll({
        where: { providerId: decoded.userId },
        limit: 5
      });
      
      if (directBookings.length > 0) {
        console.log(`⚠️  WARNING: Found ${directBookings.length} bookings with providerId = userId (data inconsistency!)`);
        directBookings.forEach(b => {
          console.log(`   Booking ${b.id}: providerId=${b.providerId}, status=${b.status}`);
        });
      }
      
      return;
    }

    console.log('✅ Provider Profile Found:');
    console.log(`   Provider Profile ID: ${providerProfile.id}`);
    console.log(`   Business Name: ${providerProfile.businessName}`);
    console.log(`   User ID in profile: ${providerProfile.userId}`);
    console.log(`   ✅ Matches decoded.userId? ${providerProfile.userId === decoded.userId ? 'YES' : 'NO'}\n`);

    // Step 5: Test getBookings service (as controller does)
    console.log('='.repeat(80));
    console.log('Step 5: Calling getBookings Service (As Controller Does)');
    console.log('='.repeat(80));
    console.log('');

    console.log(`[getBookings] userId: ${decoded.userId}, userType: provider`);
    
    const result = await getBookings(decoded.userId, 'provider', {
      page: 1,
      limit: 50
    });

    console.log('\n✅ Service Result:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Message: ${result.message}`);
    console.log(`   Status Code: ${result.statusCode}`);
    console.log(`   Bookings Count: ${result.data?.bookings?.length || 0}\n`);

    // Step 6: Check bookings directly in database
    console.log('='.repeat(80));
    console.log('Step 6: Direct Database Query');
    console.log('='.repeat(80));
    console.log('');

    // Query by provider profile ID (correct way)
    const bookingsByProfileId = await Booking.findAll({
      where: { providerId: providerProfile.id },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    console.log(`Bookings with providerId = ProviderProfile.id (${providerProfile.id}):`);
    console.log(`   Count: ${bookingsByProfileId.length}\n`);

    if (bookingsByProfileId.length > 0) {
      console.log('Sample bookings:');
      bookingsByProfileId.slice(0, 5).forEach((booking, index) => {
        console.log(`   ${index + 1}. Booking ${booking.id}`);
        console.log(`      Status: ${booking.status}`);
        console.log(`      ProviderId: ${booking.providerId}`);
        console.log(`      Created: ${booking.createdAt}`);
      });
      console.log('');
    }

    // Also check if there are bookings with userId as providerId (wrong way)
    const bookingsByUserId = await Booking.findAll({
      where: { providerId: decoded.userId },
      limit: 10
    });

    if (bookingsByUserId.length > 0 && bookingsByUserId.length !== bookingsByProfileId.length) {
      console.log(`⚠️  WARNING: Found ${bookingsByUserId.length} bookings with providerId = User.id`);
      console.log(`   This suggests data inconsistency!\n`);
    }

    // Step 7: Compare results
    console.log('='.repeat(80));
    console.log('Step 7: Comparison');
    console.log('='.repeat(80));
    console.log('');

    const serviceBookingCount = result.data?.bookings?.length || 0;
    const dbBookingCount = bookingsByProfileId.length;

    console.log(`Service returned: ${serviceBookingCount} bookings`);
    console.log(`Database has: ${dbBookingCount} bookings (direct query)`);
    console.log(`Match: ${serviceBookingCount === dbBookingCount ? '✅ YES' : '❌ NO'}\n`);

    if (serviceBookingCount === 0 && dbBookingCount > 0) {
      console.log('⚠️  ISSUE DETECTED:');
      console.log('   Service returns 0 bookings but database has bookings!');
      console.log('   This indicates a problem in the getBookings service logic.\n');
    } else if (serviceBookingCount > 0) {
      console.log('✅ SUCCESS: Service correctly returns bookings!\n');
    } else {
      console.log('ℹ️  INFO: This provider has no bookings.\n');
    }

    console.log('='.repeat(80));
    console.log('TEST COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testFullAPIFlow();

