import { getBookings } from './services/bookingService.js';
import { User, ProviderProfile } from './schema/index.js';
import sequelize from './database/db.js';

// Use the provider that we KNOW has bookings from previous tests
const TEST_PROVIDER_PROFILE_ID = '8b351c4c-b286-4c57-baf1-f60dd594cbe7'; // Has 18+ bookings

async function testRealProviderAPI() {
  try {
    console.log('='.repeat(80));
    console.log('TESTING REAL PROVIDER API CALL (Simulating Frontend/Mobile)');
    console.log('='.repeat(80));
    console.log(`\nProvider Profile ID: ${TEST_PROVIDER_PROFILE_ID}\n`);

    // Step 1: Get provider info (simulating what happens when provider logs in)
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

    console.log('Provider Information:');
    console.log(`  User ID (from auth token): ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Full Name: ${user.fullName}`);
    console.log(`  Provider Profile ID: ${providerProfile.id}`);
    console.log(`  Business Name: ${providerProfile.businessName}\n`);

    // Step 2: Simulate the EXACT API call that frontend/mobile makes
    // GET /api/bookings?userType=provider
    console.log('='.repeat(80));
    console.log('Step 1: Calling API (GET /api/bookings?userType=provider)');
    console.log('='.repeat(80));
    console.log('');
    console.log(`[API Call] userId: ${user.id}, userType: provider`);

    const result = await getBookings(user.id, 'provider', {
      page: 1,
      limit: 50
    });

    // Step 3: Display results
    console.log('\n' + '='.repeat(80));
    console.log('Step 2: API Response');
    console.log('='.repeat(80));
    console.log('');
    
    console.log(`✅ Success: ${result.success}`);
    console.log(`📝 Message: ${result.message}`);
    console.log(`📊 Status Code: ${result.statusCode}`);
    console.log(`📦 Response Structure:`);
    console.log(`   - result.data exists: ${!!result.data}`);
    console.log(`   - result.data.bookings exists: ${!!result.data?.bookings}`);
    console.log(`   - result.data.bookings is array: ${Array.isArray(result.data?.bookings)}`);
    console.log(`   - result.data.bookings length: ${result.data?.bookings?.length || 0}`);
    console.log(`   - result.data.pagination exists: ${!!result.data?.pagination}`);
    console.log('');

    // Step 4: Extract bookings (as frontend/mobile does)
    console.log('='.repeat(80));
    console.log('Step 3: Extracting Bookings (Frontend/Mobile Logic)');
    console.log('='.repeat(80));
    console.log('');

    let extractedBookings = [];
    
    // This is the exact extraction logic from ProviderBookingsScreen.tsx
    if (Array.isArray(result.data)) {
      extractedBookings = result.data;
      console.log('✅ Extracted: result.data is an array');
    } else if (result.data?.bookings && Array.isArray(result.data.bookings)) {
      extractedBookings = result.data.bookings;
      console.log('✅ Extracted: result.data.bookings is an array');
    } else if (result.bookings && Array.isArray(result.bookings)) {
      extractedBookings = result.bookings;
      console.log('✅ Extracted: result.bookings is an array');
    } else {
      console.log('❌ FAILED: Could not extract bookings!');
      console.log('   Response structure:', {
        hasData: !!result.data,
        dataType: typeof result.data,
        dataIsArray: Array.isArray(result.data),
        hasDataBookings: !!result.data?.bookings,
        hasBookings: !!result.bookings
      });
    }

    console.log(`\n📋 Total bookings extracted: ${extractedBookings.length}\n`);

    // Step 5: Display bookings summary
    if (extractedBookings.length > 0) {
      console.log('='.repeat(80));
      console.log('Step 4: Bookings Summary');
      console.log('='.repeat(80));
      console.log('');

      const statusCounts = {};
      extractedBookings.forEach(booking => {
        const status = booking.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      console.log('Status Breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      console.log('');

      console.log('Sample Bookings (first 5):');
      extractedBookings.slice(0, 5).forEach((booking, index) => {
        console.log(`\n  ${index + 1}. Booking ID: ${booking.id}`);
        console.log(`     Status: ${booking.status}`);
        console.log(`     Customer: ${booking.customer?.fullName || 'N/A'}`);
        console.log(`     Customer Email: ${booking.customer?.email || 'N/A'}`);
        console.log(`     Scheduled: ${booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString() : 'N/A'}`);
        console.log(`     Amount: ₦${booking.totalAmount || '0.00'}`);
        console.log(`     Provider ID in booking: ${booking.providerId}`);
        console.log(`     ✅ Provider ID matches? ${booking.providerId === TEST_PROVIDER_PROFILE_ID ? 'YES' : 'NO'}`);
      });
    } else {
      console.log('❌ NO BOOKINGS FOUND!\n');
      console.log('This indicates a problem with:');
      console.log('  1. The query logic');
      console.log('  2. The response structure');
      console.log('  3. The data extraction logic');
    }

    // Step 6: Test with status filter
    console.log('\n' + '='.repeat(80));
    console.log('Step 5: Testing with Status Filter "requested"');
    console.log('='.repeat(80));
    console.log('');

    const resultWithFilter = await getBookings(user.id, 'provider', {
      page: 1,
      limit: 50,
      status: 'requested'
    });

    const filteredBookings = resultWithFilter.data?.bookings || [];
    console.log(`✅ Bookings with status 'requested': ${filteredBookings.length}`);

    if (filteredBookings.length > 0) {
      console.log('\nFiltered Bookings:');
      filteredBookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.id} - Customer: ${booking.customer?.fullName || 'N/A'}`);
      });
    }

    // Step 7: Summary
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    console.log(`✅ Backend Query: ${extractedBookings.length > 0 ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Response Structure: ${result.data?.bookings ? 'CORRECT' : 'INCORRECT'}`);
    console.log(`✅ Data Extraction: ${extractedBookings.length > 0 ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📊 Total Bookings: ${extractedBookings.length}`);
    console.log('');

    if (extractedBookings.length === 0) {
      console.log('⚠️  ISSUE DETECTED: Backend query works, but no bookings extracted!');
      console.log('   This suggests a problem with the response parsing in frontend/mobile.');
    } else {
      console.log('✅ SUCCESS: Backend is working correctly!');
      console.log('   Providers should be able to see their bookings.');
    }

    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testRealProviderAPI();

