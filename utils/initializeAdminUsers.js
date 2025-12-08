import { User } from '../schema/index.js';
import { hashPassword } from './index.js';

/**
 * Initialize default admin users on server startup
 * Creates support@alabastar.ng and developer@alabastar.ng if they don't exist
 */
export const initializeAdminUsers = async () => {
  try {
    console.log('🔧 Checking for default admin users...');

    const adminUsers = [
      {
        email: 'support@alabastar.ng',
        fullName: 'Alabastar Support',
        password: 'admin123'
      },
      {
        email: 'developer@alabastar.ng',
        fullName: 'Alabastar Developer',
        password: 'admin123'
      }
    ];

    for (const adminData of adminUsers) {
      try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({
          where: {
            email: adminData.email.toLowerCase(),
            role: 'admin'
          }
        });

        if (existingAdmin) {
          console.log(`✅ Admin user already exists: ${adminData.email}`);
          continue;
        }

        // Hash password
        const passwordHash = await hashPassword(adminData.password);

        // Create admin user
        const admin = await User.create({
          fullName: adminData.fullName,
          email: adminData.email.toLowerCase(),
          passwordHash,
          role: 'admin',
          status: 'active',
          isEmailVerified: true,
          isPhoneVerified: true,
          provider: 'email'
        });

        console.log(`✅ Admin user created successfully: ${adminData.email}`);
        console.log(`   📧 Email: ${adminData.email}`);
        console.log(`   🔑 Password: ${adminData.password}`);
        console.log(`   ⚠️  Please change the password after first login`);

      } catch (error) {
        // Handle unique constraint error (email already exists but not as admin)
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.log(`⚠️  User with email ${adminData.email} already exists but is not an admin. Skipping...`);
        } else {
          console.error(`❌ Error creating admin user ${adminData.email}:`, error.message);
        }
      }
    }

    console.log('🎉 Admin users initialization completed!');

  } catch (error) {
    console.error('❌ Error initializing admin users:', error);
    // Don't throw - allow server to start even if admin initialization fails
  }
};


