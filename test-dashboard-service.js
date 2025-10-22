import { connectToDB } from './database/db.js';
import { ProviderProfile, User } from './schema/index.js';
import dashboardService from './services/dashboardService.js';
import './schema/index.js';

const testDashboardService = async () => {
  try {
    console.log('🧪 Testing Dashboard Service...');
    
    // Connect to database
    await connectToDB();
    console.log('✅ Database connected');
    
    // Get a sample provider
    const sampleProvider = await ProviderProfile.findOne({
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email']
        }
      ],
      limit: 1
    });
    
    if (!sampleProvider) {
      console.log('❌ No provider found');
      return;
    }
    
    console.log(`✅ Found provider: ${sampleProvider.businessName} (ID: ${sampleProvider.id})`);
    
    // Test dashboard stats
    console.log('\n📊 Testing dashboard stats...');
    const stats = await dashboardService.getProviderDashboardStats(sampleProvider.id);
    console.log('Dashboard Stats:', JSON.stringify(stats, null, 2));
    
    // Test recent activities
    console.log('\n📋 Testing recent activities...');
    const activities = await dashboardService.getRecentActivities(sampleProvider.id, 5);
    console.log('Recent Activities:', JSON.stringify(activities, null, 2));
    
    console.log('\n✅ Dashboard service test completed successfully!');
    
  } catch (error) {
    console.error('❌ Dashboard service test failed:', error);
  } finally {
    process.exit(0);
  }
};

testDashboardService();
