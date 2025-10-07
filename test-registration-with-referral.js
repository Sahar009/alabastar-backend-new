import { User, ProviderProfile, ProviderReferral, ReferralCommission, SubscriptionPlan, ProviderSubscription } from './schema/index.js';
import sequelize from './database/db.js';
import ReferralService from './services/referralService.js';
import SubscriptionService from './services/subscriptionService.js';
import ProviderService from './services/providerService.js';

const testRegistrationWithReferral = async () => {
  try {
    console.log('🚀 Testing Provider Registration with Referral Code...\n');
    await sequelize.sync();

    const timestamp = Date.now();

    // Step 1: Get an existing provider with a referral code
    console.log('📋 Step 1: Finding existing provider with referral code...');
    const existingProvider = await ProviderProfile.findOne({
      where: {
        referralCode: { [sequelize.Sequelize.Op.ne]: null }
      },
      include: [{ model: User }]
    });

    if (!existingProvider) {
      console.log('❌ No existing provider found with referral code');
      console.log('💡 Run: npm run generate-test-codes first');
      process.exit(1);
    }

    console.log(`✅ Found referrer: ${existingProvider.businessName || existingProvider.User.fullName}`);
    console.log(`   Referral Code: ${existingProvider.referralCode}`);
    console.log(`   Provider ID: ${existingProvider.id}`);

    // Step 2: Simulate provider registration with referral code
    console.log('\n📝 Step 2: Simulating new provider registration...');
    
    const newProviderData = {
      fullName: 'Test Referee Provider',
      email: `test.referee.${timestamp}@test.com`,
      phone: `+234801234${timestamp.toString().slice(-4)}`,
      password: 'password123',
      businessName: 'Test Referee Business',
      category: 'electrical',
      subcategories: ['Wiring', 'Outlet Installation'],
      bio: 'Test provider referred by ' + existingProvider.businessName,
      locationCity: 'Lagos',
      locationState: 'Lagos',
      latitude: '6.5244',
      longitude: '3.3792',
      referralCode: existingProvider.referralCode, // Use referral code
      documents: [],
      brandImages: []
    };

    // Register the provider
    const registrationResult = await ProviderService.registerProvider(newProviderData);
    
    console.log(`✅ Provider registered: ${registrationResult.providerProfile.id}`);
    console.log(`   User ID: ${registrationResult.user.id}`);
    console.log(`   Business Name: ${registrationResult.providerProfile.businessName}`);

    // Step 3: Check if referral was processed
    console.log('\n🔍 Step 3: Checking if referral was processed...');
    const referral = await ProviderReferral.findOne({
      where: {
        refereeId: registrationResult.providerProfile.id,
        referrerId: existingProvider.id
      }
    });

    if (referral) {
      console.log(`✅ Referral record created:`);
      console.log(`   Referral ID: ${referral.id}`);
      console.log(`   Status: ${referral.status}`);
      console.log(`   Commission Rate: ${referral.commissionRate}%`);
    } else {
      console.log('❌ No referral record found!');
    }

    // Step 4: Check if subscription was created
    console.log('\n📦 Step 4: Checking subscription...');
    const subscription = await ProviderSubscription.findOne({
      where: { providerId: registrationResult.providerProfile.id },
      include: [{ model: SubscriptionPlan }]
    });

    if (subscription) {
      console.log(`✅ Subscription created:`);
      console.log(`   Subscription ID: ${subscription.id}`);
      console.log(`   Plan: ${subscription.SubscriptionPlan.name}`);
      console.log(`   Price: ₦${subscription.SubscriptionPlan.price}`);
      console.log(`   Status: ${subscription.status}`);
    } else {
      console.log('❌ No subscription found!');
    }

    // Step 5: Check if commission was created
    console.log('\n💰 Step 5: Checking commission record...');
    const commission = await ReferralCommission.findOne({
      where: {
        referralId: referral?.id
      }
    });

    if (commission) {
      console.log(`✅ Commission created:`);
      console.log(`   Commission ID: ${commission.id}`);
      console.log(`   Amount: ₦${commission.commissionAmount}`);
      console.log(`   Rate: ${commission.commissionRate}%`);
      console.log(`   Status: ${commission.status}`);
    } else {
      console.log('❌ No commission record found!');
      console.log('\n🔍 Debugging information:');
      console.log(`   Referral exists: ${!!referral}`);
      console.log(`   Referral status: ${referral?.status}`);
      console.log(`   Subscription exists: ${!!subscription}`);
      console.log(`   Subscription ID: ${subscription?.id}`);
      
      // Check provider's referredBy field
      const referee = await ProviderProfile.findByPk(registrationResult.providerProfile.id);
      console.log(`   Provider referredBy: ${referee.referredBy}`);
      
      // Try to manually process commission
      console.log('\n🔧 Attempting to manually process commission...');
      try {
        const commissionResult = await ReferralService.processCommission(subscription.id);
        console.log('Commission processing result:', commissionResult);
      } catch (error) {
        console.error('Error processing commission:', error.message);
      }
    }

    // Step 6: Check referrer's stats
    console.log('\n📊 Step 6: Checking referrer stats...');
    const updatedReferrer = await ProviderProfile.findByPk(existingProvider.id);
    console.log(`   Total Referrals: ${updatedReferrer.totalReferrals}`);
    console.log(`   Total Commissions Earned: ₦${updatedReferrer.totalCommissionsEarned}`);

    console.log('\n✅ Test completed!\n');

  } catch (error) {
    console.error('❌ Error testing registration with referral:', error);
  } finally {
    await sequelize.close();
  }
};

testRegistrationWithReferral();
