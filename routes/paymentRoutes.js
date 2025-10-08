import express from 'express';
import paymentController from '../controllers/paymentController.js';

const router = express.Router();

// Verify payment
router.get('/verify/:reference', paymentController.verifyPayment);

// Paystack webhook
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

export default router;








