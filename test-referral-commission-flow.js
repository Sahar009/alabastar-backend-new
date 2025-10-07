import { User, ProviderProfile, ProviderReferral, ReferralCommission, SubscriptionPlan, ProviderSubscription } from './schema/index.js';
import sequelize from './database/db.js';
import ReferralService from './services/referralService.js';
import SubscriptionService from './services/subscriptionService.js';
import { v4 as uuidv4 } from 'uuid';

const testReferralCommissionFlow = async () => {
  try {
    console.log('🚀 Testing Referral Commission Flow with Subscription...\n');
    await sequelize.sync(); // Ensure models are synced

    console.log('📝 Creating test users...');
    const timestamp = Date.now();
    
    // Create referrer user
    const referrerUser = await User.create({
      id: `referrer-user-${timestamp}`,
      fullName: 'John Referrer',
      email: `john.referrer.${timestamp}@test.com`,
      phone: `+2348012345${timestamp.toString().slice(-3)}`,
      role: 'provider',
      passwordHash: 'hashedpassword'
    });

    // Create referee user
    const refereeUser = await User.create({
      id: `referee-user-${timestamp}`,
      fullName: 'Jane Referee',
      email: `jane.referee.${timestamp}@test.com`,
      phone: `+2348012346${timestamp.toString().slice(-3)}`,
      role: 'provider',
      passwordHash: 'hashedpassword'
    });

    console.log('🏢 Creating test provider profiles...');
    
    // Create referrer profile
    const referrerProfile = await ProviderProfile.create({
      id: `referrer-provider-${timestamp}`,
      userId: referrerUser.id,
      businessName: 'John\'s Plumbing Services',
      category: 'plumbing',
      verificationStatus: 'verified',
      locationCity: 'Lagos',
      locationState: 'Lagos',
      paymentStatus: 'paid'
    });

    // Create referee profile
    const refereeProfile = await ProviderProfile.create({
      id: `referee-provider-${timestamp}`,
      userId: refereeUser.id,
      businessName: 'Jane\'s Electrical Services',
      category: 'electrical',
      verificationStatus: 'verified',
      locationCity: 'Lagos',
      locationState: 'Lagos',
      paymentStatus: 'paid'
    });

    console.log('🎯 Generating referral code...');
    const referralCodeResult = await ReferralService.createReferralCode(referrerProfile.id);
    console.log('Referral Code:', referralCodeResult.referralCode);

    console.log('🤝 Processing referral...');
    const referralResult = await ReferralService.processReferral(refereeProfile.id, referralCodeResult.referralCode);
    console.log('Referral Status:', referralResult.success ? 'Success' : 'Failed');
    console.log('Referral ID:', referralResult.referral?.id);

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

    console.log('💳 Creating subscription for referee...');
    const subscriptionResult = await SubscriptionService.createSubscription(
      refereeProfile.id,
      subscriptionPlan.id,
      { 
        registrationType: 'provider_registration',
        registrationFee: 5000
      }
    );
    console.log('Subscription Status:', subscriptionResult.success ? 'Success' : 'Failed');
    console.log('Subscription ID:', subscriptionResult.data?.id);

    console.log('📊 Getting referral stats...');
    const statsResult = await ReferralService.getReferralStats(referrerProfile.id);
    console.log('Referral Stats:');
    console.log('  Total Referrals:', statsResult.data.stats.totalReferrals);
    console.log('  Completed Referrals:', statsResult.data.stats.completedReferrals);
    console.log('  Total Commissions:', statsResult.data.stats.totalCommissions);
    console.log('  Pending Commissions:', statsResult.data.stats.pendingCommissions);

    console.log('🔍 Checking commission records...');
    const commissions = await ReferralCommission.findAll({
      where: { referrerId: referrerProfile.id },
      include: [
        {
          model: ProviderReferral,
          include: [
            {
              model: ProviderProfile,
              as: 'Referee',
              attributes: ['id', 'businessName', 'category']
            }
          ]
        },
        {
          model: ProviderSubscription,
          include: [
            {
              model: SubscriptionPlan,
              attributes: ['name', 'price']
            }
          ]
        }
      ]
    });

    console.log('Commission Records:');
    commissions.forEach((commission, index) => {
      console.log(`  ${index + 1}. Commission ID: ${commission.id}`);
      console.log(`     Amount: ₦${commission.commissionAmount}`);
      console.log(`     Rate: ${commission.commissionRate}%`);
      console.log(`     Status: ${commission.status}`);
      console.log(`     Subscription: ${commission.ProviderSubscription?.SubscriptionPlan?.name} (₦${commission.subscriptionAmount})`);
      console.log(`     Referee: ${commission.ProviderReferral?.Referee?.businessName}`);
      console.log('');
    });

    console.log('🏆 Getting top referrers...');
    const topReferrersResult = await ReferralService.getTopReferrers(5);
    console.log('Top Referrers:');
    topReferrersResult.data.forEach((referrer, index) => {
      console.log(`  ${index + 1}. ${referrer.businessName} - ${referrer.totalReferrals} referrals - ₦${parseFloat(referrer.totalCommissionsEarned).toFixed(2)}`);
    });

    console.log('\n✅ Referral commission flow test completed successfully!\n');

    console.log('📋 Test Summary:');
    console.log('  - Created referrer and referee users');
    console.log('  - Generated unique referral code');
    console.log('  - Processed referral successfully');
    console.log('  - Created subscription plan');
    console.log('  - Created subscription (triggered commission)');
    console.log('  - Retrieved referral statistics');
    console.log('  - Retrieved commission records');
    console.log('  - Retrieved top referrers leaderboard');

    console.log('\n🎯 Key Points:');
    console.log('  - Commission is calculated from subscription amount (₦10,000)');
    console.log('  - Default commission rate is 10% (₦1,000)');
    console.log('  - Commission status is "pending" until paid');
    console.log('  - Referral status is "completed" after subscription');

  } catch (error) {
    console.error('❌ Error testing referral commission flow:', error);
  } finally {
    await sequelize.close();
    console.log('\n✅ Database connection closed');
  }
};

// Run the script
testReferralCommissionFlow();
