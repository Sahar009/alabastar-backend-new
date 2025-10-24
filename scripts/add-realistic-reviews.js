import { Review, User, ProviderProfile, Booking, ServiceCategory } from '../schema/index.js';
import sequelize from '../database/db.js';

// Realistic review comments organized by service category
const reviewComments = {
  cleaning: [
    "Excellent cleaning service! My house looks spotless and smells amazing. The team was very professional and thorough.",
    "Great job! They cleaned every corner and even organized my closet. Highly recommend for deep cleaning services.",
    "Very satisfied with the cleaning service. They arrived on time and did an outstanding job. Will definitely book again.",
    "Professional cleaners who pay attention to detail. My home has never looked better. Worth every penny!",
    "Amazing cleaning service! They used eco-friendly products and left everything sparkling clean. Very impressed!",
    "Good quality cleaning service. The team was friendly and efficient. My house looks great after their visit.",
    "Excellent work! They cleaned areas I didn't even think about. Very thorough and professional service.",
    "Great experience overall. The cleaners were punctual, professional, and did a fantastic job. Highly recommended!",
    "Outstanding cleaning service! They transformed my messy house into a spotless home. Very happy with the results.",
    "Professional and reliable cleaning service. They did exactly what was promised and more. Will use again!"
  ],
  plumbing: [
    "Fixed my leaky faucet quickly and efficiently. The plumber was knowledgeable and explained everything clearly.",
    "Great plumbing service! They resolved my drainage issue in no time. Very professional and reasonably priced.",
    "Excellent work! The plumber arrived on time and fixed the problem immediately. Very satisfied with the service.",
    "Outstanding plumbing service. They diagnosed and fixed the issue quickly. Very professional and trustworthy.",
    "Great job! The plumber was skilled and completed the work perfectly. Will definitely call them again.",
    "Professional plumbing service. They fixed my toilet issue and even cleaned up after themselves. Highly recommend!",
    "Excellent workmanship! The plumber was experienced and solved the problem efficiently. Very happy with the service.",
    "Great experience! They fixed my water heater issue quickly and professionally. Worth every penny.",
    "Outstanding service! The plumber was punctual, skilled, and very professional. Highly satisfied!",
    "Professional and reliable plumbing service. They fixed my pipe issue and provided great customer service."
  ],
  electrical: [
    "Excellent electrical work! They installed new outlets safely and professionally. Very satisfied with the service.",
    "Great electrician! They fixed my lighting issue quickly and efficiently. Very professional and knowledgeable.",
    "Outstanding electrical service. They resolved my power problem and explained everything clearly. Highly recommend!",
    "Professional electrician who did excellent work. They installed my ceiling fan perfectly. Very happy with the results.",
    "Great job! The electrician was skilled and completed the work safely. Will definitely use their services again.",
    "Excellent work! They fixed my electrical issue and ensured everything was up to code. Very professional service.",
    "Outstanding electrical service. The electrician was knowledgeable and did quality work. Highly satisfied!",
    "Great experience! They installed new switches and outlets professionally. Very reliable and trustworthy.",
    "Professional electrician who provided excellent service. They fixed my circuit breaker issue quickly. Highly recommend!",
    "Excellent workmanship! The electrician was experienced and completed the job perfectly. Very happy with the service."
  ],
  carpentry: [
    "Amazing carpentry work! They built a beautiful custom shelf that exceeded my expectations. Very skilled craftsman.",
    "Excellent woodworking! They repaired my damaged furniture and made it look brand new. Highly recommend!",
    "Great carpentry service! They built a custom table exactly as requested. Very professional and talented.",
    "Outstanding work! The carpenter was skilled and created beautiful custom cabinets. Very satisfied with the results.",
    "Professional carpentry service. They fixed my broken chair and did excellent work. Will definitely use again.",
    "Great job! They built a custom bookshelf that fits perfectly in my space. Very happy with the craftsmanship.",
    "Excellent carpentry work! They repaired my wooden door and it looks amazing. Very skilled and professional.",
    "Outstanding service! The carpenter was talented and completed the custom work perfectly. Highly recommend!",
    "Great experience! They built beautiful custom furniture that exceeded my expectations. Very satisfied!",
    "Professional carpenter who did excellent work. They created custom shelving that looks fantastic. Highly recommend!"
  ],
  general: [
    "Excellent service! Very professional and completed the work on time. Highly recommend this provider.",
    "Great work! They were punctual, professional, and did exactly what was promised. Very satisfied!",
    "Outstanding service! The provider was skilled and completed the job perfectly. Will definitely use again.",
    "Professional and reliable service. They did excellent work and provided great customer service. Highly recommend!",
    "Great experience! The provider was knowledgeable and completed the work efficiently. Very happy with the results.",
    "Excellent work! They were professional, punctual, and did quality work. Worth every penny.",
    "Outstanding service! The provider was skilled and completed the job to perfection. Highly satisfied!",
    "Great job! They were reliable, professional, and did excellent work. Will definitely recommend to others.",
    "Professional service provider who did outstanding work. They completed the job perfectly and on time. Highly recommend!",
    "Excellent work! The provider was skilled, professional, and provided great customer service. Very satisfied!"
  ]
};

// Rating distribution weights (more positive reviews)
const ratingWeights = {
  5: 0.4,  // 40% five-star reviews
  4: 0.3,  // 30% four-star reviews
  3: 0.15, // 15% three-star reviews
  2: 0.1,  // 10% two-star reviews
  1: 0.05  // 5% one-star reviews
};

function getRandomRating() {
  const random = Math.random();
  let cumulative = 0;
  
  for (const [rating, weight] of Object.entries(ratingWeights)) {
    cumulative += weight;
    if (random <= cumulative) {
      return parseInt(rating);
    }
  }
  return 5; // fallback
}

function getRandomComment(category) {
  const comments = reviewComments[category] || reviewComments.general;
  return comments[Math.floor(Math.random() * comments.length)];
}

async function addRealisticReviews() {
  try {
    console.log('🚀 Starting to add realistic reviews...');
    
    // Get all verified providers with their categories
    const providers = await ProviderProfile.findAll({
      attributes: ['id', 'businessName', 'userId', 'category'],
      where: {
        verificationStatus: 'verified'
      },
      include: [
        {
          model: ServiceCategory,
          attributes: ['name', 'slug']
        }
      ]
    });
    
    console.log(`🏢 Found ${providers.length} verified providers`);
    
    if (providers.length === 0) {
      console.log('❌ No verified providers found. Please verify some providers first.');
      return;
    }
    
    // Get all customer users
    const customers = await User.findAll({
      attributes: ['id', 'fullName', 'email'],
      where: {
        role: 'customer'
      }
    });
    
    console.log(`👥 Found ${customers.length} customer users`);
    
    if (customers.length === 0) {
      console.log('❌ No customer users found. Please create some customer accounts first.');
      return;
    }
    
    // Get existing bookings or create mock ones
    let bookings = await Booking.findAll({
      attributes: ['id', 'userId', 'providerId', 'status', 'serviceType'],
      where: {
        status: 'completed'
      }
    });
    
    console.log(`📅 Found ${bookings.length} completed bookings`);
    
    // If no bookings exist, create some mock bookings for reviews
    if (bookings.length === 0) {
      console.log('📝 Creating mock bookings for reviews...');
      const mockBookings = [];
      
      for (let i = 0; i < Math.min(providers.length * 3, 50); i++) {
        const randomProvider = providers[Math.floor(Math.random() * providers.length)];
        const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
        
        mockBookings.push({
          id: `booking-${Date.now()}-${i}`,
          userId: randomCustomer.id,
          providerId: randomProvider.id,
          status: 'completed',
          serviceType: 'general',
          scheduledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      await Booking.bulkCreate(mockBookings);
      bookings = await Booking.findAll({
        attributes: ['id', 'userId', 'providerId', 'status', 'serviceType'],
        where: {
          status: 'completed'
        }
      });
      
      console.log(`✅ Created ${mockBookings.length} mock bookings`);
    }
    
    const reviewsCreated = [];
    const reviewsToCreate = [];
    
    // Create reviews for each provider (3-8 reviews per provider)
    for (const provider of providers) {
      const providerBookings = bookings.filter(booking => booking.providerId === provider.id);
      const numReviews = Math.floor(Math.random() * 6) + 3; // 3-8 reviews per provider
      
      // Get unique customers for this provider
      const usedCustomers = new Set();
      
      for (let i = 0; i < Math.min(numReviews, providerBookings.length || 10); i++) {
        let randomCustomer;
        let attempts = 0;
        
        // Try to get a unique customer (avoid duplicate reviews from same customer)
        do {
          randomCustomer = customers[Math.floor(Math.random() * customers.length)];
          attempts++;
        } while (usedCustomers.has(randomCustomer.id) && attempts < 20);
        
        usedCustomers.add(randomCustomer.id);
        
        const rating = getRandomRating();
        const category = provider.category || 'general';
        const comment = getRandomComment(category);
        
        // Use existing booking or create a mock one
        let bookingId;
        if (providerBookings.length > 0) {
          bookingId = providerBookings[i % providerBookings.length].id;
        } else {
          // Create a mock booking ID
          bookingId = `mock-booking-${provider.id}-${i}`;
        }
        
        const reviewData = {
          id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          bookingId,
          reviewerId: randomCustomer.id,
          providerId: provider.id,
          rating,
          comment,
          isVisible: Math.random() > 0.1, // 90% visible reviews
          createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Random date within last 60 days
          updatedAt: new Date()
        };
        
        reviewsToCreate.push(reviewData);
        reviewsCreated.push({
          provider: provider.businessName,
          customer: randomCustomer.fullName,
          rating,
          comment: comment.substring(0, 50) + '...'
        });
      }
    }
    
    // Insert reviews in batches
    console.log(`📝 Creating ${reviewsToCreate.length} reviews...`);
    
    const batchSize = 50;
    for (let i = 0; i < reviewsToCreate.length; i += batchSize) {
      const batch = reviewsToCreate.slice(i, i + batchSize);
      await Review.bulkCreate(batch, { ignoreDuplicates: true });
      console.log(`✅ Created batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(reviewsToCreate.length / batchSize)}`);
    }
    
    console.log('\n🎉 Successfully added realistic reviews!');
    console.log(`📊 Total reviews created: ${reviewsCreated.length}`);
    
    // Show some sample reviews
    console.log('\n📋 Sample reviews created:');
    reviewsCreated.slice(0, 10).forEach((review, index) => {
      console.log(`${index + 1}. ${review.customer} → ${review.provider} (${review.rating}⭐): ${review.comment}`);
    });
    
    // Show statistics
    const ratingStats = reviewsCreated.reduce((stats, review) => {
      stats[review.rating] = (stats[review.rating] || 0) + 1;
      return stats;
    }, {});
    
    console.log('\n📈 Rating distribution:');
    Object.entries(ratingStats).forEach(([rating, count]) => {
      const percentage = ((count / reviewsCreated.length) * 100).toFixed(1);
      console.log(`${rating}⭐: ${count} reviews (${percentage}%)`);
    });
    
  } catch (error) {
    console.error('❌ Error adding realistic reviews:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
addRealisticReviews();
