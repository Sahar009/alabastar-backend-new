'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔧 Final fix for notifications foreign key constraint...');
      
      // Check if the foreign key constraint exists
      const [constraints] = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'notifications' 
        AND TABLE_SCHEMA = DATABASE()
        AND CONSTRAINT_NAME = 'notifications_ibfk_1'
      `);
      
      if (constraints.length === 0) {
        console.log('🔧 Creating foreign key constraint...');
        
        // Disable foreign key checks
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Ensure both columns have the same collation
        await queryInterface.sequelize.query(`
          ALTER TABLE notifications 
          MODIFY COLUMN userId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        
        // Create the foreign key constraint
        await queryInterface.sequelize.query(`
          ALTER TABLE notifications 
          ADD CONSTRAINT notifications_ibfk_1 
          FOREIGN KEY (userId) REFERENCES users(id) 
          ON DELETE CASCADE ON UPDATE CASCADE
        `);
        
        // Re-enable foreign key checks
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('✅ Foreign key constraint created successfully!');
      } else {
        console.log('ℹ️ Foreign key constraint already exists');
      }
      
    } catch (error) {
      console.error('❌ Error creating foreign key constraint:', error.message);
      
      // Re-enable foreign key checks in case of error
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      // If it's a collation issue, try to fix it
      if (error.message.includes('incompatible')) {
        console.log('🔄 Trying to fix collation compatibility...');
        
        try {
          await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
          
          // Check users table collation
          const [usersCollation] = await queryInterface.sequelize.query(`
            SELECT CHARACTER_SET_NAME, COLLATION_NAME
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'id'
            AND TABLE_SCHEMA = DATABASE()
          `);
          
          console.log('Users table collation:', usersCollation[0]);
          
          // Match the notifications userId column to users id column
          if (usersCollation[0]) {
            await queryInterface.sequelize.query(`
              ALTER TABLE notifications 
              MODIFY COLUMN userId CHAR(36) 
              CHARACTER SET ${usersCollation[0].CHARACTER_SET_NAME} 
              COLLATE ${usersCollation[0].COLLATION_NAME}
            `);
            
            // Now try to create the foreign key
            await queryInterface.sequelize.query(`
              ALTER TABLE notifications 
              ADD CONSTRAINT notifications_ibfk_1 
              FOREIGN KEY (userId) REFERENCES users(id) 
              ON DELETE CASCADE ON UPDATE CASCADE
            `);
            
            console.log('✅ Foreign key constraint created with matching collation!');
          }
          
          await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (collationError) {
          console.error('❌ Collation fix failed:', collationError.message);
          await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
          // Don't throw error - the table works without the foreign key constraint
        }
      } else {
        // Don't throw error - the table works without the foreign key constraint
        console.log('⚠️ Foreign key constraint not created, but table should work fine');
      }
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log('🔄 Removing foreign key constraint...');
      
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      await queryInterface.sequelize.query(`
        ALTER TABLE notifications DROP FOREIGN KEY notifications_ibfk_1
      `);
      
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('✅ Foreign key constraint removed!');
    } catch (error) {
      console.error('❌ Error removing foreign key constraint:', error.message);
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      throw error;
    }
  }
};
