import { getBookings } from './services/bookingService.js';
import { User, ProviderProfile } from './schema/index.js';
import sequelize from './database/db.js';

// Test with a provider that we KNOW has bookings
const TEST_PROVIDER_PROFILE_ID = '8b351c4c-b286-4c57-baf1-f60dd594cbe7'; // This one has 18 bookings

async function testExactAPICall() {
  try {
    console.log('='.repeat(80));
    console.log('TESTING EXACT API CALL SIMULATION');
    console.log('='.repeat(80));
    console.log(`\nTest Provider Profile ID: ${TEST_PROVIDER_PROFILE_ID}\n`);

    // Step 1: Get provider user
    const providerProfile = await ProviderProfile.findByPk(TEST_PROVIDER_PROFILE_ID);
    if (!providerProfile) {
      console.error('❌ ProviderProfile not found!');
      return;
    }

    const user = await User.findByPk(providerProfile.userId);
    if (!user) {
      console.error('❌ User not found!');
      return;
    }

    console.log(`Provider User ID: ${user.id}`);
    console.log(`Provider Email: ${user.email}\n`);

    // Step 2: Simulate the EXACT API call that frontend/mobile makes
    console.log('='.repeat(80));
    console.log('Step 2: Simulating API call');
    console.log('='.repeat(80));
    console.log('');

    // This is what the frontend/mobile does:
    // GET /api/bookings?userType=provider
    const result = await getBookings(user.id, 'provider', {
      page: 1,
      limit: 50
    });

    // Step 3: Display the EXACT response structure
    console.log('='.repeat(80));
    console.log('Step 3: API Response Structure');
    console.log('='.repeat(80));
    console.log('');

    console.log('Full Response Object:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    console.log('Response Structure Breakdown:');
    console.log(`  result.success: ${result.success}`);
    console.log(`  result.message: ${result.message}`);
    console.log(`  result.statusCode: ${result.statusCode}`);
    console.log(`  result.data: ${typeof result.data}`);
    console.log(`  result.data.bookings: ${result.data?.bookings ? `Array(${result.data.bookings.length})` : 'undefined'}`);
    console.log(`  result.data.pagination: ${result.data?.pagination ? 'Object' : 'undefined'}\n`);

    // Step 4: Test what frontend/mobile extracts
    console.log('='.repeat(80));
    console.log('Step 4: Testing Frontend/Mobile Extraction Logic');
    console.log('='.repeat(80));
    console.log('');

    // This is the extraction logic from ProviderBookingsScreen
    let extractedBookings = [];
    
    if (Array.isArray(result.data)) {
      console.log('✅ Response.data is an array');
      extractedBookings = result.data;
    } else if (result.data?.bookings && Array.isArray(result.data.bookings)) {
      console.log('✅ Response.data.bookings exists and is an array');
      extractedBookings = result.data.bookings;
    } else if (result.bookings && Array.isArray(result.bookings)) {
      console.log('✅ Response.bookings exists and is an array');
      extractedBookings = result.bookings;
    } else {
      console.log('❌ Could not extract bookings from response!');
      console.log('   Response.data type:', typeof result.data);
      console.log('   Response.data:', result.data);
      console.log('   Has result.data.bookings?', !!result.data?.bookings);
      console.log('   Has result.bookings?', !!result.bookings);
    }

    console.log(`Extracted ${extractedBookings.length} bookings\n`);

    if (extractedBookings.length > 0) {
      console.log('Sample booking structure:');
      const sample = extractedBookings[0];
      console.log(JSON.stringify({
        id: sample.id,
        status: sample.status,
        providerId: sample.providerId,
        customer: sample.customer ? {
          id: sample.customer.id,
          fullName: sample.customer.fullName
        } : null,
        providerProfile: sample.providerProfile ? {
          id: sample.providerProfile.id,
          businessName: sample.providerProfile.businessName
        } : null
      }, null, 2));
      console.log('');
    }

    // Step 5: Test with status filter
    console.log('='.repeat(80));
    console.log('Step 5: Testing with status filter "requested"');
    console.log('='.repeat(80));
    console.log('');

    const resultWithFilter = await getBookings(user.id, 'provider', {
      page: 1,
      limit: 50,
      status: 'requested'
    });

    const filteredBookings = resultWithFilter.data?.bookings || [];
    console.log(`Bookings with status 'requested': ${filteredBookings.length}\n`);

    if (filteredBookings.length > 0) {
      console.log('Filtered bookings:');
      filteredBookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. ID: ${booking.id}, Status: ${booking.status}, Customer: ${booking.customer?.fullName || 'N/A'}`);
      });
      console.log('');
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

testExactAPICall();

