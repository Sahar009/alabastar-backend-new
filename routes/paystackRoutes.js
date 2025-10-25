import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import paystackService from '../providers/paystack/index.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get banks list
router.get('/banks', async (req, res) => {
  try {
    paystackService.getBanksList((result) => {
      if (result.success) {
        res.json({
          success: true,
          message: 'Banks retrieved successfully',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Failed to retrieve banks',
          data: null
        });
      }
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
});

// Verify account number
router.post('/verify-account', async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        success: false,
        message: 'Account number and bank code are required',
        data: null
      });
    }

    paystackService.verifyAccountNumber({ accountNumber, bankCode }, (result) => {
      if (result.success) {
        res.json({
          success: true,
          message: 'Account verified successfully',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Account verification failed',
          data: null
        });
      }
    });
  } catch (error) {
    console.error('Error verifying account:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
});

// Get bank code from bank name
router.post('/bank-code', async (req, res) => {
  try {
    const { bankName } = req.body;

    if (!bankName) {
      return res.status(400).json({
        success: false,
        message: 'Bank name is required',
        data: null
      });
    }

    paystackService.getBankCode(bankName, (result) => {
      if (result.success) {
        res.json({
          success: true,
          message: 'Bank code retrieved successfully',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Bank not found',
          data: null
        });
      }
    });
  } catch (error) {
    console.error('Error getting bank code:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
});

export default router;
