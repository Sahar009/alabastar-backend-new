'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Fix collation mismatch for notifications table
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications 
      CONVERT TO CHARACTER SET utf8mb4 
      COLLATE utf8mb4_unicode_ci
    `);

    console.log('✅ Notifications table collation fixed!');
  },

  async down(queryInterface, Sequelize) {
    // Revert collation (if needed)
    await queryInterface.sequelize.query(`
      ALTER TABLE notifications 
      CONVERT TO CHARACTER SET utf8 
      COLLATE utf8_general_ci
    `);
  }
};

