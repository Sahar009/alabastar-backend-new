'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔧 Fixing notifications table collation...');
      
      // Disable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Fix collation for the entire table
      await queryInterface.sequelize.query(`
        ALTER TABLE notifications 
        CONVERT TO CHARACTER SET utf8mb4 
        COLLATE utf8mb4_unicode_ci
      `);
      
      // Specifically fix the userId column to match users table
      await queryInterface.sequelize.query(`
        ALTER TABLE notifications 
        MODIFY COLUMN userId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);
      
      // Re-enable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('✅ Notifications table collation fixed!');
    } catch (error) {
      console.error('❌ Error fixing collation:', error.message);
      
      // Re-enable foreign key checks in case of error
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      // If the error is about foreign key constraints, try a different approach
      if (error.message.includes('foreign key constraint')) {
        console.log('🔄 Trying alternative approach...');
        
        // Drop and recreate the foreign key constraint
        try {
          await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
          
          // Drop the foreign key constraint
          await queryInterface.sequelize.query(`
            ALTER TABLE notifications DROP FOREIGN KEY notifications_ibfk_1
          `);
          
          // Fix the column collation
          await queryInterface.sequelize.query(`
            ALTER TABLE notifications 
            MODIFY COLUMN userId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
          `);
          
          // Recreate the foreign key constraint
          await queryInterface.sequelize.query(`
            ALTER TABLE notifications 
            ADD CONSTRAINT notifications_ibfk_1 
            FOREIGN KEY (userId) REFERENCES users(id) 
            ON DELETE CASCADE ON UPDATE CASCADE
          `);
          
          await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
          console.log('✅ Foreign key constraint recreated successfully!');
        } catch (fkError) {
          console.error('❌ Error recreating foreign key:', fkError.message);
          await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
          throw fkError;
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




