import { User, ProviderProfile } from './schema/index.js';
import bcrypt from 'bcryptjs';
import sequelize from './database/db.js';

const createTestProviders = async () => {
  try {
    console.log('🚀 Creating test providers for referral testing...\n');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Check if providers already exist
    const existingProviders = await ProviderProfile.count();
    if (existingProviders > 0) {
      console.log(`ℹ️  Found ${existingProviders} existing provider(s)`);
      console.log('💡 Run generate-test-referral-codes.js to get referral codes for testing');
      return;
    }

    const testProviders = [
      {
        user: {
          fullName: 'John Plumbing Services',
          email: 'john.plumbing@test.com',
          phone: '+2348012345678',
          password: 'password123'
        },
        profile: {
          businessName: 'John\'s Plumbing Services',
          category: 'plumbing',
          subcategories: ['Pipe Repair', 'Drain Cleaning'],
          bio: 'Professional plumbing services with 10+ years experience',
          locationCity: 'Lagos',
          locationState: 'Lagos',
          latitude: 6.5244,
          longitude: 3.3792,
          verificationStatus: 'verified'
        }
      },
      {
        user: {
          fullName: 'Sarah Electrical Works',
          email: 'sarah.electrical@test.com',
          phone: '+2348012345679',
          password: 'password123'
        },
        profile: {
          businessName: 'Sarah\'s Electrical Works',
          category: 'electrical',
          subcategories: ['Wiring', 'Outlet Installation'],
          bio: 'Licensed electrician specializing in residential and commercial work',
          locationCity: 'Abuja',
          locationState: 'FCT',
          latitude: 9.0765,
          longitude: 7.3986,
          verificationStatus: 'verified'
        }
      },
      {
        user: {
          fullName: 'Mike Cleaning Services',
          email: 'mike.cleaning@test.com',
          phone: '+2348012345680',
          password: 'password123'
        },
        profile: {
          businessName: 'Mike\'s Cleaning Services',
          category: 'cleaning',
          subcategories: ['House Cleaning', 'Office Cleaning'],
          bio: 'Reliable cleaning services for homes and offices',
          locationCity: 'Port Harcourt',
          locationState: 'Rivers',
          latitude: 4.8156,
          longitude: 7.0498,
          verificationStatus: 'verified'
        }
      },
      {
        user: {
          fullName: 'Lisa Moving Company',
          email: 'lisa.moving@test.com',
          phone: '+2348012345681',
          password: 'password123'
        },
        profile: {
          businessName: 'Lisa\'s Moving Company',
          category: 'moving',
          subcategories: ['Local Moving', 'Packing'],
          bio: 'Professional moving services with insurance coverage',
          locationCity: 'Ibadan',
          locationState: 'Oyo',
          latitude: 7.3776,
          longitude: 3.9470,
          verificationStatus: 'verified'
        }
      },
      {
        user: {
          fullName: 'David AC Repair',
          email: 'david.ac@test.com',
          phone: '+2348012345682',
          password: 'password123'
        },
        profile: {
          businessName: 'David\'s AC Repair',
          category: 'ac_repair',
          subcategories: ['AC Installation', 'AC Repair'],
          bio: 'Expert AC repair and installation services',
          locationCity: 'Kano',
          locationState: 'Kano',
          latitude: 12.0022,
          longitude: 8.5920,
          verificationStatus: 'verified'
        }
      }
    ];

    console.log(`📝 Creating ${testProviders.length} test providers...\n`);

    for (let i = 0; i < testProviders.length; i++) {
      const { user: userData, profile: profileData } = testProviders[i];
      
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(userData.password, 12);

        // Create user
        const user = await User.create({
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone,
          passwordHash,
          role: 'provider',
          status: 'active'
        });

        // Create provider profile
        const provider = await ProviderProfile.create({
          userId: user.id,
          businessName: profileData.businessName,
          category: profileData.category,
          subcategories: profileData.subcategories,
          bio: profileData.bio,
          locationCity: profileData.locationCity,
          locationState: profileData.locationState,
          latitude: profileData.latitude,
          longitude: profileData.longitude,
          verificationStatus: profileData.verificationStatus,
          paymentStatus: 'paid'
        });

        console.log(`✅ Created provider ${i + 1}: ${profileData.businessName}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Phone: ${userData.phone}`);
        console.log(`   Category: ${profileData.category}`);
        console.log(`   Location: ${profileData.locationCity}, ${profileData.locationState}`);
        console.log('');

      } catch (error) {
        console.error(`❌ Error creating provider ${i + 1}:`, error.message);
      }
    }

    console.log('🎉 Test providers created successfully!');
    console.log('');
    console.log('📝 NEXT STEPS:');
    console.log('1. Run: node generate-test-referral-codes.js');
    console.log('2. Use the generated referral codes to test the referral system');
    console.log('3. Go to http://localhost:3000/become-provider to test registration with referral codes');

  } catch (error) {
    console.error('❌ Error creating test providers:', error);
  } finally {
    await sequelize.close();
    console.log('\n✅ Database connection closed');
  }
};

// Run the script
createTestProviders();


