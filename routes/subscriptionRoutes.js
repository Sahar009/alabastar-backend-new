import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import SubscriptionService from '../services/subscriptionService.js';
import { ProviderSubscription, SubscriptionPlan } from '../schema/index.js';
import { SUCCESS, BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR } from '../constants/statusCode.js';
import { messageHandler } from '../utils/index.js';

const router = express.Router();

/**
 * Get current provider's active subscription
 */
router.get('/my-subscription', authenticateToken, authorizeRoles(['provider']), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get provider profile
    const { ProviderProfile } = await import('../schema/index.js');
    const providerProfile = await ProviderProfile.findOne({
      where: { userId }
    });

    if (!providerProfile) {
      return messageHandler(res, NOT_FOUND, 'Provider profile not found');
    }

    const result = await SubscriptionService.getActiveSubscription(providerProfile.id);
    
    if (!result.success) {
      return messageHandler(res, BAD_REQUEST, result.message);
    }

    return messageHandler(res, SUCCESS, 'Subscription retrieved successfully', result.data);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error fetching subscription');
  }
});

/**
 * Get subscription history
 */
router.get('/history', authenticateToken, authorizeRoles(['provider']), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get provider profile
    const { ProviderProfile } = await import('../schema/index.js');
    const providerProfile = await ProviderProfile.findOne({
      where: { userId }
    });

    if (!providerProfile) {
      return messageHandler(res, NOT_FOUND, 'Provider profile not found');
    }

    const result = await SubscriptionService.getSubscriptionHistory(providerProfile.id);
    
    if (!result.success) {
      return messageHandler(res, BAD_REQUEST, result.message);
    }

    return messageHandler(res, SUCCESS, 'Subscription history retrieved successfully', result.data);
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error fetching subscription history');
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel', authenticateToken, authorizeRoles(['provider']), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return messageHandler(res, BAD_REQUEST, 'Subscription ID is required');
    }
    
    // Get provider profile
    const { ProviderProfile } = await import('../schema/index.js');
    const providerProfile = await ProviderProfile.findOne({
      where: { userId }
    });

    if (!providerProfile) {
      return messageHandler(res, NOT_FOUND, 'Provider profile not found');
    }

    // Verify subscription belongs to provider
    const subscription = await ProviderSubscription.findOne({
      where: {
        id: subscriptionId,
        providerId: providerProfile.id
      }
    });

    if (!subscription) {
      return messageHandler(res, NOT_FOUND, 'Subscription not found');
    }

    const result = await SubscriptionService.cancelSubscription(subscriptionId);
    
    if (!result.success) {
      return messageHandler(res, BAD_REQUEST, result.message);
    }

    return messageHandler(res, SUCCESS, 'Subscription cancelled successfully');
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error cancelling subscription');
  }
});

/**
 * Reactivate subscription
 */
router.post('/reactivate', authenticateToken, authorizeRoles(['provider']), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return messageHandler(res, BAD_REQUEST, 'Subscription ID is required');
    }
    
    // Get provider profile
    const { ProviderProfile } = await import('../schema/index.js');
    const providerProfile = await ProviderProfile.findOne({
      where: { userId }
    });

    if (!providerProfile) {
      return messageHandler(res, NOT_FOUND, 'Provider profile not found');
    }

    // Verify subscription belongs to provider
    const subscription = await ProviderSubscription.findOne({
      where: {
        id: subscriptionId,
        providerId: providerProfile.id
      }
    });

    if (!subscription) {
      return messageHandler(res, NOT_FOUND, 'Subscription not found');
    }

    // Reactivate subscription
    await subscription.update({
      status: 'active',
      autoRenew: true
    });

    return messageHandler(res, SUCCESS, 'Subscription reactivated successfully', subscription);
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error reactivating subscription');
  }
});

/**
 * Initialize payment for new subscription or upgrade
 */
router.post('/initialize-payment', authenticateToken, authorizeRoles(['provider']), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { planId, platform } = req.body; // Accept platform parameter (optional)

    if (!planId) {
      return messageHandler(res, BAD_REQUEST, 'Plan ID is required');
    }

    // Get provider profile
    const { ProviderProfile, User } = await import('../schema/index.js');
    const providerProfile = await ProviderProfile.findOne({
      where: { userId },
      include: [{
        model: User,
        attributes: ['email', 'fullName', 'phone']
      }]
    });

    if (!providerProfile) {
      return messageHandler(res, NOT_FOUND, 'Provider profile not found');
    }

    console.log('Initializing payment for plan ID:', planId, 'Platform:', platform || 'web');

    // Get the selected plan
    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan) {
      console.error('Plan not found in database:', planId);
      return messageHandler(res, NOT_FOUND, 'Subscription plan not found');
    }

    console.log('Plan found:', plan.name, 'ID:', plan.id);

    if (!plan.isActive) {
      return messageHandler(res, BAD_REQUEST, 'This subscription plan is not available');
    }

    // Initialize Paystack payment
    const paystackService = (await import('../providers/paystack/index.js')).default;
    // Include plan ID in reference as backup (in case metadata doesn't work)
    const reference = `sub_${providerProfile.id}_${plan.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine callback URL based on platform
    let callbackUrl;
    if (platform === 'mobile') {
      // Mobile deep link for mobile apps
      callbackUrl = `alabastar://payment-success?reference=${reference}&type=subscription&planId=${plan.id}`;
      console.log('Using mobile deep link callback:', callbackUrl);
    } else {
      // Web URL for web frontend (default for backward compatibility)
      callbackUrl = `${process.env.FRONTEND_URL || 'https://alabastar.ng'}/provider/settings?tab=subscription&payment=success&reference=${reference}`;
      console.log('Using web callback URL:', callbackUrl);
    }

    const paymentData = {
      email: providerProfile.User.email,
      amount: plan.price * 100, // Paystack expects amount in kobo
      reference,
      callback_url: callbackUrl,
      metadata: {
        payment_type: 'subscription',
        provider_id: providerProfile.id,
        plan_id: plan.id,
        plan_name: plan.name,
        plan_price: plan.price,
        plan_interval: plan.interval
      }
    };

    console.log('Payment data metadata:', paymentData.metadata);
    console.log('Reference includes plan ID:', reference);

    return new Promise((resolve) => {
      paystackService.initializeTransaction(paymentData, (response) => {
        if (response.success) {
          resolve(messageHandler(res, SUCCESS, 'Payment initialized successfully', {
            authorization_url: response.data.authorization_url,
            access_code: response.data.access_code,
            reference: response.data.reference,
            plan: {
              id: plan.id,
              name: plan.name,
              price: plan.price,
              interval: plan.interval
            }
          }));
        } else {
          resolve(messageHandler(res, BAD_REQUEST, response.message || 'Failed to initialize payment'));
        }
      });
    });
  } catch (error) {
    console.error('Error initializing subscription payment:', error);
    return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error initializing payment');
  }
});

/**
 * Verify subscription payment
 */
router.get('/verify-payment/:reference', authenticateToken, authorizeRoles(['provider']), async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.user.userId;

    // Verify payment with Paystack
    const paystackService = (await import('../providers/paystack/index.js')).default;
    
    const verificationResult = await paystackService.verifyTransaction(reference);

    if (!verificationResult.success) {
      return messageHandler(res, BAD_REQUEST, 'Payment verification failed');
    }

    const paymentData = verificationResult.data;

    if (paymentData.status !== 'success') {
      return messageHandler(res, BAD_REQUEST, 'Payment was not successful');
    }

    // Get provider profile
    const { ProviderProfile } = await import('../schema/index.js');
    const providerProfile = await ProviderProfile.findOne({
      where: { userId }
    });

    if (!providerProfile) {
      return messageHandler(res, NOT_FOUND, 'Provider profile not found');
    }

    // Extract plan ID from metadata OR reference (as fallback)
    const metadata = paymentData.metadata || {};
    console.log('Payment metadata:', metadata);
    
    let planId = metadata.plan_id;
    
    // If metadata doesn't have plan_id, extract from reference
    if (!planId) {
      console.log('Plan ID not in metadata, extracting from reference:', reference);
      // Reference format: sub_{providerId}_{planId}_{timestamp}_{random}
      const parts = reference.split('_');
      if (parts.length >= 4) {
        planId = parts[2]; // Third part is the plan ID
        console.log('Extracted plan ID from reference:', planId);
      }
    }
    
    if (!planId) {
      console.error('Plan ID not found in metadata or reference');
      return messageHandler(res, BAD_REQUEST, 'Plan ID not found in payment data');
    }

    console.log('Creating subscription for provider:', providerProfile.id, 'with plan:', planId);

    // Verify plan exists
    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan) {
      console.error('Subscription plan not found in database:', planId);
      return messageHandler(res, NOT_FOUND, `Subscription plan not found: ${planId}`);
    }

    console.log('Plan found:', plan.name);

    // Create or update subscription
    const result = await SubscriptionService.createSubscription(
      providerProfile.id,
      planId,
      {
        payment_reference: reference,
        payment_amount: paymentData.amount / 100, // Convert from kobo to naira
        payment_date: new Date()
      }
    );

    if (result.success) {
      return messageHandler(res, SUCCESS, 'Subscription activated successfully', result.data);
    } else {
      return messageHandler(res, BAD_REQUEST, result.message);
    }
  } catch (error) {
    console.error('Error verifying subscription payment:', error);
    return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error verifying payment');
  }
});

export default router;
