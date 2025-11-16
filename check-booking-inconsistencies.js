import { Booking, User, ProviderProfile } from './schema/index.js';
import sequelize from './database/db.js';
import { Op } from 'sequelize';

async function checkBookingInconsistencies() {
  try {
    console.log('='.repeat(80));
    console.log('CHECKING FOR BOOKING DATA INCONSISTENCIES');
    console.log('='.repeat(80));
    console.log('');

    // Get all bookings
    const allBookings = await Booking.findAll({
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: ProviderProfile,
          as: 'providerProfile',
          attributes: ['id', 'userId', 'businessName'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    console.log(`Total bookings checked: ${allBookings.length}\n`);

    const inconsistencies = [];
    const validBookings = [];

    for (const booking of allBookings) {
      const providerId = booking.providerId;
      
      // Check if providerId matches a ProviderProfile.id
      if (booking.providerProfile && booking.providerProfile.id === providerId) {
        validBookings.push(booking);
      } else {
        // Check if providerId is actually a userId
        const userAsProvider = await User.findByPk(providerId);
        if (userAsProvider && userAsProvider.role === 'provider') {
          // This is an inconsistency - booking has userId instead of providerProfile.id
          const correctProfile = await ProviderProfile.findOne({
            where: { userId: providerId }
          });
          
          inconsistencies.push({
            bookingId: booking.id,
            currentProviderId: providerId,
            isUserId: true,
            userId: providerId,
            shouldBeProviderProfileId: correctProfile?.id || 'NOT FOUND',
            customer: booking.customer?.fullName || 'N/A',
            status: booking.status,
            createdAt: booking.createdAt
          });
        } else {
          // ProviderProfile not found - might be deleted or invalid
          inconsistencies.push({
            bookingId: booking.id,
            currentProviderId: providerId,
            isUserId: false,
            providerProfileExists: !!booking.providerProfile,
            customer: booking.customer?.fullName || 'N/A',
            status: booking.status,
            createdAt: booking.createdAt
          });
        }
      }
    }

    console.log(`✅ Valid bookings (providerId = ProviderProfile.id): ${validBookings.length}`);
    console.log(`⚠️  Inconsistent bookings (providerId = User.id or invalid): ${inconsistencies.length}\n`);

    if (inconsistencies.length > 0) {
      console.log('='.repeat(80));
      console.log('INCONSISTENT BOOKINGS FOUND:');
      console.log('='.repeat(80));
      console.log('');

      for (const issue of inconsistencies) {
        console.log(`Booking ID: ${issue.bookingId}`);
        console.log(`  Current providerId: ${issue.currentProviderId}`);
        console.log(`  Customer: ${issue.customer}`);
        console.log(`  Status: ${issue.status}`);
        console.log(`  Created: ${issue.createdAt}`);
        
        if (issue.isUserId) {
          console.log(`  ⚠️  PROBLEM: providerId is a User ID, not ProviderProfile ID`);
          console.log(`  Should be: ${issue.shouldBeProviderProfileId}`);
        } else {
          console.log(`  ⚠️  PROBLEM: ProviderProfile not found for this providerId`);
        }
        console.log('');
      }

      console.log('='.repeat(80));
      console.log('SUGGESTED FIX:');
      console.log('='.repeat(80));
      console.log('These bookings need to be updated to use ProviderProfile.id instead of User.id');
      console.log('');
    } else {
      console.log('✅ All bookings have valid providerIds!\n');
    }

    // Check specific provider
    const PROVIDER_PROFILE_ID = '2c645cd7-a721-4646-958d-8a5ed9782703';
    const providerProfile = await ProviderProfile.findByPk(PROVIDER_PROFILE_ID);
    
    if (providerProfile) {
      console.log('='.repeat(80));
      console.log(`CHECKING BOOKINGS FOR PROVIDER: ${PROVIDER_PROFILE_ID}`);
      console.log('='.repeat(80));
      console.log(`Provider User ID: ${providerProfile.userId}`);
      console.log('');

      // Check bookings with providerProfile.id
      const bookingsWithProfileId = await Booking.count({
        where: { providerId: PROVIDER_PROFILE_ID }
      });
      console.log(`Bookings with providerId = ProviderProfile.id: ${bookingsWithProfileId}`);

      // Check bookings with userId (inconsistent)
      const bookingsWithUserId = await Booking.count({
        where: { providerId: providerProfile.userId }
      });
      console.log(`Bookings with providerId = User.id (INCONSISTENT): ${bookingsWithUserId}`);

      if (bookingsWithUserId > 0) {
        console.log(`\n⚠️  FOUND ${bookingsWithUserId} BOOKINGS WITH WRONG PROVIDER ID!`);
        const wrongBookings = await Booking.findAll({
          where: { providerId: providerProfile.userId },
          include: [{
            model: User,
            as: 'customer',
            attributes: ['id', 'fullName', 'email']
          }]
        });
        
        console.log('\nThese bookings should be updated:');
        wrongBookings.forEach(booking => {
          console.log(`  - Booking ${booking.id}: Customer ${booking.customer?.fullName}, Status: ${booking.status}`);
        });
      }

      console.log('');
    }

    console.log('='.repeat(80));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkBookingInconsistencies();

