'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🔧 Fixing database collation for emoji support...');
      
      // Disable foreign key checks temporarily
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
      console.log('🔓 Foreign key checks disabled');
      
      // Update database charset and collation
      await queryInterface.sequelize.query('ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
      console.log('✅ Database charset updated to utf8mb4');
      
      // Update users table first (parent table)
      try {
        await queryInterface.sequelize.query('ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
        console.log('✅ Users table updated to utf8mb4');
      } catch (error) {
        console.log('⚠️ Users table update skipped:', error.message);
      }
      
      // Update conversations table
      try {
        await queryInterface.sequelize.query('ALTER TABLE conversations CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
        console.log('✅ Conversations table updated to utf8mb4');
      } catch (error) {
        console.log('⚠️ Conversations table update skipped:', error.message);
      }
      
      // Update conversation_participants table
      try {
        await queryInterface.sequelize.query('ALTER TABLE conversation_participants CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
        console.log('✅ Conversation participants table updated to utf8mb4');
      } catch (error) {
        console.log('⚠️ Conversation participants table update skipped:', error.message);
      }
      
      // Update messages table
      try {
        await queryInterface.sequelize.query('ALTER TABLE messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
        console.log('✅ Messages table updated to utf8mb4');
      } catch (error) {
        console.log('⚠️ Messages table update skipped:', error.message);
      }
      
      // Update message_read_receipts table
      try {
        await queryInterface.sequelize.query('ALTER TABLE message_read_receipts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
        console.log('✅ Message read receipts table updated to utf8mb4');
      } catch (error) {
        console.log('⚠️ Message read receipts table update skipped:', error.message);
      }
      
      // Update message_reactions table
      try {
        await queryInterface.sequelize.query('ALTER TABLE message_reactions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
        console.log('✅ Message reactions table updated to utf8mb4');
      } catch (error) {
        console.log('⚠️ Message reactions table update skipped:', error.message);
      }
      
      // Re-enable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
      console.log('🔒 Foreign key checks re-enabled');
      
      console.log('🎉 Database collation update completed!');
      
    } catch (error) {
      console.error('❌ Error updating database collation:', error);
      // Re-enable foreign key checks even if there's an error
      try {
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
      } catch (fkError) {
        console.error('❌ Error re-enabling foreign key checks:', fkError);
      }
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Reverting database collation changes...');
      
      // Disable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
      
      // Revert to utf8_general_ci (not recommended for production)
      await queryInterface.sequelize.query('ALTER DATABASE CHARACTER SET utf8 COLLATE utf8_general_ci;');
      
      // Revert tables in reverse order
      await queryInterface.sequelize.query('ALTER TABLE message_reactions CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;');
      await queryInterface.sequelize.query('ALTER TABLE message_read_receipts CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;');
      await queryInterface.sequelize.query('ALTER TABLE messages CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;');
      await queryInterface.sequelize.query('ALTER TABLE conversation_participants CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;');
      await queryInterface.sequelize.query('ALTER TABLE conversations CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;');
      await queryInterface.sequelize.query('ALTER TABLE users CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;');
      
      // Re-enable foreign key checks
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
      
      console.log('⚠️ Database reverted to utf8 (emoji support disabled)');
      
    } catch (error) {
      console.error('❌ Error reverting database collation:', error);
      throw error;
    }
  }
};
