import bcrypt from 'bcryptjs';
import { User } from './schema/index.js';
import sequelize from './database/db.js';

const createAdminUser = async () => {
  try {
    console.log('🔧 Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: {
        email: 'admin@alabastar.ng',
        role: 'admin'
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email: admin@alabastar.ng');
      console.log('🔑 Password: admin123');
      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('admin123', saltRounds);

    // Create admin user
    const admin = await User.create({
      fullName: 'Alabastar Admin',
      email: 'admin@alabastar.ng',
      passwordHash,
      role: 'admin',
      status: 'active',
      isEmailVerified: true,
      isPhoneVerified: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@alabastar.ng');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
};

// Run the function
createAdminUser().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});


