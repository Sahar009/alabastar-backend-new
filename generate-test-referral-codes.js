import { User, ProviderProfile } from './schema/index.js';
import ReferralService from './services/referralService.js';
import sequelize from './database/db.js';

const generateTestReferralCodes = async () => {
  try {
    console.log('🚀 Generating test referral codes for existing providers...\n');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Find all providers
    const providers = await ProviderProfile.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    if (providers.length === 0) {
      console.log('❌ No providers found in the database');
      console.log('💡 Please register some providers first using the become-provider form');
      return;
    }

    console.log(`📋 Found ${providers.length} provider(s):\n`);

    const referralCodes = [];

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const user = provider.User;
      
      console.log(`${i + 1}. Provider: ${provider.businessName || 'Unknown'}`);
      console.log(`   User: ${user.fullName} (${user.email})`);
      console.log(`   Category: ${provider.category || 'Unknown'}`);
      console.log(`   Current Referral Code: ${provider.referralCode || 'None'}`);

      try {
        // Generate referral code if one doesn't exist
        if (!provider.referralCode) {
          console.log('   🔧 Generating new referral code...');
          const result = await ReferralService.createReferralCode(provider.id);
          
          if (result.success) {
            console.log(`   ✅ Generated: ${result.referralCode}`);
            referralCodes.push({
              providerName: provider.businessName || user.fullName,
              email: user.email,
              referralCode: result.referralCode,
              category: provider.category
            });
          } else {
            console.log(`   ❌ Failed: ${result.message}`);
          }
        } else {
          console.log(`   ✅ Already has: ${provider.referralCode}`);
          referralCodes.push({
            providerName: provider.businessName || user.fullName,
            email: user.email,
            referralCode: provider.referralCode,
            category: provider.category
          });
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }

    // Display summary
    console.log('🎯 REFERRAL CODES FOR TESTING:\n');
    console.log('=' .repeat(80));
    
    if (referralCodes.length > 0) {
      referralCodes.forEach((ref, index) => {
        console.log(`${index + 1}. ${ref.providerName}`);
        console.log(`   Email: ${ref.email}`);
        console.log(`   Category: ${ref.category}`);
        console.log(`   Referral Code: ${ref.referralCode}`);
        console.log('');
      });

      console.log('📝 HOW TO TEST:');
      console.log('1. Go to the become-provider page');
      console.log('2. Fill out the form');
      console.log('3. Enter one of the referral codes above');
      console.log('4. Complete the registration');
      console.log('5. Check the provider dashboard to see referral stats');
      console.log('');
      
      console.log('🔗 TEST URLS:');
      console.log('- Become Provider: http://localhost:3000/become-provider');
      console.log('- Provider Dashboard: http://localhost:3000/provider/dashboard');
      console.log('- Provider Sign In: http://localhost:3000/provider/signin');
    } else {
      console.log('❌ No referral codes available for testing');
    }

    console.log('=' .repeat(80));

  } catch (error) {
    console.error('❌ Error generating test referral codes:', error);
  } finally {
    await sequelize.close();
    console.log('\n✅ Database connection closed');
  }
};

// Run the script
generateTestReferralCodes();
