import { Review, User, ProviderProfile, Booking } from './schema/index.js';
import sequelize from './database/db.js';

async function addRandomRatings() {
  try {
    console.log('🚀 Starting to add random ratings for development...');
    
    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'role']
    });
    
    console.log(`📊 Found ${users.length} users`);
    
    // Get all provider profiles
    const providers = await ProviderProfile.findAll({
      attributes: ['id', 'businessName', 'userId'],
      where: {
        verificationStatus: 'verified'
      }
    });
    
    console.log(`🏢 Found ${providers.length} verified providers`);
    
    if (providers.length === 0) {
      console.log('❌ No verified providers found. Please verify some providers first.');
      return;
    }
    
    // Get all bookings (or create mock bookings if none exist)
    let bookings = await Booking.findAll({
      attributes: ['id', 'userId', 'providerId', 'status'],
      where: {
        status: 'completed'
      }
    });
    
    console.log(`📅 Found ${bookings.length} completed bookings`);
    
    // If no bookings exist, create some mock bookings for testing
    if (bookings.length === 0) {
      console.log('📝 Creating mock bookings for testing...');
      
      const mockBookings = [];
      const customerUsers = users.filter(user => user.role === 'customer');
      
      // Create 2-3 bookings per provider
      for (const provider of providers) {
        const numBookings = Math.floor(Math.random() * 2) + 2; // 2-3 bookings
        
        for (let i = 0; i < numBookings; i++) {
          const randomCustomer = customerUsers[Math.floor(Math.random() * customerUsers.length)];
          
          const booking = await Booking.create({
            userId: randomCustomer.id,
            providerId: provider.id,
            serviceType: 'General Service',
            description: 'Mock booking for testing',
            scheduledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
            status: 'completed',
            totalAmount: 5000 + Math.random() * 10000,
            paymentStatus: 'paid',
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          });
          
          mockBookings.push(booking);
        }
      }
      
      bookings = mockBookings;
      console.log(`✅ Created ${bookings.length} mock bookings`);
    }
    
    // Create reviews for bookings
    const reviewsCreated = [];
    const reviewComments = [
      'Great service, very professional!',
      'Excellent work, highly recommended.',
      'Good quality service, will use again.',
      'Satisfied with the work done.',
      'Professional and timely service.',
      'Good communication and quality work.',
      'Very happy with the results.',
      'Great experience overall.',
      'Good service provider.',
      'Would recommend to others.',
      'Excellent customer service.',
      'Very professional and reliable.',
      'Good work quality.',
      'Satisfied with the service.',
      'Great job done!'
    ];
    
    for (const booking of bookings) {
      // Check if review already exists
      const existingReview = await Review.findOne({
        where: { bookingId: booking.id }
      });
      
      if (existingReview) {
        console.log(`⚠️ Review already exists for booking ${booking.id}, skipping...`);
        continue;
      }
      
      // Generate random rating between 2.0 and 4.5
      const rating = Math.round((2 + Math.random() * 2.5) * 10) / 10; // 2.0 to 4.5
      const randomComment = reviewComments[Math.floor(Math.random() * reviewComments.length)];
      
      const review = await Review.create({
        bookingId: booking.id,
        reviewerId: booking.userId,
        providerId: booking.providerId,
        rating: rating,
        comment: randomComment,
        isVisible: true,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
      
      reviewsCreated.push(review);
    }
    
    console.log(`✅ Created ${reviewsCreated.length} reviews`);
    
    // Display summary statistics
    const allReviews = await Review.findAll({
      attributes: ['rating'],
      where: { isVisible: true }
    });
    
    if (allReviews.length > 0) {
      const averageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
      const ratingDistribution = {
        5: allReviews.filter(r => r.rating === 5).length,
        4: allReviews.filter(r => r.rating === 4).length,
        3: allReviews.filter(r => r.rating === 3).length,
        2: allReviews.filter(r => r.rating === 2).length,
        1: allReviews.filter(r => r.rating === 1).length
      };
      
      console.log('\n📊 Review Statistics:');
      console.log(`   Total Reviews: ${allReviews.length}`);
      console.log(`   Average Rating: ${averageRating.toFixed(2)}`);
      console.log(`   Rating Distribution:`);
      console.log(`     5 stars: ${ratingDistribution[5]}`);
      console.log(`     4 stars: ${ratingDistribution[4]}`);
      console.log(`     3 stars: ${ratingDistribution[3]}`);
      console.log(`     2 stars: ${ratingDistribution[2]}`);
      console.log(`     1 star: ${ratingDistribution[1]}`);
    }
    
    // Show provider ratings
    console.log('\n🏢 Provider Ratings:');
    for (const provider of providers) {
      const providerReviews = await Review.findAll({
        where: { 
          providerId: provider.id,
          isVisible: true 
        },
        attributes: ['rating']
      });
      
      if (providerReviews.length > 0) {
        const avgRating = providerReviews.reduce((sum, review) => sum + review.rating, 0) / providerReviews.length;
        console.log(`   ${provider.businessName}: ${avgRating.toFixed(2)} (${providerReviews.length} reviews)`);
      } else {
        console.log(`   ${provider.businessName}: No reviews yet`);
      }
    }
    
    console.log('\n🎉 Random ratings added successfully for development!');
    
  } catch (error) {
    console.error('❌ Error adding random ratings:', error);
    throw error;
  }
}

// Run the script
addRandomRatings()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
