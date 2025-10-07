import { Review, User, ProviderProfile } from './schema/index.js';
import sequelize from './database/db.js';

async function addDirectRatings() {
  try {
    console.log('🚀 Adding direct random ratings for development...');
    
    // Get all verified providers
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
    
    // Get all users (customers)
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'role'],
      where: {
        role: 'customer'
      }
    });
    
    console.log(`👥 Found ${users.length} customer users`);
    
    if (users.length === 0) {
      console.log('❌ No customer users found. Please create some customer accounts first.');
      return;
    }
    
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
    
    const reviewsCreated = [];
    
    // Add 3-5 reviews per provider
    for (const provider of providers) {
      const numReviews = Math.floor(Math.random() * 3) + 3; // 3-5 reviews per provider
      
      for (let i = 0; i < numReviews; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        
        // Generate random rating between 2.0 and 4.5
        const rating = Math.round((2 + Math.random() * 2.5) * 10) / 10; // 2.0 to 4.5
        const randomComment = reviewComments[Math.floor(Math.random() * reviewComments.length)];
        
        // Create a mock booking ID (since we're not creating actual bookings)
        const mockBookingId = `mock_${provider.id}_${randomUser.id}_${Date.now()}_${i}`;
        
        const review = await Review.create({
          bookingId: mockBookingId,
          reviewerId: randomUser.id,
          providerId: provider.id,
          rating: rating,
          comment: randomComment,
          isVisible: true,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
        
        reviewsCreated.push(review);
      }
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
    
    console.log('\n🎉 Direct random ratings added successfully for development!');
    
  } catch (error) {
    console.error('❌ Error adding direct ratings:', error);
    throw error;
  }
}

// Run the script
addDirectRatings()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
