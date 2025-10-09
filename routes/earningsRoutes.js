import express from 'express';
import EarningsController from '../controllers/earningsController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';

const router = express.Router();

// All routes require provider authentication
router.use(authenticateToken);
router.use(authorizeRoles(['provider']));

/**
 * @route   GET /api/earnings/stats
 * @desc    Get provider earnings statistics
 * @access  Private (Provider)
 */
router.get('/stats', EarningsController.getEarningsStats);

/**
 * @route   GET /api/earnings/transactions
 * @desc    Get transaction history
 * @access  Private (Provider)
 * @query   type - Transaction type filter (all, earning, withdrawal, commission, refund)
 * @query   dateRange - Date range filter (all, today, week, month, quarter, year)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 50)
 * @query   search - Search term
 */
router.get('/transactions', EarningsController.getTransactions);

/**
 * @route   POST /api/earnings/withdraw
 * @desc    Request withdrawal
 * @access  Private (Provider)
 * @body    amount - Withdrawal amount
 * @body    bankName - Bank name
 * @body    accountNumber - Account number (10 digits)
 * @body    accountName - Account name
 */
router.post('/withdraw', EarningsController.requestWithdrawal);

/**
 * @route   GET /api/earnings/breakdown
 * @desc    Get earnings breakdown by period
 * @access  Private (Provider)
 * @query   period - Time period (week, month, quarter, year)
 */
router.get('/breakdown', EarningsController.getEarningsBreakdown);

export default router;

