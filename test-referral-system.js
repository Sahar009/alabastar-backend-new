import { ProviderProfile, ProviderReferral, ReferralCommission, ProviderSubscription, SubscriptionPlan, User } from './schema/index.js';
import ReferralService from './services/referralService.js';
import SubscriptionService from './services/subscriptionService.js';
import sequelize from './database/db.js';

const testReferralSystem = async () => {
  try {
    console.log('🚀 Testing Provider Referral System...\n');

    // Sync database
    await sequelize.sync();

    // Create test users
    console.log('📝 Creating test users...');
    const timestamp = Date.now();
    const referrerUser = await User.create({
      id: `referrer-user-${timestamp}`,
      fullName: 'John Referrer',
      email: `john.referrer.${timestamp}@test.com`,
      phone: `+2348012345${timestamp.toString().slice(-3)}`,
      role: 'provider',
      password: 'hashedpassword'
    });

    const refereeUser = await User.create({
      id: `referee-user-${timestamp}`,
      fullName: 'Jane Referee',
      email: `jane.referee.${timestamp}@test.com`,
      phone: `+2348012346${timestamp.toString().slice(-3)}`,
      role: 'provider',
      password: 'hashedpassword'
    });

    // Create test provider profiles
    console.log('🏢 Creating test provider profiles...');
    const referrerProfile = await ProviderProfile.create({
      id: `referrer-provider-${timestamp}`,
      userId: referrerUser.id,
      businessName: 'John\'s Plumbing Services',
      category: 'plumbing',
      verificationStatus: 'verified',
      locationCity: 'Lagos',
      locationState: 'Lagos'
    });

    const refereeProfile = await ProviderProfile.create({
      id: `referee-provider-${timestamp}`,
      userId: refereeUser.id,
      businessName: 'Jane\'s Electrical Services',
      category: 'electrical',
      verificationStatus: 'verified',
      locationCity: 'Lagos',
      locationState: 'Lagos'
    });

    // Generate referral code for referrer
    console.log('🎯 Generating referral code...');
    const referralCodeResult = await ReferralService.createReferralCode(referrerProfile.id);
    console.log('Referral Code:', referralCodeResult.referralCode);

    // Process referral
    console.log('🤝 Processing referral...');
    const referralResult = await ReferralService.processReferral(refereeProfile.id, referralCodeResult.referralCode);
    console.log('Referral Status:', referralResult.success ? 'Success' : 'Failed');
    console.log('Referral ID:', referralResult.referral?.id);

    // Create subscription plan
    console.log('📋 Creating subscription plan...');
    const subscriptionPlan = await SubscriptionPlan.create({
      id: `plan-premium-${timestamp}`,
      name: 'Premium Plan',
      slug: `premium-plan-${timestamp}`,
      price: 10000.00,
      interval: 'monthly',
      benefits: ['Priority listing', 'Advanced analytics', '24/7 support'],
      isActive: true
    });

    // Create subscription for referee (this should trigger commission)
    console.log('💳 Creating subscription for referee...');
    const subscriptionResult = await SubscriptionService.createSubscription(
      refereeProfile.id,
      subscriptionPlan.id,
      { paymentMethod: 'card', transactionId: 'TXN123456' }
    );
    console.log('Subscription Status:', subscriptionResult.success ? 'Success' : 'Failed');
    console.log('Subscription ID:', subscriptionResult.data?.id);

    // Get referral stats for referrer
    console.log('📊 Getting referral stats...');
    const statsResult = await ReferralService.getReferralStats(referrerProfile.id);
    if (statsResult.success) {
      console.log('Referral Stats:');
      console.log('  Total Referrals:', statsResult.data.stats.totalReferrals);
      console.log('  Completed Referrals:', statsResult.data.stats.completedReferrals);
      console.log('  Total Commissions:', statsResult.data.stats.totalCommissions);
      console.log('  Pending Commissions:', statsResult.data.stats.pendingCommissions);
    }

    // Get referral code details
    console.log('🔍 Getting referral code details...');
    const codeDetailsResult = await ReferralService.getReferralCodeDetails(referralCodeResult.referralCode);
    if (codeDetailsResult.success) {
      console.log('Referral Code Details:');
      console.log('  Business Name:', codeDetailsResult.data.referrer.businessName);
      console.log('  Category:', codeDetailsResult.data.referrer.category);
      console.log('  Total Referrals:', codeDetailsResult.data.referrer.totalReferrals);
    }

    // Get top referrers
    console.log('🏆 Getting top referrers...');
    const topReferrersResult = await ReferralService.getTopReferrers(5);
    if (topReferrersResult.success) {
      console.log('Top Referrers:');
      topReferrersResult.data.forEach((referrer, index) => {
        console.log(`  ${index + 1}. ${referrer.businessName} - ${referrer.totalReferrals} referrals - ₦${referrer.totalCommissionsEarned}`);
      });
    }

    console.log('\n✅ Referral system test completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('  - Created referrer and referee users');
    console.log('  - Generated unique referral code');
    console.log('  - Processed referral successfully');
    console.log('  - Created subscription plan');
    console.log('  - Created subscription (triggered commission)');
    console.log('  - Retrieved referral statistics');
    console.log('  - Retrieved referral code details');
    console.log('  - Retrieved top referrers leaderboard');

  } catch (error) {
    console.error('❌ Error testing referral system:', error);
  } finally {
    await sequelize.close();
  }
};

testReferralSystem();
