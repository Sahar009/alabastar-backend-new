'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🚀 Creating provider referral system tables...');

      // Create provider_referrals table
      await queryInterface.createTable('provider_referrals', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        referrerId: {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'Provider who made the referral'
        },
        refereeId: {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'Provider who was referred'
        },
        referralCode: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true,
          comment: 'Unique referral code used'
        },
        status: {
          type: Sequelize.ENUM('pending', 'completed', 'cancelled'),
          defaultValue: 'pending',
          allowNull: false,
          comment: 'Status of the referral'
        },
        completedAt: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the referee completed subscription'
        },
        commissionRate: {
          type: Sequelize.DECIMAL(5,2),
          allowNull: false,
          defaultValue: 10.00,
          comment: 'Commission percentage (e.g., 10.00 for 10%)'
        },
        subscriptionId: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'Reference to the subscription that triggered commission'
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Additional referral data'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

      // Create referral_commissions table
      await queryInterface.createTable('referral_commissions', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        referralId: {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'Reference to the ProviderReferral'
        },
        referrerId: {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'Provider who earned the commission'
        },
        subscriptionId: {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'Subscription that generated the commission'
        },
        subscriptionAmount: {
          type: Sequelize.DECIMAL(10,2),
          allowNull: false,
          comment: 'Original subscription amount'
        },
        commissionRate: {
          type: Sequelize.DECIMAL(5,2),
          allowNull: false,
          comment: 'Commission percentage applied'
        },
        commissionAmount: {
          type: Sequelize.DECIMAL(10,2),
          allowNull: false,
          comment: 'Calculated commission amount'
        },
        status: {
          type: Sequelize.ENUM('pending', 'paid', 'cancelled'),
          defaultValue: 'pending',
          allowNull: false,
          comment: 'Commission payment status'
        },
        paidAt: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the commission was paid'
        },
        paymentMethod: {
          type: Sequelize.ENUM('wallet', 'bank_transfer', 'mobile_money'),
          allowNull: true,
          comment: 'How the commission was paid'
        },
        paymentReference: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Payment reference number'
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Additional commission data'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

      // Add referral fields to provider_profiles table
      await queryInterface.addColumn('provider_profiles', 'referralCode', {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
        comment: 'Unique referral code for this provider'
      });

      await queryInterface.addColumn('provider_profiles', 'referredBy', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Provider who referred this provider'
      });

      await queryInterface.addColumn('provider_profiles', 'totalReferrals', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Total number of successful referrals'
      });

      await queryInterface.addColumn('provider_profiles', 'totalCommissionsEarned', {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 0.00,
        allowNull: false,
        comment: 'Total commissions earned from referrals'
      });

      await queryInterface.addColumn('provider_profiles', 'referralSettings', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Referral preferences and settings'
      });

      // Create indexes for provider_referrals
      await queryInterface.addIndex('provider_referrals', ['referrerId']);
      await queryInterface.addIndex('provider_referrals', ['refereeId']);
      await queryInterface.addIndex('provider_referrals', ['referralCode']);
      await queryInterface.addIndex('provider_referrals', ['status']);
      await queryInterface.addIndex('provider_referrals', ['completedAt']);
      await queryInterface.addIndex('provider_referrals', ['referrerId', 'refereeId'], { unique: true });

      // Create indexes for referral_commissions
      await queryInterface.addIndex('referral_commissions', ['referralId']);
      await queryInterface.addIndex('referral_commissions', ['referrerId']);
      await queryInterface.addIndex('referral_commissions', ['subscriptionId']);
      await queryInterface.addIndex('referral_commissions', ['status']);
      await queryInterface.addIndex('referral_commissions', ['paidAt']);
      await queryInterface.addIndex('referral_commissions', ['createdAt']);

      // Create indexes for provider_profiles referral fields
      await queryInterface.addIndex('provider_profiles', ['referralCode']);
      await queryInterface.addIndex('provider_profiles', ['referredBy']);
      await queryInterface.addIndex('provider_profiles', ['totalReferrals']);

      console.log('✅ Provider referral system tables created successfully!');
    } catch (error) {
      console.error('❌ Error creating referral system tables:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log('🔄 Dropping provider referral system tables...');

      // Drop indexes first
      await queryInterface.removeIndex('provider_profiles', ['totalReferrals']);
      await queryInterface.removeIndex('provider_profiles', ['referredBy']);
      await queryInterface.removeIndex('provider_profiles', ['referralCode']);

      await queryInterface.removeIndex('referral_commissions', ['createdAt']);
      await queryInterface.removeIndex('referral_commissions', ['paidAt']);
      await queryInterface.removeIndex('referral_commissions', ['status']);
      await queryInterface.removeIndex('referral_commissions', ['subscriptionId']);
      await queryInterface.removeIndex('referral_commissions', ['referrerId']);
      await queryInterface.removeIndex('referral_commissions', ['referralId']);

      await queryInterface.removeIndex('provider_referrals', ['referrerId', 'refereeId']);
      await queryInterface.removeIndex('provider_referrals', ['completedAt']);
      await queryInterface.removeIndex('provider_referrals', ['status']);
      await queryInterface.removeIndex('provider_referrals', ['referralCode']);
      await queryInterface.removeIndex('provider_referrals', ['refereeId']);
      await queryInterface.removeIndex('provider_referrals', ['referrerId']);

      // Drop tables
      await queryInterface.dropTable('referral_commissions');
      await queryInterface.dropTable('provider_referrals');

      // Remove columns from provider_profiles
      await queryInterface.removeColumn('provider_profiles', 'referralSettings');
      await queryInterface.removeColumn('provider_profiles', 'totalCommissionsEarned');
      await queryInterface.removeColumn('provider_profiles', 'totalReferrals');
      await queryInterface.removeColumn('provider_profiles', 'referredBy');
      await queryInterface.removeColumn('provider_profiles', 'referralCode');

      console.log('✅ Provider referral system tables dropped successfully!');
    } catch (error) {
      console.error('❌ Error dropping referral system tables:', error);
      throw error;
    }
  }
};


