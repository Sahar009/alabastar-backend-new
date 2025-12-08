import { User } from '../schema/index.js';
import sequelize from '../database/db.js';

/**
 * Check if admin users exist in the database
 * Run this script to diagnose admin login issues
 */
const checkAdminUsers = async () => {
  try {
    console.log('🔍 Checking admin users in database...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected successfully\n');

    // Check for admin users
    const adminUsers = await User.findAll({
      where: {
        role: 'admin'
      },
      attributes: ['id', 'email', 'fullName', 'role', 'status', 'isEmailVerified', 'createdAt']
    });

    console.log(`📊 Found ${adminUsers.length} admin user(s):\n`);

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in database!');
      console.log('💡 Run the server to auto-create admin users, or use the /api/admin/auth/create endpoint\n');
    } else {
      adminUsers.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Name: ${admin.fullName}`);
        console.log(`   Status: ${admin.status}`);
        console.log(`   Email Verified: ${admin.isEmailVerified}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log('');
      });

      // Check for specific admin emails
      const requiredAdmins = ['support@alabastar.ng', 'developer@alabastar.ng'];
      console.log('🔍 Checking for required admin emails:\n');

      for (const email of requiredAdmins) {
        const admin = await User.findOne({
          where: {
            email: email.toLowerCase(),
            role: 'admin'
          }
        });

        if (admin) {
          console.log(`✅ ${email} - EXISTS (Status: ${admin.status})`);
        } else {
          console.log(`❌ ${email} - NOT FOUND`);
        }
      }
    }

    console.log('\n✅ Check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
    process.exit(1);
  }
};

checkAdminUsers();


