import { Review, Booking, User, ProviderProfile } from './schema/index.js';
import ReviewService from './services/reviewService.js';
import sequelize from './database/db.js';

async function testReviewSystem() {
  try {
    console.log('🧪 Testing Review System...\n');

    // Test 1: Check if we can find a completed booking
    console.log('1. Finding completed bookings...');
    const completedBooking = await Booking.findOne({
      where: { status: 'completed' },
      include: [
        { model: User, as: 'customer' },
        { model: ProviderProfile, as: 'providerProfile' }
      ]
    });

    if (!completedBooking) {
      console.log('❌ No completed bookings found. Please complete a booking first.');
      return;
    }

    console.log(`✅ Found completed booking: ${completedBooking.id}`);
    console.log(`   Customer: ${completedBooking.customer.fullName}`);
    console.log(`   Provider: ${completedBooking.providerProfile.businessName}`);

    // Test 2: Check if review already exists
    console.log('\n2. Checking for existing reviews...');
    const existingReview = await Review.findOne({
      where: { bookingId: completedBooking.id }
    });

    if (existingReview) {
      console.log('✅ Review already exists for this booking');
      console.log(`   Rating: ${existingReview.rating}/5`);
      console.log(`   Comment: ${existingReview.comment || 'No comment'}`);
    } else {
      console.log('ℹ️  No existing review found');
    }

    // Test 3: Test review creation (if no existing review)
    if (!existingReview) {
      console.log('\n3. Testing review creation...');
      try {
        const reviewData = {
          bookingId: completedBooking.id,
          reviewerId: completedBooking.userId,
          rating: 5,
          comment: 'Excellent service! Very professional and completed on time.'
        };

        const newReview = await ReviewService.createReview(reviewData);
        console.log('✅ Review created successfully!');
        console.log(`   Review ID: ${newReview.id}`);
        console.log(`   Rating: ${newReview.rating}/5`);
        console.log(`   Comment: ${newReview.comment}`);
      } catch (error) {
        console.log(`❌ Error creating review: ${error.message}`);
      }
    }

    // Test 4: Get provider reviews
    console.log('\n4. Testing provider reviews retrieval...');
    try {
      const providerReviews = await ReviewService.getProviderReviews(
        completedBooking.providerId,
        { page: 1, limit: 5, includeStats: true }
      );

      console.log('✅ Provider reviews retrieved successfully!');
      console.log(`   Total reviews: ${providerReviews.pagination.totalReviews}`);
      console.log(`   Average rating: ${providerReviews.statistics.averageRating}`);
      console.log(`   Rating distribution:`, providerReviews.statistics.ratingDistribution);
      console.log(`   Recent reviews: ${providerReviews.reviews.length}`);
    } catch (error) {
      console.log(`❌ Error retrieving provider reviews: ${error.message}`);
    }

    // Test 5: Get provider statistics
    console.log('\n5. Testing provider statistics...');
    try {
      const stats = await ReviewService.getProviderReviewStats(completedBooking.providerId);
      console.log('✅ Provider statistics retrieved successfully!');
      console.log(`   Average rating: ${stats.averageRating}`);
      console.log(`   Total reviews: ${stats.totalReviews}`);
      console.log(`   Rating distribution:`, stats.ratingDistribution);
    } catch (error) {
      console.log(`❌ Error retrieving provider statistics: ${error.message}`);
    }

    // Test 6: Test review validation
    console.log('\n6. Testing review validation...');
    try {
      const canReview = await ReviewService.canReviewBooking(
        completedBooking.id,
        completedBooking.userId
      );
      console.log(`✅ Can review booking: ${canReview.canReview}`);
      if (!canReview.canReview) {
        console.log(`   Reason: ${canReview.reason}`);
      }
    } catch (error) {
      console.log(`❌ Error checking review eligibility: ${error.message}`);
    }

    // Test 7: Get recent reviews
    console.log('\n7. Testing recent reviews...');
    try {
      const recentReviews = await ReviewService.getRecentReviews(5);
      console.log(`✅ Retrieved ${recentReviews.length} recent reviews`);
      recentReviews.forEach((review, index) => {
        console.log(`   ${index + 1}. ${review.rating}/5 - ${review.comment?.substring(0, 50) || 'No comment'}...`);
      });
    } catch (error) {
      console.log(`❌ Error retrieving recent reviews: ${error.message}`);
    }

    // Test 8: Get top-rated providers
    console.log('\n8. Testing top-rated providers...');
    try {
      const topProviders = await ReviewService.getTopRatedProviders(3);
      console.log(`✅ Retrieved ${topProviders.length} top-rated providers`);
      topProviders.forEach((provider, index) => {
        console.log(`   ${index + 1}. ${provider.businessName} - ${provider.dataValues.averageRating}/5 (${provider.dataValues.totalReviews} reviews)`);
      });
    } catch (error) {
      console.log(`❌ Error retrieving top-rated providers: ${error.message}`);
    }

    console.log('\n🎉 Review system test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testReviewSystem();



