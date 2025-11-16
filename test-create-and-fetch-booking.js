import { createBooking, getBookings } from './services/bookingService.js';
import { User, ProviderProfile, Booking } from './schema/index.js';
import sequelize from './database/db.js';

const PROVIDER_PROFILE_ID = '2c645cd7-a721-4646-958d-8a5ed9782703';

async function testCreateAndFetchBooking() {
  try {
    console.log('='.repeat(80));
    console.log('TESTING: CREATE BOOKING AND FETCH IT');
    console.log('='.repeat(80));
    console.log(`\nProvider Profile ID: ${PROVIDER_PROFILE_ID}\n`);

    // Step 1: Get provider info
    const providerProfile = await ProviderProfile.findByPk(PROVIDER_PROFILE_ID, {
      include: [{ model: User, as: 'User' }]
    });

    if (!providerProfile) {
      console.error('❌ ProviderProfile not found!');
      return;
    }

    console.log(`Provider: ${providerProfile.businessName}`);
    console.log(`Provider User ID: ${providerProfile.userId}\n`);

    // Step 2: Get or create a test customer
    console.log('Step 1: Finding or creating test customer...');
    let customer = await User.findOne({
      where: { email: 'test-customer@alabastar.com' }
    });

    if (!customer) {
      customer = await User.create({
        fullName: 'Test Customer',
        email: 'test-customer@alabastar.com',
        role: 'customer',
        status: 'active',
        isEmailVerified: true
      });
      console.log('✅ Created test customer');
    } else {
      console.log('✅ Found existing test customer');
    }
    console.log(`Customer ID: ${customer.id}`);
    console.log(`Customer Email: ${customer.email}\n`);

    // Step 3: Create a booking for this provider
    console.log('Step 2: Creating booking for provider...');
    const bookingData = {
      userId: customer.id,
      providerId: PROVIDER_PROFILE_ID, // Using providerProfile ID
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      locationAddress: '123 Test Street',
      locationCity: 'Lagos',
      locationState: 'Lagos',
      latitude: 6.5244,
      longitude: 3.3792,
      notes: 'Test booking for provider bookings API',
      totalAmount: 5000
    };

    console.log('Booking Data:', JSON.stringify(bookingData, null, 2));
    console.log('');

    const createResult = await createBooking(bookingData);

    if (!createResult.success) {
      console.error('❌ Failed to create booking:', createResult.message);
      return;
    }

    console.log('✅ Booking created successfully!');
    console.log(`Booking ID: ${createResult.data.id}`);
    console.log(`Status: ${createResult.data.status}`);
    console.log(`Provider ID in booking: ${createResult.data.providerId}`);
    console.log(`Customer: ${createResult.data.customer?.fullName}`);
    console.log(`Scheduled: ${createResult.data.scheduledAt}\n`);

    // Step 4: Wait a moment for DB to sync
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 5: Fetch bookings as provider
    console.log('Step 3: Fetching bookings as provider...');
    const fetchResult = await getBookings(providerProfile.userId, 'provider', {
      page: 1,
      limit: 50
    });

    console.log(`Success: ${fetchResult.success}`);
    console.log(`Message: ${fetchResult.message}`);
    console.log(`Bookings Count: ${fetchResult.data?.bookings?.length || 0}`);
    console.log(`Total Items: ${fetchResult.data?.pagination?.totalItems || 0}\n`);

    if (fetchResult.data?.bookings?.length > 0) {
      console.log('✅ SUCCESS! Bookings found:');
      fetchResult.data.bookings.forEach((booking, index) => {
        console.log(`\n  Booking ${index + 1}:`);
        console.log(`    ID: ${booking.id}`);
        console.log(`    Status: ${booking.status}`);
        console.log(`    Customer: ${booking.customer?.fullName || 'N/A'}`);
        console.log(`    Scheduled: ${booking.scheduledAt}`);
        console.log(`    Amount: ₦${booking.totalAmount || '0'}`);
        console.log(`    Provider ID: ${booking.providerId}`);
        console.log(`    Matches created booking? ${booking.id === createResult.data.id ? '✅ YES' : '❌ NO'}`);
      });
    } else {
      console.error('❌ FAILED! No bookings found after creation!');
      console.log('\nDebugging: Checking what was created...');
      
      const directBooking = await Booking.findByPk(createResult.data.id);
      if (directBooking) {
        console.log(`Direct booking query: Found booking ID ${directBooking.id}`);
        console.log(`  ProviderId in DB: ${directBooking.providerId}`);
        console.log(`  Matches providerProfile.id? ${directBooking.providerId === PROVIDER_PROFILE_ID ? 'YES' : 'NO'}`);
      } else {
        console.log('Direct booking query: NOT FOUND');
      }

      // Check if booking exists with different providerId
      const allBookingsForProvider = await Booking.findAll({
        where: {
          userId: customer.id
        }
      });
      console.log(`\nTotal bookings for customer: ${allBookingsForProvider.length}`);
      allBookingsForProvider.forEach(booking => {
        console.log(`  - Booking ID: ${booking.id}, ProviderId: ${booking.providerId}`);
      });
    }

    // Step 6: Clean up - delete test booking
    console.log('\n\nStep 4: Cleaning up test booking...');
    await Booking.destroy({
      where: { id: createResult.data.id }
    });
    console.log('✅ Test booking deleted');

    console.log('\n' + '='.repeat(80));
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

testCreateAndFetchBooking();

