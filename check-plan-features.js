import sequelize from './database/db.js';
import { SubscriptionPlan } from './schema/index.js';

async function checkPlanFeatures() {
  try {
    console.log('🔍 Checking subscription plan features...\n');

    const plans = await SubscriptionPlan.findAll({
      attributes: ['id', 'name', 'slug', 'price', 'interval', 'features', 'isActive']
    });

    if (plans.length === 0) {
      console.log('❌ No subscription plans found!');
      return;
    }

    console.log(`✅ Found ${plans.length} subscription plan(s):\n`);
    
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name} (${plan.slug})`);
      console.log(`   Price: ₦${plan.price.toLocaleString()}/${plan.interval}`);
      console.log(`   Active: ${plan.isActive ? 'Yes' : 'No'}`);
      
      if (plan.features) {
        console.log(`   Features:`);
        console.log(`      📸 Max Photos: ${plan.features.maxPhotos || 0}`);
        console.log(`      🎥 Max Videos: ${plan.features.maxVideos || 0}`);
        console.log(`      ⏱️  Video Duration: ${plan.features.videoMaxDuration || 0}s`);
        console.log(`      ⭐ Top Listing: ${plan.features.topListingDays || 0} days`);
        console.log(`      🎁 Rewards: ${plan.features.rewardsAccess?.join(', ') || 'None'}`);
        console.log(`      📺 Promotion Channels: ${plan.features.promotionChannels?.join(', ') || 'None'}`);
        console.log(`      🎪 Promotion Events: ${plan.features.promotionEvents?.join(', ') || 'None'}`);
        console.log(`      🔢 Priority: ${plan.features.priority || 1}`);
      } else {
        console.log(`   ⚠️  Features: Not configured`);
      }
      console.log('');
    });

    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkPlanFeatures();

