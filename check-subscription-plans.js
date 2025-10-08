import sequelize from './database/db.js';
import { SubscriptionPlan } from './schema/index.js';

async function checkPlans() {
  try {
    console.log('🔍 Checking subscription plans in database...\n');

    const plans = await SubscriptionPlan.findAll({
      attributes: ['id', 'name', 'slug', 'price', 'interval', 'isActive']
    });

    if (plans.length === 0) {
      console.log('❌ No subscription plans found in database!');
      console.log('\n📝 Creating default plans...\n');

      // Create default plans
      const basicPlan = await SubscriptionPlan.create({
        name: 'Basic Plan',
        slug: 'basic-plan',
        description: 'Perfect for getting started',
        price: 5000.00,
        interval: 'monthly',
        features: {
          maxBookings: 10,
          prioritySupport: false,
          analytics: false
        },
        benefits: [
          'Up to 10 bookings per month',
          'Basic customer support',
          'Profile listing',
          'Email notifications'
        ],
        isActive: true
      });

      const proPlan = await SubscriptionPlan.create({
        name: 'Professional Plan',
        slug: 'professional-plan',
        description: 'For growing businesses',
        price: 15000.00,
        interval: 'monthly',
        features: {
          maxBookings: 50,
          prioritySupport: true,
          analytics: true
        },
        benefits: [
          'Up to 50 bookings per month',
          'Priority customer support',
          'Featured profile listing',
          'Email & SMS notifications',
          'Analytics dashboard',
          'Custom branding'
        ],
        isActive: true
      });

      const premiumPlan = await SubscriptionPlan.create({
        name: 'Premium Plan',
        slug: 'premium-plan',
        description: 'For established businesses',
        price: 30000.00,
        interval: 'monthly',
        features: {
          maxBookings: -1, // Unlimited
          prioritySupport: true,
          analytics: true,
          customBranding: true
        },
        benefits: [
          'Unlimited bookings',
          '24/7 Priority support',
          'Premium profile placement',
          'All notification channels',
          'Advanced analytics',
          'Custom branding',
          'API access',
          'Dedicated account manager'
        ],
        isActive: true
      });

      console.log('✅ Created 3 default subscription plans:');
      console.log(`   1. ${basicPlan.name} - ₦${basicPlan.price.toLocaleString()}/${basicPlan.interval}`);
      console.log(`   2. ${proPlan.name} - ₦${proPlan.price.toLocaleString()}/${proPlan.interval}`);
      console.log(`   3. ${premiumPlan.name} - ₦${premiumPlan.price.toLocaleString()}/${premiumPlan.interval}`);
    } else {
      console.log(`✅ Found ${plans.length} subscription plan(s):\n`);
      plans.forEach((plan, index) => {
        console.log(`   ${index + 1}. ${plan.name}`);
        console.log(`      ID: ${plan.id}`);
        console.log(`      Price: ₦${plan.price.toLocaleString()}/${plan.interval}`);
        console.log(`      Active: ${plan.isActive ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkPlans();
