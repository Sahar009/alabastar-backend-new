import express from 'express';
import newsletterController from '../controllers/newsletterController.js';

const router = express.Router();

router.post(
  '/subscribe',
  newsletterController.validateSubscribe,
  newsletterController.subscribe
);

router.post(
  '/unsubscribe',
  newsletterController.validateUnsubscribe,
  newsletterController.unsubscribe
);

router.get('/status', newsletterController.isSubscribed);

// Optional admin list endpoint (can protect later)
// router.get('/subscribers', newsletterController.listSubscribers); // remove or protect behind admin later

export default router;


