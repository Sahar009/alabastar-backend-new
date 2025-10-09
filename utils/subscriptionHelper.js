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
          status: 'active'
        },
        include: [
          {
            model: SubscriptionPlan
          }
        ],
        order: [['currentPeriodEnd', 'DESC']]
      });

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
      
      if (!subscription || !subscription.SubscriptionPlan) {
        return {
          allowed: false,
          reason: 'No active subscription',
          currentCount: 0,
          maxAllowed: 0
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
        remaining: Math.max(0, maxPhotos - photoCount)
      };
    } catch (error) {
      console.error('Error checking photo upload permission:', error);
      return {
        allowed: false,
        reason: 'Error checking permissions',
        currentCount: 0,
        maxAllowed: 0
      };
    }
  }

  /**
   * Check if provider can upload video
   */
  static async canUploadVideo(providerId) {
    try {
      const subscription = await this.getProviderSubscription(providerId);
      
      if (!subscription || !subscription.SubscriptionPlan) {
        return {
          allowed: false,
          reason: 'No active subscription',
          maxVideos: 0,
          maxDuration: 0
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
        planName: subscription.SubscriptionPlan.name
      };
    } catch (error) {
      console.error('Error checking video upload permission:', error);
      return {
        allowed: false,
        reason: 'Error checking permissions',
        maxVideos: 0,
        maxDuration: 0
      };
    }
  }

  /**
   * Get provider's feature limits
   */
  static async getFeatureLimits(providerId) {
    try {
      const subscription = await this.getProviderSubscription(providerId);
      
      if (!subscription || !subscription.SubscriptionPlan) {
        return {
          hasSubscription: false,
          planName: 'None',
          features: {
            maxPhotos: 0,
            maxVideos: 0,
            videoMaxDuration: 0,
            topListingDays: 0,
            rewardsAccess: [],
            promotionChannels: [],
            promotionEvents: [],
            priority: 0
          }
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
        features,
        subscriptionEndDate: subscription.currentPeriodEnd
      };
    } catch (error) {
      console.error('Error getting feature limits:', error);
      return {
        hasSubscription: false,
        planName: 'Error',
        features: {}
      };
    }
  }

  /**
   * Update provider's top listing dates based on subscription
   */
  static async updateTopListing(providerId, subscriptionPlanId) {
    try {
      const plan = await SubscriptionPlan.findByPk(subscriptionPlanId);
      
      if (!plan || !plan.features) {
        return { success: false, message: 'Plan not found' };
      }

      const features = plan.features;
      const topListingDays = features.topListingDays || 0;
      const priority = features.priority || 1;

      if (topListingDays > 0) {
        const now = new Date();
        const endDate = new Date(now.getTime() + topListingDays * 24 * 60 * 60 * 1000);

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
      }

      return {
        success: false,
        message: 'Plan does not include top listing'
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

