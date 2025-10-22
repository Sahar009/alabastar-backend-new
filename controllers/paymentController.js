import paystackService from '../providers/paystack/index.js';
import { messageHandler } from '../utils/index.js';
import { BAD_REQUEST, SUCCESS, NOT_FOUND } from '../constants/statusCode.js';

class PaymentController {
  async verifyPayment(req, res) {
    try {
      const { reference } = req.params;
      
      if (!reference) {
        return messageHandler(res, BAD_REQUEST, 'Payment reference is required');
      }

      // Verify payment with Paystack
      paystackService.verifyTransaction(reference, (response) => {
        if (response.success) {
          return messageHandler(res, SUCCESS, 'Payment verified successfully', response.data);
        } else {
          return messageHandler(res, BAD_REQUEST, response.message || 'Payment verification failed');
        }
      });
    } catch (error) {
      console.error('Payment verification error:', error);
      return messageHandler(res, BAD_REQUEST, 'Payment verification failed');
    }
  }

  async completeProviderRegistration(req, res) {
    try {
      const { reference } = req.params;
      
      if (!reference) {
        return messageHandler(res, BAD_REQUEST, 'Payment reference is required');
      }

      console.log('Completing provider registration for reference:', reference);

      // Check if we already have a payment record for this reference
      const { Payment, ProviderProfile, ProviderRegistrationProgress } = await import('../schema/index.js');
      const existingPayment = await Payment.findOne({ where: { reference } });
      
      if (!existingPayment) {
        return messageHandler(res, BAD_REQUEST, 'Payment record not found');
      }

      // If payment is still pending but user reached success page, mark as successful
      if (existingPayment.status === 'pending') {
        console.log('Payment is pending but user reached success page, marking as successful');
        await Payment.update(
          { status: 'successful' },
          { where: { reference } }
        );
        console.log('Payment status updated to successful');
      } else if (existingPayment.status !== 'successful') {
        return messageHandler(res, BAD_REQUEST, 'Payment was not successful');
      }

      // Parse metadata to get registration data
      const metadata = JSON.parse(existingPayment.metadata);
      
      if (metadata.registration_type !== 'provider_registration' || !metadata.registration_data) {
        return messageHandler(res, BAD_REQUEST, 'Invalid payment metadata');
      }

      console.log('Processing payment with metadata:', {
        registration_type: metadata.registration_type,
        has_registration_data: !!metadata.registration_data,
        customer_email: existingPayment.customerEmail
      });

      // Check if provider profile already exists
      const user = await import('../schema/index.js').then(schema => 
        schema.User.findOne({ where: { email: existingPayment.customerEmail } })
      );
      
      if (!user) {
        return messageHandler(res, BAD_REQUEST, 'User not found');
      }

      let providerProfile = await ProviderProfile.findOne({ where: { userId: user.id } });
      
      if (!providerProfile) {
        console.log('Creating provider profile for user:', user.id);
        
        // Import provider service to create the profile
        const { default: providerService } = await import('../services/providerService.js');
        
        try {
          // Create provider profile using the registration data
          const registrationResult = await providerService.createProviderProfileFromPaymentData(
            user.id, 
            metadata.registration_data, 
            existingPayment.reference
          );
          
          providerProfile = registrationResult.providerProfile;
          console.log('Provider profile created:', {
            id: providerProfile.id,
            businessName: providerProfile.businessName
          });
          
          // Update payment with provider ID
          await Payment.update(
            { providerId: providerProfile.id },
            { where: { reference } }
          );
          
        } catch (profileError) {
          console.error('Error creating provider profile:', profileError);
          return messageHandler(res, BAD_REQUEST, `Failed to create provider profile: ${profileError.message}`);
        }
      } else {
        console.log('Provider profile already exists:', {
          id: providerProfile.id,
          paymentStatus: providerProfile.paymentStatus
        });
      }

      // Update registration progress to mark as complete
      const registrationProgress = await ProviderRegistrationProgress.findOne({
        where: { userId: user.id }
      });
      
      if (registrationProgress && !registrationProgress.isComplete) {
        console.log('Updating registration progress to complete...');
        
        await ProviderRegistrationProgress.update(
          { 
            currentStep: 5,
            isComplete: true,
            stepData: {
              ...registrationProgress.stepData,
              step4: {
                ...registrationProgress.stepData.step4,
                paymentCompleted: true,
                paymentReference: reference
              },
              step5: {
                paymentCompleted: true,
                paymentReference: reference,
                completedAt: new Date()
              }
            },
            lastUpdated: new Date()
          },
          { where: { userId: user.id } }
        );
        
        console.log('Registration progress updated successfully');
      }
      
      return messageHandler(res, SUCCESS, 'Provider registration completed successfully', {
        reference,
        status: 'completed',
        providerId: providerProfile.id
      });
      
    } catch (error) {
      console.error('Complete provider registration error:', error);
      return messageHandler(res, BAD_REQUEST, 'Failed to complete registration');
    }
  }

  async handleWebhook(req, res) {
    try {
      const payload = req.body;
      
      // Verify webhook signature (you should implement this for security)
      // const signature = req.headers['x-paystack-signature'];
      // if (!paystackService.verifyWebhookSignature(payload, signature)) {
      //   return messageHandler(res, BAD_REQUEST, 'Invalid webhook signature');
      // }

      // Process webhook
      paystackService.handleWebhook(payload, (response) => {
        if (response.success) {
          return messageHandler(res, SUCCESS, 'Webhook processed successfully');
        } else {
          return messageHandler(res, BAD_REQUEST, response.message || 'Webhook processing failed');
        }
      });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return messageHandler(res, BAD_REQUEST, 'Webhook processing failed');
    }
  }
}

export default new PaymentController();








