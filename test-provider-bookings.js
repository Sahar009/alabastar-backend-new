import { Booking, User, ProviderProfile, Service } from './schema/index.js';
import sequelize from './database/db.js';
import { Op } from 'sequelize';

const PROVIDER_PROFILE_ID = '2c645cd7-a721-4646-958d-8a5ed9782703';

async function testProviderBookings() {
  try {
    console.log('='.repeat(80));
    console.log('TESTING PROVIDER BOOKINGS FETCH');
    console.log('='.repeat(80));
    console.log(`\nProvider Profile ID: ${PROVIDER_PROFILE_ID}\n`);

    // Step 1: Find the ProviderProfile
    console.log('Step 1: Finding ProviderProfile...');
    const providerProfile = await ProviderProfile.findByPk(PROVIDER_PROFILE_ID);
    
    if (!providerProfile) {
      console.error('❌ ProviderProfile not found!');
      return;
    }

    console.log('✅ ProviderProfile found:');
    console.log(`   - ID: ${providerProfile.id}`);
    console.log(`   - User ID: ${providerProfile.userId}`);
    console.log(`   - Business Name: ${providerProfile.businessName}`);
    console.log(`   - Category: ${providerProfile.category}`);
    console.log(`   - Verification Status: ${providerProfile.verificationStatus}\n`);

    // Step 2: Find the associated User
    console.log('Step 2: Finding associated User...');
    const user = await User.findByPk(providerProfile.userId);
    
    if (!user) {
      console.error('❌ User not found!');
      return;
    }

    console.log('✅ User found:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Full Name: ${user.fullName}`);
    console.log(`   - Role: ${user.role}\n`);

    // Step 3: Direct query - Get ALL bookings for this providerId (no filters)
    console.log('Step 3: Direct query - All bookings for providerId...');
    const allBookings = await Booking.findAll({
      where: { providerId: PROVIDER_PROFILE_ID },
      include: [
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
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ Found ${allBookings.length} total bookings for this providerId\n`);

    if (allBookings.length === 0) {
      console.log('⚠️  No bookings found for this providerId in the database.\n');
      
      // Check if there are any bookings with different providerId formats
      console.log('Checking for bookings with userId as providerId...');
      const bookingsWithUserId = await Booking.findAll({
        where: { providerId: providerProfile.userId },
        limit: 5,
        include: [{
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'email']
        }]
      });
      console.log(`Found ${bookingsWithUserId.length} bookings with userId as providerId\n`);
      
      if (bookingsWithUserId.length > 0) {
        console.log('Bookings found with userId as providerId:');
        bookingsWithUserId.forEach((booking, index) => {
          console.log(`   ${index + 1}. Booking ID: ${booking.id}`);
          console.log(`      Status: ${booking.status}`);
          console.log(`      Customer: ${booking.customer?.fullName || 'N/A'}`);
          console.log(`      Scheduled: ${booking.scheduledAt}`);
          console.log('');
        });
      }

      // Check ALL bookings to see if any reference this provider somehow
      console.log('Checking ALL bookings in database...');
      const totalBookings = await Booking.count();
      console.log(`Total bookings in database: ${totalBookings}\n`);
      
      if (totalBookings > 0) {
        console.log('Checking recent bookings...');
        const recentBookings = await Booking.findAll({
          limit: 10,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'fullName', 'email']
            },
            {
              model: ProviderProfile,
              as: 'providerProfile',
              attributes: ['id', 'businessName', 'userId'],
              required: false
            }
          ]
        });
        
        console.log(`Recent bookings:\n`);
        recentBookings.forEach((booking, index) => {
          console.log(`   ${index + 1}. Booking ID: ${booking.id}`);
          console.log(`      Provider ID: ${booking.providerId}`);
          console.log(`      Provider Profile: ${booking.providerProfile?.businessName || 'NOT FOUND'} (ID: ${booking.providerProfile?.id || 'N/A'})`);
          console.log(`      Provider User ID: ${booking.providerProfile?.userId || 'N/A'}`);
          console.log(`      Customer: ${booking.customer?.fullName || 'N/A'}`);
          console.log(`      Status: ${booking.status}`);
          console.log(`      Matches our provider? ${booking.providerId === PROVIDER_PROFILE_ID ? '✅ YES' : '❌ NO'}`);
          console.log(`      Matches our user? ${booking.providerId === user.id ? '✅ YES (inconsistent!)' : '❌ NO'}`);
          console.log('');
        });
      }
      
      return;
    }

    // Step 4: Display booking details
    console.log('Step 4: Booking Details:\n');
    allBookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`);
      console.log(`   - ID: ${booking.id}`);
      console.log(`   - Status: ${booking.status}`);
      console.log(`   - Customer: ${booking.customer?.fullName || 'N/A'} (${booking.customer?.email || 'N/A'})`);
      console.log(`   - Service: ${booking.service?.title || 'General Service'}`);
      console.log(`   - Scheduled At: ${booking.scheduledAt}`);
      console.log(`   - Total Amount: ₦${booking.totalAmount || '0'}`);
      console.log(`   - Created At: ${booking.createdAt}`);
      console.log(`   - Location: ${booking.locationAddress || 'N/A'}`);
      console.log('');
    });

    // Step 5: Test status filters
    console.log('Step 5: Testing status filters...\n');
    const statuses = ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'];
    
    for (const status of statuses) {
      const count = await Booking.count({
        where: { 
          providerId: PROVIDER_PROFILE_ID,
          status: status
        }
      });
      console.log(`   - Status "${status}": ${count} bookings`);
    }

    // Step 6: Test the actual query logic (simulating getBookings)
    console.log('\nStep 6: Testing getBookings logic...\n');
    
    // Simulate what happens in getBookings for provider
    console.log(`   Looking up ProviderProfile by userId: ${user.id}`);
    const lookupProfile = await ProviderProfile.findOne({
      where: { userId: user.id }
    });

    if (lookupProfile) {
      console.log(`   ✅ Found ProviderProfile: ${lookupProfile.id}`);
      console.log(`   ProviderProfile IDs match: ${lookupProfile.id === PROVIDER_PROFILE_ID}`);
      
      if (lookupProfile.id !== PROVIDER_PROFILE_ID) {
        console.log(`   ⚠️  WARNING: Lookup returned different ProviderProfile ID!`);
        console.log(`   Expected: ${PROVIDER_PROFILE_ID}`);
        console.log(`   Got: ${lookupProfile.id}`);
      }

      // Test the actual query
      const testBookings = await Booking.findAndCountAll({
        where: { providerId: lookupProfile.id },
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
          }
        ],
        limit: 10,
        offset: 0
      });

      console.log(`   Found ${testBookings.count} bookings using lookup logic\n`);
    } else {
      console.log(`   ❌ ProviderProfile not found by userId lookup!\n`);
    }

    // Step 7: Check for data inconsistencies
    console.log('Step 7: Checking for data inconsistencies...\n');
    
    // Check if there are bookings with userId as providerId
    const inconsistentBookings = await Booking.findAll({
      where: { providerId: user.id },
      limit: 5
    });

    if (inconsistentBookings.length > 0) {
      console.log(`   ⚠️  Found ${inconsistentBookings.length} bookings with userId as providerId (inconsistent data)`);
      inconsistentBookings.forEach(booking => {
        console.log(`      - Booking ID: ${booking.id}, Status: ${booking.status}`);
      });
      console.log('');
    }

    // Check if there are bookings with providerId that doesn't match any ProviderProfile
    const bookingsWithInvalidProviderId = await Booking.findAll({
      where: { providerId: PROVIDER_PROFILE_ID },
      include: [{
        model: ProviderProfile,
        as: 'providerProfile',
        required: false
      }]
    });

    const invalidCount = bookingsWithInvalidProviderId.filter(b => !b.providerProfile).length;
    if (invalidCount > 0) {
      console.log(`   ⚠️  Found ${invalidCount} bookings with providerId that doesn't match any ProviderProfile\n`);
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

// Run the test
testProviderBookings();

