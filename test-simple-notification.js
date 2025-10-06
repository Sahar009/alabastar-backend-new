import { User, Notification } from './schema/index.js';

async function sendSimpleTestNotifications() {
  try {
    console.log('🔔 Fetching all users...');
    
    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'email', 'role'],
      limit: 5 // Just test with first 5 users
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`📧 Found ${users.length} users`);
    console.log('📤 Creating test notifications directly...\n');

    // Create notifications directly (bypass preferences for testing)
    for (const user of users) {
      const notification = await Notification.create({
        userId: user.id,
        title: 'Notification System is Live!',
        body: `Hi ${user.fullName}! Your notification system is now working. Check it out!`,
        type: 'system_alert',
        category: 'system',
        priority: 'normal',
        channels: ['in_app'],
        isRead: false,
        deliveryStatus: { in_app: 'delivered' },
        actionUrl: '/notifications',
        meta: {
          testNotification: true,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`✅ Created for: ${user.fullName} (${user.email}) - ${user.role}`);
    }

    console.log('\n🎉 Test notifications created successfully!');
    console.log('📱 Now check your frontend:');
    console.log('   1. Start backend: npm run dev');
    console.log('   2. Start frontend: npm run dev (in frontend folder)');
    console.log('   3. Login and click the bell icon 🔔\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run the test
sendSimpleTestNotifications();

