'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🚀 Adding password reset fields to users table...');

      // Check if columns already exist
      const tableInfo = await queryInterface.describeTable('users');
      
      if (!tableInfo.resetPasswordToken) {
        await queryInterface.addColumn('users', 'resetPasswordToken', {
          type: Sequelize.DataTypes.STRING(255),
          allowNull: true,
          comment: 'Hashed reset code for password recovery'
        }, { transaction });
        console.log('✅ resetPasswordToken column added');
      } else {
        console.log('ℹ️ resetPasswordToken column already exists');
      }

      if (!tableInfo.resetPasswordExpires) {
        await queryInterface.addColumn('users', 'resetPasswordExpires', {
          type: Sequelize.DataTypes.DATE,
          allowNull: true,
          comment: 'Expiration time for reset code'
        }, { transaction });
        console.log('✅ resetPasswordExpires column added');
      } else {
        console.log('ℹ️ resetPasswordExpires column already exists');
      }

      console.log('✅ Password reset fields migration completed!');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding password reset fields:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔄 Removing password reset fields from users table...');
      
      const tableInfo = await queryInterface.describeTable('users');
      
      if (tableInfo.resetPasswordToken) {
        await queryInterface.removeColumn('users', 'resetPasswordToken', { transaction });
        console.log('✅ resetPasswordToken column removed');
      }

      if (tableInfo.resetPasswordExpires) {
        await queryInterface.removeColumn('users', 'resetPasswordExpires', { transaction });
        console.log('✅ resetPasswordExpires column removed');
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing password reset fields:', error);
      throw error;
    }
  }
};
