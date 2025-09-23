import { User, ProviderProfile, Service, ServiceCategory, Review } from './schema/index.js';
import { hashPassword } from './utils/index.js';

const seedProviders = async () => {
  try {
    console.log('🌱 Starting provider seeding...');

    // Create service categories first
    const categories = [
      { id: 'cat-1', name: 'Plumbing', slug: 'plumbing', description: 'Water and drainage services', icon: 'droplets' },
      { id: 'cat-2', name: 'Electrical', slug: 'electrical', description: 'Electrical installation and repair', icon: 'zap' },
      { id: 'cat-3', name: 'Cleaning', slug: 'cleaning', description: 'Home and office cleaning services', icon: 'sparkles' },
      { id: 'cat-4', name: 'Carpentry', slug: 'carpentry', description: 'Woodwork and furniture services', icon: 'hammer' }
    ];

    for (const category of categories) {
      await ServiceCategory.findOrCreate({
        where: { id: category.id },
        defaults: category
      });
    }

    console.log('✅ Service categories created');

    // Create provider users
    const providers = [
      {
        id: 'user-provider-1',
        fullName: 'John Adebayo',
        email: 'john.adebayo@example.com',
        phone: '+2348012345678',
        passwordHash: await hashPassword('password123'),
        role: 'provider',
        status: 'active',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        isEmailVerified: true,
        isPhoneVerified: true,
        provider: 'email'
      },
      {
        id: 'user-provider-2',
        fullName: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+2348023456789',
        passwordHash: await hashPassword('password123'),
        role: 'provider',
        status: 'active',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        isEmailVerified: true,
        isPhoneVerified: true,
        provider: 'email'
      },
      {
        id: 'user-provider-3',
        fullName: 'Mike Wilson',
        email: 'mike.wilson@example.com',
        phone: '+2348034567890',
        passwordHash: await hashPassword('password123'),
        role: 'provider',
        status: 'active',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        isEmailVerified: true,
        isPhoneVerified: true,
        provider: 'email'
      },
      {
        id: 'user-provider-4',
        fullName: 'Lisa Brown',
        email: 'lisa.brown@example.com',
        phone: '+2348045678901',
        passwordHash: await hashPassword('password123'),
        role: 'provider',
        status: 'active',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        isEmailVerified: true,
        isPhoneVerified: true,
        provider: 'email'
      }
    ];

    for (const provider of providers) {
      await User.findOrCreate({
        where: { id: provider.id },
        defaults: provider
      });
    }

    console.log('✅ Provider users created');

    // Create provider profiles
    const profiles = [
      {
        id: 'profile-1',
        userId: 'user-provider-1',
        category: 'plumbing',
        subcategories: ['pipe_repair', 'faucet_installation', 'drain_cleaning', 'water_heater'],
        yearsOfExperience: 8,
        bio: 'Professional plumber with 8+ years of experience in residential and commercial plumbing. Specialized in pipe repairs, faucet installations, and emergency plumbing services. Licensed and insured.',
        hourlyRate: 3500.00,
        startingPrice: 2500.00,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        ratingAverage: 4.8,
        ratingCount: 127,
        locationCity: 'Lagos',
        locationState: 'Lagos',
        latitude: 6.5244,
        longitude: 3.3792,
        portfolio: [
          'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop'
        ]
      },
      {
        id: 'profile-2',
        userId: 'user-provider-2',
        category: 'electrical',
        subcategories: ['wiring', 'outlet_installation', 'lighting', 'electrical_repair'],
        yearsOfExperience: 6,
        bio: 'Certified electrician specializing in residential electrical work. Expert in wiring, outlet installations, lighting design, and electrical troubleshooting. Safety-first approach with all work guaranteed.',
        hourlyRate: 4000.00,
        startingPrice: 3000.00,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        ratingAverage: 4.9,
        ratingCount: 89,
        locationCity: 'Abuja',
        locationState: 'FCT',
        latitude: 9.0765,
        longitude: 7.3986,
        portfolio: [
          'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop'
        ]
      },
      {
        id: 'profile-3',
        userId: 'user-provider-3',
        category: 'cleaning',
        subcategories: ['house_cleaning', 'office_cleaning', 'deep_cleaning', 'post_construction'],
        yearsOfExperience: 5,
        bio: 'Professional cleaning services for homes and offices. Deep cleaning, regular maintenance, and post-construction cleanup. Eco-friendly products and thorough attention to detail.',
        hourlyRate: 2500.00,
        startingPrice: 2000.00,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        ratingAverage: 4.7,
        ratingCount: 156,
        locationCity: 'Port Harcourt',
        locationState: 'Rivers',
        latitude: 4.8156,
        longitude: 7.0498,
        portfolio: [
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1581578731548-c6a0c3f2f2c0?w=400&h=300&fit=crop'
        ]
      },
      {
        id: 'profile-4',
        userId: 'user-provider-4',
        category: 'carpentry',
        subcategories: ['furniture_repair', 'custom_furniture', 'cabinet_installation', 'wood_repair'],
        yearsOfExperience: 10,
        bio: 'Master carpenter with 10+ years of experience in custom furniture, repairs, and installations. Specialized in cabinet work, furniture restoration, and custom wood projects. Quality craftsmanship guaranteed.',
        hourlyRate: 4500.00,
        startingPrice: 3500.00,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        ratingAverage: 4.9,
        ratingCount: 203,
        locationCity: 'Ibadan',
        locationState: 'Oyo',
        latitude: 7.3775,
        longitude: 3.9470,
        portfolio: [
          'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop'
        ]
      }
    ];

    for (const profile of profiles) {
      await ProviderProfile.findOrCreate({
        where: { id: profile.id },
        defaults: profile
      });
    }

    console.log('✅ Provider profiles created');

    // Create services
    const services = [
      // John Adebayo (Plumbing) Services
      {
        id: 'service-1',
        providerId: 'profile-1',
        categoryId: 'cat-1',
        title: 'Emergency Pipe Repair',
        description: 'Fast and reliable pipe repair services for leaks, bursts, and blockages. Available 24/7 for emergencies.',
        pricingType: 'fixed',
        basePrice: 5000.00,
        isActive: true,
        photos: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop']
      },
      {
        id: 'service-2',
        providerId: 'profile-1',
        categoryId: 'cat-1',
        title: 'Faucet Installation & Repair',
        description: 'Professional faucet installation, repair, and maintenance services for all types of faucets.',
        pricingType: 'fixed',
        basePrice: 3500.00,
        isActive: true,
        photos: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop']
      },
      {
        id: 'service-3',
        providerId: 'profile-1',
        categoryId: 'cat-1',
        title: 'Drain Cleaning',
        description: 'Thorough drain cleaning and unclogging services using professional equipment.',
        pricingType: 'fixed',
        basePrice: 2500.00,
        isActive: true,
        photos: ['https://images.unsplash.com/photo-1581578731548-c6a0c3f2f2c0?w=400&h=300&fit=crop']
      },
      // Sarah Johnson (Electrical) Services
      {
        id: 'service-4',
        providerId: 'profile-2',
        categoryId: 'cat-2',
        title: 'Electrical Wiring',
        description: 'Complete electrical wiring services for new installations and renovations.',
        pricingType: 'hourly',
        basePrice: 4000.00,
        isActive: true,
        photos: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop']
      },
      {
        id: 'service-5',
        providerId: 'profile-2',
        categoryId: 'cat-2',
        title: 'Outlet & Switch Installation',
        description: 'Professional installation of electrical outlets, switches, and fixtures.',
        pricingType: 'fixed',
        basePrice: 2000.00,
        isActive: true,
        photos: ['https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop']
      },
      {
        id: 'service-6',
        providerId: 'profile-2',
        categoryId: 'cat-2',
        title: 'Lighting Installation',
        description: 'Custom lighting design and installation for indoor and outdoor spaces.',
        pricingType: 'fixed',
        basePrice: 4500.00,
        isActive: true,
        photos: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop']
      },
      // Mike Wilson (Cleaning) Services
      {
        id: 'service-7',
        providerId: 'profile-3',
        categoryId: 'cat-3',
        title: 'House Cleaning',
        description: 'Comprehensive house cleaning services including deep cleaning and regular maintenance.',
        pricingType: 'fixed',
        basePrice: 8000.00,
        isActive: true,
        photos: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop']
      },
      {
        id: 'service-8',
        providerId: 'profile-3',
        categoryId: 'cat-3',
        title: 'Office Cleaning',
        description: 'Professional office cleaning services for commercial spaces.',
        pricingType: 'fixed',
        basePrice: 12000.00,
        isActive: true,
        photos: ['https://images.unsplash.com/photo-1581578731548-c6a0c3f2f2c0?w=400&h=300&fit=crop']
      },
      {
        id: 'service-9',
        providerId: 'profile-3',
        categoryId: 'cat-3',
        title: 'Post-Construction Cleanup',
        description: 'Specialized cleaning services after construction or renovation work.',
        pricingType: 'fixed',
        basePrice: 15000.00,
        isActive: true,
        photos: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop']
      },
      // Lisa Brown (Carpentry) Services
      {
        id: 'service-10',
        providerId: 'profile-4',
        categoryId: 'cat-4',
        title: 'Custom Furniture',
        description: 'Handcrafted custom furniture pieces designed to your specifications.',
        pricingType: 'negotiable',
        basePrice: 50000.00,
        isActive: true,
        photos: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop']
      },
      {
        id: 'service-11',
        providerId: 'profile-4',
        categoryId: 'cat-4',
        title: 'Cabinet Installation',
        description: 'Professional cabinet installation and repair services.',
        pricingType: 'fixed',
        basePrice: 25000.00,
        isActive: true,
        photos: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop']
      },
      {
        id: 'service-12',
        providerId: 'profile-4',
        categoryId: 'cat-4',
        title: 'Furniture Repair',
        description: 'Expert furniture repair and restoration services for all types of wood furniture.',
        pricingType: 'fixed',
        basePrice: 8000.00,
        isActive: true,
        photos: ['https://images.unsplash.com/photo-1581578731548-c6a0c3f2f2c0?w=400&h=300&fit=crop']
      }
    ];

    for (const service of services) {
      await Service.findOrCreate({
        where: { id: service.id },
        defaults: service
      });
    }

    console.log('✅ Services created');

    // Skip reviews for now since they require bookings
    console.log('⏭️ Skipping reviews (require bookings)');

    console.log('🎉 Provider seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 4 Provider users created');
    console.log('- 4 Provider profiles created');
    console.log('- 12 Services created');
    console.log('\n🔑 Login credentials:');
    console.log('All providers can login with password: password123');

  } catch (error) {
    console.error('❌ Error seeding providers:', error);
    throw error;
  }
};

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProviders()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedProviders;
