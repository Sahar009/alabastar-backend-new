import express from 'express';
import WalletService from '../services/walletService.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { SUCCESS, BAD_REQUEST, UNAUTHORIZED, INTERNAL_SERVER_ERROR } from '../constants/statusCode.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * Get wallet balance
 */
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await WalletService.getWalletBalance(userId);
    
    if (!result.success) {
      return res.status(BAD_REQUEST).json(result);
    }
    
    return res.status(SUCCESS).json({
      success: true,
      message: 'Wallet balance retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get wallet summary with recent transactions
 */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await WalletService.getWalletSummary(userId);
    
    if (!result.success) {
      return res.status(BAD_REQUEST).json(result);
    }
    
    return res.status(SUCCESS).json({
      success: true,
      message: 'Wallet summary retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error getting wallet summary:', error);
    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get wallet transaction history
 */
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 50,
      type = 'all',
      dateRange = 'all',
      search = null
    } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      dateRange,
      search
    };
    
    const result = await WalletService.getWalletTransactions(userId, options);
    
    if (!result.success) {
      return res.status(BAD_REQUEST).json(result);
    }
    
    return res.status(SUCCESS).json({
      success: true,
      message: 'Wallet transactions retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error getting wallet transactions:', error);
    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Transfer money to another user (provider to provider)
 */
router.post('/transfer', async (req, res) => {
  try {
    const { toUserId, amount, description } = req.body;
    const fromUserId = req.user.userId;
    
    // Validate required fields
    if (!toUserId || !amount || !description) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'toUserId, amount, and description are required'
      });
    }
    
    // Validate amount
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }
    
    // Prevent self-transfer
    if (fromUserId === toUserId) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Cannot transfer to yourself'
      });
    }
    
    const reference = `TRANSFER_${Date.now()}`;
    const metadata = {
      transferType: 'user_to_user',
      fromUserId,
      toUserId
    };
    
    const result = await WalletService.transferWallet(
      fromUserId,
      toUserId,
      transferAmount,
      reference,
      description,
      metadata
    );
    
    if (!result.success) {
      return res.status(BAD_REQUEST).json(result);
    }
    
    return res.status(SUCCESS).json({
      success: true,
      message: 'Transfer completed successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error processing transfer:', error);
    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Request withdrawal (creates withdrawal request)
 */
router.post('/withdraw', async (req, res) => {
  try {
    const { amount, withdrawalMethod, bankDetails } = req.body;
    const userId = req.user.userId;
    
    // Validate required fields
    if (!amount || !withdrawalMethod) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'amount and withdrawalMethod are required'
      });
    }
    
    // Validate amount
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }
    
    // Validate withdrawal method
    const validMethods = ['bank_transfer', 'mobile_money', 'wallet'];
    if (!validMethods.includes(withdrawalMethod)) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Invalid withdrawal method'
      });
    }
    
    const result = await WalletService.processWithdrawal(
      userId,
      withdrawalAmount,
      withdrawalMethod,
      bankDetails
    );
    
    if (!result.success) {
      return res.status(BAD_REQUEST).json(result);
    }
    
    return res.status(SUCCESS).json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
