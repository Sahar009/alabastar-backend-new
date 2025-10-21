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

      // First verify the payment
      const verificationResult = await paystackService.verifyTransaction(reference);
      
      if (!verificationResult.success) {
        return messageHandler(res, BAD_REQUEST, 'Payment verification failed');
      }

      const paymentData = verificationResult.data;
      
      // Check if payment was successful
      if (paymentData.status !== 'success') {
        return messageHandler(res, BAD_REQUEST, 'Payment was not successful');
      }

      // Process the successful payment (same logic as webhook)
      try {
        console.log('Processing payment data:', JSON.stringify(paymentData, null, 2));
        await paystackService.handleSuccessfulPayment(paymentData);
        
        return messageHandler(res, SUCCESS, 'Provider registration completed successfully', {
          reference,
          status: 'completed'
        });
      } catch (processingError) {
        console.error('Error processing payment completion:', processingError);
        console.error('Processing error details:', processingError.message);
        console.error('Processing error stack:', processingError.stack);
        return messageHandler(res, BAD_REQUEST, `Failed to complete registration: ${processingError.message}`);
      }
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








