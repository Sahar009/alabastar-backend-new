'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.includes('device_tokens');

    if (!tableExists) {
      await queryInterface.createTable('device_tokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      platform: {
        type: Sequelize.ENUM('ios', 'android', 'web'),
        allowNull: false
      },
      deviceId: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      deviceName: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      appVersion: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      osVersion: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      lastUsedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
      });

      // Add indexes
      await queryInterface.addIndex('device_tokens', ['userId'], {
        name: 'device_tokens_userId'
      });

      await queryInterface.addIndex('device_tokens', ['isActive'], {
        name: 'device_tokens_isActive'
      });

      await queryInterface.addIndex('device_tokens', ['platform'], {
        name: 'device_tokens_platform'
      });

      await queryInterface.addIndex('device_tokens', ['userId', 'deviceId'], {
        name: 'device_tokens_userId_deviceId',
        unique: true
      });

      console.log('✅ device_tokens table created successfully!');
    } else {
      console.log('ℹ️  device_tokens table already exists, skipping creation');
      
      // Check and add missing indexes
      const indexes = await queryInterface.showIndex('device_tokens');
      const indexNames = indexes.map(idx => idx.name);

      if (!indexNames.includes('device_tokens_userId')) {
        await queryInterface.addIndex('device_tokens', ['userId'], {
          name: 'device_tokens_userId'
        });
      }

      if (!indexNames.includes('device_tokens_isActive')) {
        await queryInterface.addIndex('device_tokens', ['isActive'], {
          name: 'device_tokens_isActive'
        });
      }

      if (!indexNames.includes('device_tokens_platform')) {
        await queryInterface.addIndex('device_tokens', ['platform'], {
          name: 'device_tokens_platform'
        });
      }

      if (!indexNames.includes('device_tokens_userId_deviceId')) {
        await queryInterface.addIndex('device_tokens', ['userId', 'deviceId'], {
          name: 'device_tokens_userId_deviceId',
          unique: true
        });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('device_tokens');
  }
};

