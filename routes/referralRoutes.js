import express from 'express';
import ReferralController from '../controllers/referralController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';

const router = express.Router();

// Public routes
router.get('/code/:referralCode', ReferralController.getReferralCodeDetails);
router.get('/validate/:referralCode', ReferralController.validateReferralCode);
router.get('/top-referrers', ReferralController.getTopReferrers);

// Protected routes (require authentication)
router.post('/process', authenticateToken, ReferralController.processReferral);
router.get('/stats/:providerId', authenticateToken, ReferralController.getReferralStats);
router.get('/referrals/:providerId', authenticateToken, ReferralController.getReferralsMade);
router.get('/commissions/:providerId', authenticateToken, ReferralController.getCommissions);

// Provider routes (require provider role)
router.post('/generate/:providerId', authenticateToken, authorizeRoles(['provider']), ReferralController.generateReferralCode);

// Admin routes (require admin role)
router.post('/pay/:commissionId', authenticateToken, authorizeRoles(['admin']), ReferralController.payCommission);

// Internal routes (for subscription processing)
router.post('/process-commission', ReferralController.processCommission);

export default router;
