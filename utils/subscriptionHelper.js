import { ProviderProfile, ProviderSubscription, SubscriptionPlan } from '../schema/index.js';

class SubscriptionHelper {
  /**
   * Get provider's active subscription with plan features
   */
  static async getProviderSubscription(providerId) {
    try {
      const subscription = await ProviderSubscription.findOne({
        where: {
          providerId,
          status: 'active' // Only active subscriptions
        },
        include: [
          {
            model: SubscriptionPlan
          }
        ],
        order: [['currentPeriodEnd', 'DESC']]
      });

      // If no active subscription found, check for expired subscriptions
      if (!subscription) {
        const expiredSubscription = await ProviderSubscription.findOne({
          where: {
            providerId,
            status: 'expired'
          },
          include: [
            {
              model: SubscriptionPlan
            }
          ],
          order: [['currentPeriodEnd', 'DESC']]
        });

        return expiredSubscription; // Return expired subscription for reference
      }

      return subscription;
    } catch (error) {
      console.error('Error getting provider subscription:', error);
      return null;
    }
  }

  /**
   * Check if provider can upload photos
   */
  static async canUploadPhoto(providerId) {
    try {
      const subscription = await this.getProviderSubscription(providerId);
      
      if (!subscription || !subscription.SubscriptionPlan || subscription.status !== 'active') {
        return {
          allowed: false,
          reason: subscription?.status === 'expired' ? 'Subscription expired' : 'No active subscription',
          currentCount: 0,
          maxAllowed: 0,
          subscriptionStatus: subscription?.status || 'none'
        };
      }

      const features = subscription.SubscriptionPlan.features || {};
      const maxPhotos = features.maxPhotos || 5;

      // Count current photos in ProviderDocuments
      const { ProviderDocument } = await import('../schema/index.js');
      const photoCount = await ProviderDocument.count({
        where: {
          providerId,
          type: 'brand_image'
        }
      });

      return {
        allowed: photoCount < maxPhotos,
        reason: photoCount >= maxPhotos ? 'Photo limit reached' : null,
        currentCount: photoCount,
        maxAllowed: maxPhotos,
        remaining: Math.max(0, maxPhotos - photoCount),
        subscriptionStatus: subscription.status
      };
    } catch (error) {
      console.error('Error checking photo upload permission:', error);
      return {
        allowed: false,
        reason: 'Error checking permissions',
        currentCount: 0,
        maxAllowed: 0,
        subscriptionStatus: 'error'
      };
    }
  }

  /**
   * Check if provider can upload video
   */
  static async canUploadVideo(providerId) {
    try {
      const subscription = await this.getProviderSubscription(providerId);
      
      if (!subscription || !subscription.SubscriptionPlan || subscription.status !== 'active') {
        return {
          allowed: false,
          reason: subscription?.status === 'expired' ? 'Subscription expired' : 'No active subscription',
          maxVideos: 0,
          maxDuration: 0,
          subscriptionStatus: subscription?.status || 'none'
        };
      }

      const features = subscription.SubscriptionPlan.features || {};
      const maxVideos = features.maxVideos || 0;
      const maxDuration = features.videoMaxDuration || 0;

      // Check if provider already has a video
      const provider = await ProviderProfile.findByPk(providerId, {
        attributes: ['videoUrl', 'videoDuration']
      });

      const hasVideo = !!provider?.videoUrl;

      return {
        allowed: maxVideos > 0 && !hasVideo,
        reason: maxVideos === 0 ? 'Video upload not available in your plan' : 
                hasVideo ? 'You already have a video uploaded' : null,
        maxVideos,
        maxDuration,
        hasVideo,
        planName: subscription.SubscriptionPlan.name,
        subscriptionStatus: subscription.status
      };
    } catch (error) {
      console.error('Error checking video upload permission:', error);
      return {
        allowed: false,
        reason: 'Error checking permissions',
        maxVideos: 0,
        maxDuration: 0,
        subscriptionStatus: 'error'
      };
    }
  }

  /**
   * Get provider's feature limits
   */
  static async getFeatureLimits(providerId) {
    try {
      const subscription = await this.getProviderSubscription(providerId);
      
      if (!subscription || !subscription.SubscriptionPlan || subscription.status !== 'active') {
        return {
          hasSubscription: false,
          planName: subscription?.SubscriptionPlan?.name || 'None',
          subscriptionStatus: subscription?.status || 'none',
          features: {
            maxPhotos: 0,
            maxVideos: 0,
            videoMaxDuration: 0,
            topListingDays: 0,
            rewardsAccess: [],
            promotionChannels: [],
            promotionEvents: [],
            priority: 0
          },
          expiredAt: subscription?.currentPeriodEnd || null
        };
      }

      const features = subscription.SubscriptionPlan.features || {
        maxPhotos: 5,
        maxVideos: 0,
        videoMaxDuration: 0,
        topListingDays: 14,
        rewardsAccess: ['monthly'],
        promotionChannels: ['youtube'],
        promotionEvents: ['special'],
        priority: 1
      };

      return {
        hasSubscription: true,
        planName: subscription.SubscriptionPlan.name,
        planId: subscription.SubscriptionPlan.id,
        subscriptionStatus: subscription.status,
        features,
        subscriptionEndDate: subscription.currentPeriodEnd
      };
    } catch (error) {
      console.error('Error getting feature limits:', error);
      return {
        hasSubscription: false,
        planName: 'Error',
        subscriptionStatus: 'error',
        features: {}
      };
    }
  }

  /**
   * Update provider's top listing dates based on subscription
   * @param {string} providerId - Provider profile ID
   * @param {string} subscriptionPlanId - Subscription plan ID
   * @param {Date} subscriptionEndDate - Optional: subscription period end date (if not provided, calculates from plan interval)
   */
  static async updateTopListing(providerId, subscriptionPlanId, subscriptionEndDate = null) {
    try {
      const plan = await SubscriptionPlan.findByPk(subscriptionPlanId);
      
      if (!plan || !plan.features) {
        return { success: false, message: 'Plan not found' };
      }

      const features = plan.features;
      const priority = features.priority || 1;

      // If topListingDays is 0 or not set, skip top listing activation
      const topListingDays = features.topListingDays || 0;
      if (topListingDays === 0) {
        return {
          success: false,
          message: 'Plan does not include top listing'
        };
      }

      const now = new Date();
      let endDate;

      // Use subscription end date if provided, otherwise calculate from plan interval
      if (subscriptionEndDate) {
        endDate = new Date(subscriptionEndDate);
      } else {
        // Calculate end date based on subscription interval (yearly or monthly)
        if (plan.interval === 'yearly') {
          endDate = new Date(now);
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else if (plan.interval === 'monthly') {
          endDate = new Date(now);
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          // Fallback to using topListingDays if interval is not recognized
          endDate = new Date(now.getTime() + topListingDays * 24 * 60 * 60 * 1000);
        }
      }

      await ProviderProfile.update({
        topListingStartDate: now,
        topListingEndDate: endDate,
        listingPriority: priority
      }, {
        where: { id: providerId }
      });

      return {
        success: true,
        message: 'Top listing activated',
        endDate
      };
    } catch (error) {
      console.error('Error updating top listing:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Check if provider's top listing is active
   */
  static async isTopListed(providerId) {
    try {
      const provider = await ProviderProfile.findByPk(providerId, {
        attributes: ['topListingEndDate']
      });

      if (!provider || !provider.topListingEndDate) {
        return false;
      }

      return new Date() < new Date(provider.topListingEndDate);
    } catch (error) {
      console.error('Error checking top listing status:', error);
      return false;
    }
  }
}

export default SubscriptionHelper;

