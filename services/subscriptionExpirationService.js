import cron from 'node-cron';
import { ProviderProfile, ProviderSubscription, SubscriptionPlan, User, Notification } from '../schema/index.js';
import { Op } from 'sequelize';
import sequelize from '../database/db.js';

class SubscriptionExpirationService {
  constructor() {
    this.isRunning = false;
    this.gracePeriodDays = 3; // 3 days grace period for failed payments
    this.notificationDays = [7, 3, 1]; // Notify 7, 3, and 1 days before expiration
  }

  /**
   * Start the subscription expiration monitoring service
   */
  start() {
    if (this.isRunning) {
      console.log('Subscription expiration service is already running');
      return;
    }

    console.log('🚀 Starting subscription expiration service...');

    // Run every hour to check for expirations
    cron.schedule('0 * * * *', async () => {
      await this.checkExpiredSubscriptions();
    });

    // Run daily at 9 AM to check for upcoming expirations
    cron.schedule('0 9 * * *', async () => {
      await this.checkUpcomingExpirations();
    });

    // Run daily at 10 AM to check for grace period expirations
    cron.schedule('0 10 * * *', async () => {
      await this.checkGracePeriodExpirations();
    });

    this.isRunning = true;
    console.log('✅ Subscription expiration service started successfully');
  }

  /**
   * Stop the subscription expiration monitoring service
   */
  stop() {
    this.isRunning = false;
    console.log('🛑 Subscription expiration service stopped');
  }

  /**
   * Check for subscriptions that have expired and update their status
   */
  async checkExpiredSubscriptions() {
    try {
      console.log('🔍 Checking for expired subscriptions...');

      const expiredSubscriptions = await ProviderSubscription.findAll({
        where: {
          status: 'active',
          currentPeriodEnd: {
            [Op.lt]: new Date()
          }
        },
        include: [
          {
            model: ProviderProfile,
            attributes: ['id', 'businessName', 'userId'],
            include: [
              {
                model: User,
                attributes: ['id', 'fullName', 'email']
              }
            ]
          },
          {
            model: SubscriptionPlan,
            attributes: ['id', 'name', 'price']
          }
        ]
      });

      console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

      for (const subscription of expiredSubscriptions) {
        await this.handleExpiredSubscription(subscription);
      }

      console.log('✅ Expired subscription check completed');
    } catch (error) {
      console.error('❌ Error checking expired subscriptions:', error);
    }
  }

  /**
   * Handle a single expired subscription
   */
  async handleExpiredSubscription(subscription) {
    try {
      console.log(`Processing expired subscription: ${subscription.id}`);

      // Update subscription status to expired
      await subscription.update({ status: 'expired' });

      // Update provider payment status to pending
      await ProviderProfile.update(
        { paymentStatus: 'pending' },
        { where: { id: subscription.providerId } }
      );

      // Send expiration notification
      await this.sendExpirationNotification(subscription);

      console.log(`✅ Subscription ${subscription.id} marked as expired`);
    } catch (error) {
      console.error(`❌ Error handling expired subscription ${subscription.id}:`, error);
    }
  }

  /**
   * Check for subscriptions expiring soon and send notifications
   */
  async checkUpcomingExpirations() {
    try {
      console.log('🔔 Checking for upcoming subscription expirations...');

      for (const days of this.notificationDays) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);

        const upcomingSubscriptions = await ProviderSubscription.findAll({
          where: {
            status: 'active',
            currentPeriodEnd: {
              [Op.between]: [
                new Date(targetDate.getTime() - 24 * 60 * 60 * 1000), // Start of day
                new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)  // End of day
              ]
            }
          },
          include: [
            {
              model: ProviderProfile,
              attributes: ['id', 'businessName', 'userId'],
              include: [
                {
                  model: User,
                  attributes: ['id', 'fullName', 'email']
                }
              ]
            },
            {
              model: SubscriptionPlan,
              attributes: ['id', 'name', 'price']
            }
          ]
        });

        console.log(`Found ${upcomingSubscriptions.length} subscriptions expiring in ${days} days`);

        for (const subscription of upcomingSubscriptions) {
          await this.sendUpcomingExpirationNotification(subscription, days);
        }
      }

      console.log('✅ Upcoming expiration check completed');
    } catch (error) {
      console.error('❌ Error checking upcoming expirations:', error);
    }
  }

  /**
   * Check for subscriptions in grace period and handle them
   */
  async checkGracePeriodExpirations() {
    try {
      console.log('⏰ Checking for grace period expirations...');

      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() - this.gracePeriodDays);

      const gracePeriodSubscriptions = await ProviderSubscription.findAll({
        where: {
          status: 'past_due',
          currentPeriodEnd: {
            [Op.lt]: gracePeriodEnd
          }
        },
        include: [
          {
            model: ProviderProfile,
            attributes: ['id', 'businessName', 'userId'],
            include: [
              {
                model: User,
                attributes: ['id', 'fullName', 'email']
              }
            ]
          },
          {
            model: SubscriptionPlan,
            attributes: ['id', 'name', 'price']
          }
        ]
      });

      console.log(`Found ${gracePeriodSubscriptions.length} subscriptions past grace period`);

      for (const subscription of gracePeriodSubscriptions) {
        await this.handleGracePeriodExpiration(subscription);
      }

      console.log('✅ Grace period expiration check completed');
    } catch (error) {
      console.error('❌ Error checking grace period expirations:', error);
    }
  }

  /**
   * Handle subscription that has passed grace period
   */
  async handleGracePeriodExpiration(subscription) {
    try {
      console.log(`Processing grace period expiration: ${subscription.id}`);

      // Update subscription status to expired
      await subscription.update({ status: 'expired' });

      // Update provider payment status to pending
      await ProviderProfile.update(
        { paymentStatus: 'pending' },
        { where: { id: subscription.providerId } }
      );

      // Send final expiration notification
      await this.sendGracePeriodExpirationNotification(subscription);

      console.log(`✅ Subscription ${subscription.id} expired after grace period`);
    } catch (error) {
      console.error(`❌ Error handling grace period expiration ${subscription.id}:`, error);
    }
  }

  /**
   * Send notification for expired subscription
   */
  async sendExpirationNotification(subscription) {
    try {
      const user = subscription.ProviderProfile?.User;
      if (!user) return;

      const notification = await Notification.create({
        userId: user.id,
        type: 'subscription_expired',
        title: 'Subscription Expired',
        body: `Your ${subscription.SubscriptionPlan?.name || 'subscription'} has expired. Please renew to continue using premium features.`,
        data: {
          subscriptionId: subscription.id,
          planName: subscription.SubscriptionPlan?.name,
          expiredAt: subscription.currentPeriodEnd
        },
        isRead: false
      });

      console.log(`📧 Expiration notification sent to user ${user.id}`);
    } catch (error) {
      console.error('❌ Error sending expiration notification:', error);
    }
  }

  /**
   * Send notification for upcoming subscription expiration
   */
  async sendUpcomingExpirationNotification(subscription, daysUntilExpiration) {
    try {
      const user = subscription.ProviderProfile?.User;
      if (!user) return;

      const notification = await Notification.create({
        userId: user.id,
        type: 'subscription_expiring',
        title: `Subscription Expires in ${daysUntilExpiration} Day${daysUntilExpiration > 1 ? 's' : ''}`,
        body: `Your ${subscription.SubscriptionPlan?.name || 'subscription'} will expire in ${daysUntilExpiration} day${daysUntilExpiration > 1 ? 's' : ''}. Please renew to avoid service interruption.`,
        data: {
          subscriptionId: subscription.id,
          planName: subscription.SubscriptionPlan?.name,
          expiresAt: subscription.currentPeriodEnd,
          daysUntilExpiration
        },
        isRead: false
      });

      console.log(`📧 Upcoming expiration notification sent to user ${user.id} (${daysUntilExpiration} days)`);
    } catch (error) {
      console.error('❌ Error sending upcoming expiration notification:', error);
    }
  }

  /**
   * Send notification for grace period expiration
   */
  async sendGracePeriodExpirationNotification(subscription) {
    try {
      const user = subscription.ProviderProfile?.User;
      if (!user) return;

      const notification = await Notification.create({
        userId: user.id,
        type: 'subscription_grace_period_expired',
        title: 'Grace Period Ended - Subscription Expired',
        body: `Your ${subscription.SubscriptionPlan?.name || 'subscription'} grace period has ended. Your subscription is now expired and premium features are disabled.`,
        data: {
          subscriptionId: subscription.id,
          planName: subscription.SubscriptionPlan?.name,
          expiredAt: subscription.currentPeriodEnd
        },
        isRead: false
      });

      console.log(`📧 Grace period expiration notification sent to user ${user.id}`);
    } catch (error) {
      console.error('❌ Error sending grace period expiration notification:', error);
    }
  }

  /**
   * Attempt automatic renewal for subscriptions with autoRenew enabled
   */
  async attemptAutomaticRenewal(subscription) {
    try {
      console.log(`Attempting automatic renewal for subscription: ${subscription.id}`);

      if (!subscription.autoRenew) {
        console.log(`Auto-renewal disabled for subscription ${subscription.id}`);
        return false;
      }

      // Here you would integrate with your payment processor (Paystack)
      // For now, we'll simulate the process
      const renewalSuccess = await this.processRenewalPayment(subscription);

      if (renewalSuccess) {
        // Extend subscription period
        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + 30); // 30 days

        await subscription.update({
          currentPeriodStart: new Date(),
          currentPeriodEnd: newEndDate,
          status: 'active'
        });

        // Update provider payment status
        await ProviderProfile.update(
          { paymentStatus: 'paid' },
          { where: { id: subscription.providerId } }
        );

        console.log(`✅ Subscription ${subscription.id} automatically renewed`);
        return true;
      } else {
        // Mark as past_due for grace period
        await subscription.update({ status: 'past_due' });
        console.log(`⚠️ Subscription ${subscription.id} renewal failed, marked as past_due`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error attempting automatic renewal for ${subscription.id}:`, error);
      return false;
    }
  }

  /**
   * Process renewal payment (integrate with Paystack)
   */
  async processRenewalPayment(subscription) {
    try {
      // This is a placeholder - integrate with your actual payment processor
      // For now, we'll simulate a 70% success rate
      const success = Math.random() > 0.3;
      
      if (success) {
        console.log(`💳 Renewal payment successful for subscription ${subscription.id}`);
      } else {
        console.log(`💳 Renewal payment failed for subscription ${subscription.id}`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error processing renewal payment:', error);
      return false;
    }
  }

  /**
   * Get subscription expiration statistics
   */
  async getExpirationStats() {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const stats = await ProviderSubscription.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          currentPeriodEnd: {
            [Op.lte]: thirtyDaysFromNow
          }
        },
        group: ['status'],
        raw: true
      });

      const upcomingExpirations = await ProviderSubscription.count({
        where: {
          status: 'active',
          currentPeriodEnd: {
            [Op.between]: [now, sevenDaysFromNow]
          }
        }
      });

      const expiredCount = await ProviderSubscription.count({
        where: {
          status: 'expired'
        }
      });

      return {
        statusBreakdown: stats,
        upcomingExpirations,
        expiredCount,
        gracePeriodDays: this.gracePeriodDays
      };
    } catch (error) {
      console.error('❌ Error getting expiration stats:', error);
      return null;
    }
  }
}

export default SubscriptionExpirationService;
