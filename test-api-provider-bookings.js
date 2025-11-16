import { getBookings } from './services/bookingService.js';
import { User, ProviderProfile } from './schema/index.js';
import sequelize from './database/db.js';

const PROVIDER_PROFILE_ID = '2c645cd7-a721-4646-958d-8a5ed9782703';

async function testAPIEndpoint() {
  try {
    console.log('='.repeat(80));
    console.log('TESTING API ENDPOINT LOGIC');
    console.log('='.repeat(80));
    console.log(`\nProvider Profile ID: ${PROVIDER_PROFILE_ID}\n`);

    // Step 1: Get the ProviderProfile and User
    const providerProfile = await ProviderProfile.findByPk(PROVIDER_PROFILE_ID);
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

    // Step 2: Test getBookings with different scenarios
    console.log('='.repeat(80));
    console.log('TEST 1: Fetch bookings as provider (no filters)');
    console.log('='.repeat(80));
    
    const result1 = await getBookings(user.id, 'provider', {
      page: 1,
      limit: 50
    });

    console.log(`Success: ${result1.success}`);
    console.log(`Message: ${result1.message}`);
    console.log(`Status Code: ${result1.statusCode}`);
    console.log(`Bookings Count: ${result1.data?.bookings?.length || 0}`);
    console.log(`Total Items: ${result1.data?.pagination?.totalItems || 0}\n`);

    if (result1.data?.bookings?.length > 0) {
      console.log('Bookings found:');
      result1.data.bookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. ID: ${booking.id}`);
        console.log(`     Status: ${booking.status}`);
        console.log(`     Customer: ${booking.customer?.fullName || 'N/A'}`);
        console.log(`     Scheduled: ${booking.scheduledAt}`);
        console.log('');
      });
    }

    // Step 3: Test with status filter 'requested'
    console.log('='.repeat(80));
    console.log('TEST 2: Fetch bookings with status filter "requested"');
    console.log('='.repeat(80));
    
    const result2 = await getBookings(user.id, 'provider', {
      page: 1,
      limit: 50,
      status: 'requested'
    });

    console.log(`Success: ${result2.success}`);
    console.log(`Bookings Count: ${result2.data?.bookings?.length || 0}\n`);

    // Step 4: Test with status filter 'pending' (wrong status)
    console.log('='.repeat(80));
    console.log('TEST 3: Fetch bookings with status filter "pending" (WRONG - should return 0)');
    console.log('='.repeat(80));
    
    const result3 = await getBookings(user.id, 'provider', {
      page: 1,
      limit: 50,
      status: 'pending'
    });

    console.log(`Success: ${result3.success}`);
    console.log(`Bookings Count: ${result3.data?.bookings?.length || 0}\n`);

    // Step 5: Check what happens if we pass the providerProfile ID directly as userId
    console.log('='.repeat(80));
    console.log('TEST 4: Passing providerProfile ID as userId (WRONG - but checking fallback)');
    console.log('='.repeat(80));
    
    const result4 = await getBookings(PROVIDER_PROFILE_ID, 'provider', {
      page: 1,
      limit: 50
    });

    console.log(`Success: ${result4.success}`);
    console.log(`Message: ${result4.message}`);
    console.log(`Bookings Count: ${result4.data?.bookings?.length || 0}\n`);

    // Step 6: Check all bookings in database for any that might match
    console.log('='.repeat(80));
    console.log('TEST 5: Searching ALL bookings for this provider');
    console.log('='.repeat(80));
    
    const { Booking } = await import('./schema/index.js');
    
    // Check with providerProfile.id
    const count1 = await Booking.count({
      where: { providerId: providerProfile.id }
    });
    console.log(`Bookings with providerId = ${providerProfile.id}: ${count1}`);

    // Check with user.id
    const count2 = await Booking.count({
      where: { providerId: user.id }
    });
    console.log(`Bookings with providerId = ${user.id}: ${count2}`);

    // Check with both (using OR)
    const { Op } = await import('sequelize');
    const count3 = await Booking.count({
      where: {
        [Op.or]: [
          { providerId: providerProfile.id },
          { providerId: user.id }
        ]
      }
    });
    console.log(`Bookings with providerId matching either: ${count3}\n`);

    if (count3 > 0) {
      const allMatchingBookings = await Booking.findAll({
        where: {
          [Op.or]: [
            { providerId: providerProfile.id },
            { providerId: user.id }
          ]
        },
        include: [{
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'email']
        }],
        order: [['createdAt', 'DESC']]
      });

      console.log('All matching bookings:');
      allMatchingBookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. Booking ID: ${booking.id}`);
        console.log(`     ProviderId in DB: ${booking.providerId}`);
        console.log(`     Matches ProviderProfile.id? ${booking.providerId === providerProfile.id ? 'YES' : 'NO'}`);
        console.log(`     Matches User.id? ${booking.providerId === user.id ? 'YES (INCONSISTENT!)' : 'NO'}`);
        console.log(`     Status: ${booking.status}`);
        console.log(`     Customer: ${booking.customer?.fullName || 'N/A'}`);
        console.log(`     Created: ${booking.createdAt}`);
        console.log('');
      });
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

testAPIEndpoint();

