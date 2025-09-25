import './database/db.js';
import seedProviders from './seed-providers.js';

console.log('🚀 Starting database seeding...');

seedProviders()
  .then(() => {
    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  });

