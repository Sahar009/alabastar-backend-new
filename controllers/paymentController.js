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








