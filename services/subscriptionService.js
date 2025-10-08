import { ProviderSubscription, SubscriptionPlan, ProviderProfile } from '../schema/index.js';
import ReferralService from './referralService.js';

class SubscriptionService {
  /**
   * Create a new provider subscription
   */
  static async createSubscription(providerId, planId, metadata = {}) {
    try {
      const plan = await SubscriptionPlan.findByPk(planId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      if (!plan.isActive) {
        throw new Error('Subscription plan is not active');
      }

      // Calculate subscription period
      const now = new Date();
      const periodEnd = new Date(now);
      
      if (plan.interval === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else if (plan.interval === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      // Create subscription
      const subscription = await ProviderSubscription.create({
        providerId,
        planId,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        autoRenew: true,
        metadata
      });

      // Process referral commission if applicable
      try {
        await ReferralService.processCommission(subscription.id);
      } catch (referralError) {
        console.error('Error processing referral commission:', referralError);
        // Don't fail the subscription creation if referral processing fails
      }

      return {
        success: true,
        data: subscription,
        message: 'Subscription created successfully'
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get active subscription for a provider
   */
  static async getActiveSubscription(providerId) {
    try {
      const subscription = await ProviderSubscription.findOne({
        where: {
          providerId,
          status: 'active'
        },
        include: [
          {
            model: SubscriptionPlan
          }
        ],
        order: [['currentPeriodEnd', 'DESC']]
      });

      return {
        success: true,
        data: subscription
      };
    } catch (error) {
      console.error('Error getting active subscription:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId) {
    try {
      const subscription = await ProviderSubscription.findByPk(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      await subscription.update({
        status: 'cancelled',
        autoRenew: false
      });

      return {
        success: true,
        message: 'Subscription cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get subscription history for a provider
   */
  static async getSubscriptionHistory(providerId) {
    try {
      const subscriptions = await ProviderSubscription.findAll({
        where: { providerId },
        include: [
          {
            model: SubscriptionPlan
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        data: subscriptions
      };
    } catch (error) {
      console.error('Error getting subscription history:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get all subscription plans
   */
  static async getSubscriptionPlans() {
    try {
      const plans = await SubscriptionPlan.findAll({
        where: { isActive: true },
        order: [['price', 'ASC']]
      });

      return {
        success: true,
        data: plans
      };
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Check if provider has active subscription
   */
  static async hasActiveSubscription(providerId) {
    try {
      const subscription = await ProviderSubscription.findOne({
        where: {
          providerId,
          status: 'active',
          currentPeriodEnd: {
            [ProviderSubscription.sequelize.Op.gt]: new Date()
          }
        }
      });

      return {
        success: true,
        hasActiveSubscription: !!subscription,
        subscription
      };
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default SubscriptionService;


