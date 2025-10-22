import SubscriptionExpirationService from './services/subscriptionExpirationService.js';
import { connectToDB } from './database/db.js';
import { ProviderSubscription, ProviderProfile, User, Notification } from './schema/index.js';
import './schema/index.js';

const testNotificationSystem = async () => {
  try {
    console.log('🧪 Testing Notification System...');
    
    // Connect to database
    await connectToDB();
    console.log('✅ Database connected');
    
    // Create service instance
    const expirationService = new SubscriptionExpirationService();
    
    // Test 1: Check existing notifications
    console.log('\n📊 Checking existing subscription notifications...');
    const existingNotifications = await Notification.findAll({
      where: {
        type: {
          [require('sequelize').Op.like]: 'subscription_%'
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    console.log(`Found ${existingNotifications.length} existing subscription notifications:`);
    existingNotifications.forEach(notif => {
      console.log(`- ${notif.type}: "${notif.title}" (${notif.createdAt})`);
    });
    
    // Test 2: Get a sample subscription to test with
    console.log('\n🔍 Finding a sample subscription to test with...');
    const sampleSubscription = await ProviderSubscription.findOne({
      where: { status: 'active' },
      include: [
        {
          model: ProviderProfile,
          attributes: ['id', 'businessName', 'userId'],
          include: [
            {
              model: User,
              attributes: ['id', 'fullName', 'email']
            }
          ]
        },
        {
          model: require('./schema/index.js').SubscriptionPlan,
          attributes: ['id', 'name', 'price']
        }
      ]
    });
    
    if (!sampleSubscription) {
      console.log('❌ No active subscriptions found to test with');
      return;
    }
    
    console.log(`✅ Found sample subscription: ${sampleSubscription.id}`);
    console.log(`   Provider: ${sampleSubscription.ProviderProfile?.businessName}`);
    console.log(`   User: ${sampleSubscription.ProviderProfile?.User?.fullName}`);
    console.log(`   Plan: ${sampleSubscription.SubscriptionPlan?.name}`);
    console.log(`   Expires: ${sampleSubscription.currentPeriodEnd}`);
    
    // Test 3: Test notification creation methods
    console.log('\n📧 Testing notification creation methods...');
    
    // Test expiration notification
    console.log('Testing expiration notification...');
    await expirationService.sendExpirationNotification(sampleSubscription);
    
    // Test upcoming expiration notification
    console.log('Testing upcoming expiration notification (7 days)...');
    await expirationService.sendUpcomingExpirationNotification(sampleSubscription, 7);
    
    // Test grace period expiration notification
    console.log('Testing grace period expiration notification...');
    await expirationService.sendGracePeriodExpirationNotification(sampleSubscription);
    
    // Test 4: Check if notifications were created
    console.log('\n📋 Checking if notifications were created...');
    const newNotifications = await Notification.findAll({
      where: {
        userId: sampleSubscription.ProviderProfile?.User?.id,
        type: {
          [require('sequelize').Op.like]: 'subscription_%'
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    console.log(`Found ${newNotifications.length} notifications for user:`);
    newNotifications.forEach(notif => {
      console.log(`- ${notif.type}: "${notif.title}"`);
      console.log(`  Message: "${notif.message}"`);
      console.log(`  Created: ${notif.createdAt}`);
      console.log(`  Read: ${notif.isRead}`);
      console.log('');
    });
    
    // Test 5: Test notification data structure
    console.log('\n🔍 Testing notification data structure...');
    if (newNotifications.length > 0) {
      const latestNotification = newNotifications[0];
      console.log('Latest notification data:');
      console.log(JSON.stringify(latestNotification.data, null, 2));
    }
    
    // Test 6: Test notification types
    console.log('\n📝 Testing notification types...');
    const notificationTypes = await Notification.findAll({
      attributes: ['type'],
      where: {
        type: {
          [require('sequelize').Op.like]: 'subscription_%'
        }
      },
      group: ['type'],
      raw: true
    });
    
    console.log('Available subscription notification types:');
    notificationTypes.forEach(type => {
      console.log(`- ${type.type}`);
    });
    
    console.log('\n✅ Notification system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Notification system test failed:', error);
  } finally {
    process.exit(0);
  }
};

testNotificationSystem();
