'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔧 Fixing notifications table collation issue...');
      
      // First, let's check what foreign key constraints exist
      const [constraints] = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'notifications' 
        AND TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `);
      
      console.log('📋 Found foreign key constraints:', constraints);
      
      // Disable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Drop all foreign key constraints on notifications table
      for (const constraint of constraints) {
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE notifications DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
          `);
          console.log(`✅ Dropped constraint: ${constraint.CONSTRAINT_NAME}`);
        } catch (dropError) {
          console.log(`⚠️ Could not drop constraint ${constraint.CONSTRAINT_NAME}:`, dropError.message);
        }
      }
      
      // Now fix the collation
      await queryInterface.sequelize.query(`
        ALTER TABLE notifications 
        CONVERT TO CHARACTER SET utf8mb4 
        COLLATE utf8mb4_unicode_ci
      `);
      
      console.log('✅ Table collation updated!');
      
      // Recreate the foreign key constraints
      for (const constraint of constraints) {
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE notifications 
            ADD CONSTRAINT ${constraint.CONSTRAINT_NAME} 
            FOREIGN KEY (${constraint.COLUMN_NAME}) 
            REFERENCES ${constraint.REFERENCED_TABLE_NAME}(${constraint.REFERENCED_COLUMN_NAME}) 
            ON DELETE CASCADE ON UPDATE CASCADE
          `);
          console.log(`✅ Recreated constraint: ${constraint.CONSTRAINT_NAME}`);
        } catch (recreateError) {
          console.log(`⚠️ Could not recreate constraint ${constraint.CONSTRAINT_NAME}:`, recreateError.message);
        }
      }
      
      // Re-enable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('🎉 Notifications table collation fixed successfully!');
      
    } catch (error) {
      console.error('❌ Error fixing collation:', error.message);
      
      // Always re-enable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      // If this is a simple collation issue, try a minimal fix
      if (error.message.includes('collation') || error.message.includes('character set')) {
        console.log('🔄 Trying minimal collation fix...');
        
        try {
          await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
          
          // Just modify the userId column specifically
          await queryInterface.sequelize.query(`
            ALTER TABLE notifications 
            MODIFY COLUMN userId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
          `);
          
          await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
          console.log('✅ Minimal collation fix applied!');
        } catch (minimalError) {
          console.error('❌ Minimal fix also failed:', minimalError.message);
          await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
          throw minimalError;
        }
      } else {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log('🔄 Reverting notifications table collation...');
      
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      await queryInterface.sequelize.query(`
        ALTER TABLE notifications 
        CONVERT TO CHARACTER SET utf8 
        COLLATE utf8_general_ci
      `);
      
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('✅ Collation reverted!');
    } catch (error) {
      console.error('❌ Error reverting collation:', error.message);
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      throw error;
    }
  }
};


