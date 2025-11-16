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
    const { planId, callbackUrl: bodyCallbackUrl } = req.body || {};

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

    console.log('Initializing payment for plan ID:', planId);

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

    const defaultCallbackUrl =
      process.env.SUBSCRIPTION_PAYMENT_CALLBACK_URL ||
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/provider/settings?tab=subscription&payment=success`;
    const callbackUrl = bodyCallbackUrl || defaultCallbackUrl;

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
        plan_interval: plan.interval,
        return_url: callbackUrl,
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

router.get('/payment/callback', async (req, res) => {
  try {
    const { reference = '', status = 'success', trxref = '' } = req.query || {};
    const ref = (reference || trxref || '').toString();
    const paymentStatus = (status || 'success').toString();
    const deepLinkBase = process.env.MOBILE_SUBSCRIPTION_DEEPLINK || 'alabastar://subscription';
    const deepLink = `${deepLinkBase}?status=${encodeURIComponent(paymentStatus)}${ref ? `&reference=${encodeURIComponent(ref)}` : ''}`;

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payment ${paymentStatus === 'success' ? 'Successful' : 'Update'}</title>
    <style>
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #0f172a; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      .card { background: #ffffff; padding: 32px 28px; border-radius: 20px; max-width: 420px; width: 90%; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12); text-align: center; }
      .status { font-size: 28px; font-weight: 700; margin-bottom: 12px; color: ${paymentStatus === 'success' ? '#22c55e' : '#f97316'}; }
      .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
      .button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 20px; border-radius: 999px; background: #ec4899; color: #ffffff; font-weight: 600; text-decoration: none; font-size: 15px; }
      .reference { margin-top: 20px; font-size: 13px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="status">Payment ${paymentStatus === 'success' ? 'Successful' : 'Status: ' + paymentStatus}</div>
      <div class="message">
        Thank you for completing your subscription payment. We are redirecting you back to the Alabastar app.
        ${ref ? 'You can safely close this page once the app opens.' : ''}
      </div>
      <a class="button" href="${deepLink}">Return to Alabastar</a>
      ${ref ? `<div class="reference">Reference: ${ref}</div>` : ''}
    </div>
    <script>
      setTimeout(function(){ window.location.href = '${deepLink}'; }, 100);
    </script>
  </body>
</html>`;

    res.status(200).send(html);
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).send('Payment processed. You may close this window.');
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
