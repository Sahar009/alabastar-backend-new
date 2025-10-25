import EarningsService from '../services/earningsService.js';
import { ProviderProfile } from '../schema/index.js';
import { SUCCESS, BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR } from '../constants/statusCode.js';
import { messageHandler } from '../utils/index.js';

class EarningsController {
  /**
   * Get provider earnings statistics
   */
  static async getEarningsStats(req, res) {
    try {
      const userId = req.user.userId;

      // Get provider profile
      const providerProfile = await ProviderProfile.findOne({
        where: { userId }
      });

      if (!providerProfile) {
        return messageHandler(res, NOT_FOUND, 'Provider profile not found');
      }

      const result = await EarningsService.getEarningsStats(providerProfile.id);

      if (!result.success) {
        return messageHandler(res, BAD_REQUEST, result.message);
      }

      // Get wallet balance and summary
      const { default: WalletService } = await import('../services/walletService.js');
      const walletSummary = await WalletService.getWalletSummary(userId);

      // Add wallet information to earnings data
      const earningsWithWallet = {
        ...result.data,
        wallet: walletSummary.success ? {
          balance: walletSummary.data.balance,
          currency: walletSummary.data.currency,
          totalCredits: walletSummary.data.totalCredits,
          totalDebits: walletSummary.data.totalDebits,
          netAmount: walletSummary.data.netAmount,
          recentTransactions: walletSummary.data.recentTransactions
        } : {
          balance: 0,
          currency: 'NGN',
          totalCredits: 0,
          totalDebits: 0,
          netAmount: 0,
          recentTransactions: []
        }
      };

      return messageHandler(res, SUCCESS, 'Earnings stats retrieved successfully', earningsWithWallet);
    } catch (error) {
      console.error('Error getting earnings stats:', error);
      return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error fetching earnings stats');
    }
  }

  /**
   * Get transaction history
   */
  static async getTransactions(req, res) {
    try {
      const userId = req.user.userId;
      const { type, dateRange, page, limit, search } = req.query;

      // Get provider profile
      const providerProfile = await ProviderProfile.findOne({
        where: { userId }
      });

      if (!providerProfile) {
        return messageHandler(res, NOT_FOUND, 'Provider profile not found');
      }

      const result = await EarningsService.getTransactions(providerProfile.id, {
        type,
        dateRange,
        page,
        limit,
        search
      });

      if (!result.success) {
        return messageHandler(res, BAD_REQUEST, result.message);
      }

      return messageHandler(res, SUCCESS, 'Transactions retrieved successfully', result.data);
    } catch (error) {
      console.error('Error getting transactions:', error);
      return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error fetching transactions');
    }
  }

  /**
   * Request withdrawal
   */
  static async requestWithdrawal(req, res) {
    try {
      const userId = req.user.userId;
      const { amount, bankName, accountNumber, accountName } = req.body;

      if (!amount || !bankName || !accountNumber || !accountName) {
        return messageHandler(res, BAD_REQUEST, 'All fields are required');
      }

      // Get provider profile
      const providerProfile = await ProviderProfile.findOne({
        where: { userId }
      });

      if (!providerProfile) {
        return messageHandler(res, NOT_FOUND, 'Provider profile not found');
      }

      const result = await EarningsService.requestWithdrawal(providerProfile.id, {
        amount: parseFloat(amount),
        bankName,
        accountNumber,
        accountName
      });

      if (!result.success) {
        return messageHandler(res, BAD_REQUEST, result.message);
      }

      return messageHandler(res, SUCCESS, 'Withdrawal request submitted successfully', result.data);
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error processing withdrawal request');
    }
  }

  /**
   * Get earnings breakdown
   */
  static async getEarningsBreakdown(req, res) {
    try {
      const userId = req.user.userId;
      const { period = 'month' } = req.query;

      // Get provider profile
      const providerProfile = await ProviderProfile.findOne({
        where: { userId }
      });

      if (!providerProfile) {
        return messageHandler(res, NOT_FOUND, 'Provider profile not found');
      }

      const result = await EarningsService.getEarningsBreakdown(providerProfile.id, period);

      if (!result.success) {
        return messageHandler(res, BAD_REQUEST, result.message);
      }

      return messageHandler(res, SUCCESS, 'Earnings breakdown retrieved successfully', result.data);
    } catch (error) {
      console.error('Error getting earnings breakdown:', error);
      return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error fetching earnings breakdown');
    }
  }
}

export default EarningsController;

