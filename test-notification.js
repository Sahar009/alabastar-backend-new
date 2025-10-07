import { User } from './schema/index.js';
import notificationService from './services/notificationService.js';

async function sendTestNotifications() {
  try {
    console.log('🔔 Fetching all users...');
    
    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'email', 'role']
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`📧 Found ${users.length} users`);
    console.log('📤 Sending test notifications...\n');

    // Send notification to each user
    for (const user of users) {
      const result = await notificationService.createNotification({
        userId: user.id,
        title: '🎉 Notification System is Live!',
        body: `Hi ${user.fullName}! Your notification system is now working. You'll receive updates about bookings, payments, and more right here.`,
        type: 'system_alert',
        category: 'system',
        priority: 'normal',
        channels: ['in_app', 'email'],
        actionUrl: '/notifications',
        meta: {
          testNotification: true,
          timestamp: new Date().toISOString()
        },
        sendImmediately: true
      });

      if (result.success) {
        console.log(`✅ Sent to: ${user.fullName} (${user.email}) - ${user.role}`);
      } else {
        console.log(`❌ Failed to send to: ${user.fullName} - ${result.message}`);
      }
    }

    console.log('\n🎉 Test notifications sent successfully!');
    console.log('📱 Check your frontend to see them appear in the bell icon\n');
    
  } catch (error) {
    console.error('❌ Error sending test notifications:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
sendTestNotifications();




