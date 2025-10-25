import WalletService from '../services/walletService.js';
import { User, ProviderProfile } from '../schema/index.js';
import { Op } from 'sequelize';
import { SUCCESS, BAD_REQUEST, UNAUTHORIZED, INTERNAL_SERVER_ERROR, FORBIDDEN } from '../constants/statusCode.js';

class WalletController {
  /**
   * Get wallet balance for any user (admin only)
   */
  static async getWalletBalance(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(FORBIDDEN).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const { userId } = req.params;
      
      if (!userId) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: 'User ID is required'
        });
      }

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
  }

  /**
   * Get wallet transactions for any user (admin only)
   */
  static async getWalletTransactions(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(FORBIDDEN).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const { userId } = req.params;
      const {
        page = 1,
        limit = 50,
        type = 'all',
        dateRange = 'all',
        search = null
      } = req.query;
      
      if (!userId) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
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
  }

  /**
   * Credit wallet for any user (admin only)
   */
  static async creditWallet(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(FORBIDDEN).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const { userId } = req.params;
      const { amount, reference, description, metadata } = req.body;
      
      if (!userId || !amount) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: 'User ID and amount are required'
        });
      }

      // Validate amount
      const creditAmount = parseFloat(amount);
      if (isNaN(creditAmount) || creditAmount <= 0) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: 'Amount must be a positive number'
        });
      }

      const result = await WalletService.creditWallet(
        userId,
        creditAmount,
        reference || `ADMIN_CREDIT_${Date.now()}`,
        description || 'Admin credit',
        { ...metadata, adminAction: true, adminId: req.user.userId }
      );
      
      if (!result.success) {
        return res.status(BAD_REQUEST).json(result);
      }
      
      return res.status(SUCCESS).json({
        success: true,
        message: 'Wallet credited successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Error crediting wallet:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Debit wallet for any user (admin only)
   */
  static async debitWallet(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(FORBIDDEN).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const { userId } = req.params;
      const { amount, reference, description, metadata } = req.body;
      
      if (!userId || !amount) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: 'User ID and amount are required'
        });
      }

      // Validate amount
      const debitAmount = parseFloat(amount);
      if (isNaN(debitAmount) || debitAmount <= 0) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: 'Amount must be a positive number'
        });
      }

      const result = await WalletService.debitWallet(
        userId,
        debitAmount,
        reference || `ADMIN_DEBIT_${Date.now()}`,
        description || 'Admin debit',
        { ...metadata, adminAction: true, adminId: req.user.userId }
      );
      
      if (!result.success) {
        return res.status(BAD_REQUEST).json(result);
      }
      
      return res.status(SUCCESS).json({
        success: true,
        message: 'Wallet debited successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Error debiting wallet:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all wallets with balances (admin only)
   */
  static async getAllWallets(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(FORBIDDEN).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const { Wallet } = await import('../schema/index.js');
      const { page = 1, limit = 50, search = null } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause for search
      const whereClause = {};
      if (search) {
        whereClause[Op.or] = [
          { '$User.fullName$': { [Op.like]: `%${search}%` } },
          { '$User.email$': { [Op.like]: `%${search}%` } }
        ];
      }

      const wallets = await Wallet.findAndCountAll({
        include: [
          {
            model: User,
            attributes: ['id', 'fullName', 'email', 'phone', 'role']
          }
        ],
        where: whereClause,
        order: [['balance', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.status(SUCCESS).json({
        success: true,
        message: 'Wallets retrieved successfully',
        data: {
          wallets: wallets.rows,
          totalCount: wallets.count,
          totalPages: Math.ceil(wallets.count / limit),
          currentPage: parseInt(page)
        }
      });
    } catch (error) {
      console.error('Error getting all wallets:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get wallet statistics (admin only)
   */
  static async getWalletStats(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(FORBIDDEN).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      // Import models dynamically
      const { Wallet, WalletTransaction } = await import('../schema/index.js');

      // Get total wallet balances
      const totalBalance = await Wallet.sum('balance');
      
      // Get total number of wallets
      const totalWallets = await Wallet.count();
      
      // Get total transactions
      const totalTransactions = await WalletTransaction.count();
      
      // Get transactions this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const thisMonthTransactions = await WalletTransaction.count({
        where: {
          createdAt: {
            [Op.gte]: thisMonth
          }
        }
      });

      // Get total credits and debits
      const totalCredits = await WalletTransaction.sum('amount', {
        where: { type: 'credit' }
      });

      const totalDebits = await WalletTransaction.sum('amount', {
        where: { type: 'debit' }
      });

      return res.status(SUCCESS).json({
        success: true,
        message: 'Wallet statistics retrieved successfully',
        data: {
          totalBalance: parseFloat(totalBalance || 0),
          totalWallets,
          totalTransactions,
          thisMonthTransactions,
          totalCredits: parseFloat(totalCredits || 0),
          totalDebits: parseFloat(totalDebits || 0),
          netFlow: parseFloat(totalCredits || 0) - parseFloat(totalDebits || 0)
        }
      });
    } catch (error) {
      console.error('Error getting wallet statistics:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default WalletController;
