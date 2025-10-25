import { ProviderProfile, ProviderReferral, ReferralCommission, ProviderSubscription, SubscriptionPlan } from '../schema/index.js';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

class ReferralService {
  /**
   * Generate a unique referral code for a provider
   */
  static generateReferralCode(providerId, businessName) {
    // Create a short code from business name + random string
    const businessPrefix = businessName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 4)
      .toUpperCase();
    
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${businessPrefix}${randomSuffix}`;
  }

  /**
   * Create or update referral code for a provider
   */
  static async createReferralCode(providerId) {
    try {
      const provider = await ProviderProfile.findByPk(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      // Generate unique referral code
      let referralCode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        referralCode = this.generateReferralCode(providerId, provider.businessName);
        
        // Check if code already exists
        const existingProvider = await ProviderProfile.findOne({
          where: { referralCode }
        });
        
        if (!existingProvider) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        // Fallback to UUID-based code
        referralCode = `REF${providerId.substring(0, 8).toUpperCase()}`;
      }

      // Update provider with referral code
      await provider.update({ referralCode });

      return {
        success: true,
        referralCode,
        message: 'Referral code created successfully'
      };
    } catch (error) {
      console.error('Error creating referral code:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Process a referral when a new provider signs up
   */
  static async processReferral(refereeId, referralCode) {
    try {
      // Find the referrer by referral code
      const referrer = await ProviderProfile.findOne({
        where: { referralCode }
      });

      if (!referrer) {
        throw new Error('Invalid referral code');
      }

      if (referrer.id === refereeId) {
        throw new Error('Cannot refer yourself');
      }

      // Check if referral already exists
      const existingReferral = await ProviderReferral.findOne({
        where: {
          referrerId: referrer.id,
          refereeId: refereeId
        }
      });

      if (existingReferral) {
        throw new Error('Referral already exists');
      }

      // Create referral record
      const referral = await ProviderReferral.create({
        referrerId: referrer.id,
        refereeId: refereeId,
        referralCode: referralCode,
        status: 'pending',
        commissionRate: 10.00 // Default 10% commission
      });

      // Update referee's profile
      await ProviderProfile.update(
        { referredBy: referrer.id },
        { where: { id: refereeId } }
      );

      return {
        success: true,
        referral,
        referrer: {
          id: referrer.id,
          businessName: referrer.businessName,
          referralCode: referrer.referralCode
        },
        message: 'Referral processed successfully'
      };
    } catch (error) {
      console.error('Error processing referral:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Process commission when referee subscribes
   */
  static async processCommission(subscriptionId) {
    try {
      const subscription = await ProviderSubscription.findByPk(subscriptionId, {
        include: [
          {
            model: ProviderProfile
          },
          {
            model: SubscriptionPlan
          }
        ]
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const referee = subscription.ProviderProfile;
      if (!referee.referredBy) {
        return {
          success: true,
          message: 'No referral found for this subscription'
        };
      }

      // Find the referral record
      const referral = await ProviderReferral.findOne({
        where: {
          referrerId: referee.referredBy,
          refereeId: referee.id,
          status: 'pending'
        }
      });

      if (!referral) {
        throw new Error('Referral record not found');
      }

      // Calculate commission
      const subscriptionAmount = subscription.SubscriptionPlan.price;
      const commissionRate = referral.commissionRate;
      const commissionAmount = (subscriptionAmount * commissionRate) / 100;

      // Create commission record
      const commission = await ReferralCommission.create({
        referralId: referral.id,
        referrerId: referral.referrerId,
        subscriptionId: subscription.id,
        subscriptionAmount: subscriptionAmount,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        status: 'pending'
      });

      // Update referral status
      await referral.update({
        status: 'completed',
        completedAt: new Date(),
        subscriptionId: subscription.id
      });

      // Update referrer's stats
      await ProviderProfile.increment('totalReferrals', {
        where: { id: referral.referrerId }
      });

      await ProviderProfile.increment('totalCommissionsEarned', {
        by: commissionAmount,
        where: { id: referral.referrerId }
      });

      return {
        success: true,
        commission,
        message: 'Commission processed successfully'
      };
    } catch (error) {
      console.error('Error processing commission:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get referral statistics for a provider
   */
  static async getReferralStats(providerId) {
    try {
      const provider = await ProviderProfile.findByPk(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      // Get referrals made
      const referralsMade = await ProviderReferral.findAll({
        where: { referrerId: providerId },
        include: [
          {
            model: ProviderProfile,
            as: 'Referee',
            attributes: ['id', 'businessName', 'category']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Get commissions earned
      const commissions = await ReferralCommission.findAll({
        where: { referrerId: providerId },
        include: [
          {
            model: ProviderSubscription,
            include: [
              {
                model: SubscriptionPlan,
                attributes: ['name', 'price']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Calculate stats
      const totalReferrals = referralsMade.length;
      const completedReferrals = referralsMade.filter(r => r.status === 'completed').length;
      const pendingReferrals = referralsMade.filter(r => r.status === 'pending').length;
      const totalCommissions = commissions.reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
      const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
      const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);

      return {
        success: true,
        data: {
          provider: {
            id: provider.id,
            businessName: provider.businessName,
            referralCode: provider.referralCode,
            totalReferrals: provider.totalReferrals,
            totalCommissionsEarned: provider.totalCommissionsEarned
          },
          stats: {
            totalReferrals,
            completedReferrals,
            pendingReferrals,
            totalCommissions,
            pendingCommissions,
            paidCommissions
          },
          referralsMade,
          commissions
        }
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get referral code details
   */
  static async getReferralCodeDetails(referralCode) {
    try {
      const provider = await ProviderProfile.findOne({
        where: { referralCode },
        attributes: ['id', 'businessName', 'category', 'referralCode', 'totalReferrals']
      });

      if (!provider) {
        throw new Error('Invalid referral code');
      }

      return {
        success: true,
        data: {
          referrer: {
            id: provider.id,
            businessName: provider.businessName,
            category: provider.category,
            referralCode: provider.referralCode,
            totalReferrals: provider.totalReferrals
          }
        }
      };
    } catch (error) {
      console.error('Error getting referral code details:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Pay out commissions
   */
  static async payCommission(commissionId, paymentMethod = 'wallet', paymentReference = null) {
    try {
      const commission = await ReferralCommission.findByPk(commissionId);
      if (!commission) {
        throw new Error('Commission not found');
      }

      if (commission.status !== 'pending') {
        throw new Error('Commission already processed');
      }

      // If payment method is wallet, update wallet balance
      if (paymentMethod === 'wallet') {
        const { default: WalletService } = await import('./walletService.js');
        
        const walletResult = await WalletService.processReferralCommission(
          commission.id,
          commission.commissionAmount,
          commission.referrerId,
          commission.subscriptionId,
          commission.referralId
        );

        if (!walletResult.success) {
          throw new Error(`Failed to credit wallet: ${walletResult.message}`);
        }

        console.log(`Commission ${commission.id} credited to wallet: ${walletResult.data.newBalance}`);
      }

      // Update commission status
      await commission.update({
        status: 'paid',
        paidAt: new Date(),
        paymentMethod,
        paymentReference
      });

      return {
        success: true,
        message: 'Commission paid successfully',
        data: {
          commission,
          walletUpdated: paymentMethod === 'wallet'
        }
      };
    } catch (error) {
      console.error('Error paying commission:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get top referrers
   */
  static async getTopReferrers(limit = 10) {
    try {
      const topReferrers = await ProviderProfile.findAll({
        where: {
          totalReferrals: {
            [Op.gt]: 0
          }
        },
        order: [['totalReferrals', 'DESC'], ['totalCommissionsEarned', 'DESC']],
        limit,
        attributes: ['id', 'businessName', 'category', 'totalReferrals', 'totalCommissionsEarned']
      });

      return {
        success: true,
        data: topReferrers
      };
    } catch (error) {
      console.error('Error getting top referrers:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default ReferralService;
