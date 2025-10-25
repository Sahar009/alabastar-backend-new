import { Wallet, WalletTransaction, User, ProviderProfile } from '../schema/index.js';
import { Op } from 'sequelize';
import sequelize from '../database/db.js';

class WalletService {
  /**
   * Get or create wallet for a user
   */
  static async getOrCreateWallet(userId) {
    try {
      let wallet = await Wallet.findOne({ where: { userId } });
      
      if (!wallet) {
        wallet = await Wallet.create({
          userId,
          balance: 0,
          currency: 'NGN'
        });
      }
      
      return {
        success: true,
        data: wallet
      };
    } catch (error) {
      console.error('Error getting/creating wallet:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get wallet balance for a user
   */
  static async getWalletBalance(userId) {
    try {
      const wallet = await Wallet.findOne({ where: { userId } });
      
      if (!wallet) {
        return {
          success: true,
          data: {
            balance: 0,
            currency: 'NGN'
          }
        };
      }
      
      return {
        success: true,
        data: {
          balance: wallet.balance,
          currency: wallet.currency
        }
      };
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Credit amount to user's wallet
   */
  static async creditWallet(userId, amount, reference, description, metadata = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get or create wallet
      let wallet = await Wallet.findOne({ 
        where: { userId },
        transaction 
      });
      
      if (!wallet) {
        wallet = await Wallet.create({
          userId,
          balance: 0,
          currency: 'NGN'
        }, { transaction });
      }

      // Calculate new balance
      const currentBalance = parseFloat(wallet.balance);
      const creditAmount = parseFloat(amount);
      const newBalance = currentBalance + creditAmount;

      // Update wallet balance
      await wallet.update({ balance: newBalance }, { transaction });

      // Create wallet transaction
      const walletTransaction = await WalletTransaction.create({
        walletId: wallet.id,
        type: 'credit',
        amount: creditAmount,
        reference,
        description,
        balanceAfter: newBalance,
        metadata
      }, { transaction });

      await transaction.commit();

      return {
        success: true,
        data: {
          wallet,
          transaction: walletTransaction,
          newBalance
        }
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error crediting wallet:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Debit amount from user's wallet
   */
  static async debitWallet(userId, amount, reference, description, metadata = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get wallet
      const wallet = await Wallet.findOne({ 
        where: { userId },
        transaction 
      });
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check if sufficient balance
      const currentBalance = parseFloat(wallet.balance);
      const debitAmount = parseFloat(amount);
      
      if (currentBalance < debitAmount) {
        throw new Error('Insufficient wallet balance');
      }

      const newBalance = currentBalance - debitAmount;

      // Update wallet balance
      await wallet.update({ balance: newBalance }, { transaction });

      // Create wallet transaction
      const walletTransaction = await WalletTransaction.create({
        walletId: wallet.id,
        type: 'debit',
        amount: debitAmount,
        reference,
        description,
        balanceAfter: newBalance,
        metadata
      }, { transaction });

      await transaction.commit();

      return {
        success: true,
        data: {
          wallet,
          transaction: walletTransaction,
          newBalance
        }
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error debiting wallet:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Transfer amount between wallets
   */
  static async transferWallet(fromUserId, toUserId, amount, reference, description, metadata = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      // Debit from sender
      const debitResult = await this.debitWallet(
        fromUserId, 
        amount, 
        reference, 
        `Transfer to user ${toUserId}: ${description}`,
        { ...metadata, transferType: 'outgoing', toUserId }
      );

      if (!debitResult.success) {
        throw new Error(debitResult.message);
      }

      // Credit to receiver
      const creditResult = await this.creditWallet(
        toUserId, 
        amount, 
        reference, 
        `Transfer from user ${fromUserId}: ${description}`,
        { ...metadata, transferType: 'incoming', fromUserId }
      );

      if (!creditResult.success) {
        throw new Error(creditResult.message);
      }

      await transaction.commit();

      return {
        success: true,
        data: {
          debitTransaction: debitResult.data.transaction,
          creditTransaction: creditResult.data.transaction,
          amount
        }
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error transferring wallet:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get wallet transaction history
   */
  static async getWalletTransactions(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        type = 'all', // 'all', 'credit', 'debit'
        dateRange = 'all', // 'all', 'today', 'week', 'month', 'quarter', 'year'
        search = null
      } = options;

      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause = {};
      
      // Get wallet first
      const wallet = await Wallet.findOne({ where: { userId } });
      if (!wallet) {
        return {
          success: true,
          data: {
            transactions: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: page
          }
        };
      }

      whereClause.walletId = wallet.id;

      // Filter by type
      if (type !== 'all') {
        whereClause.type = type;
      }

      // Filter by date range
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate;

        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }

        if (startDate) {
          whereClause.createdAt = {
            [Op.gte]: startDate
          };
        }
      }

      // Search in description or reference
      if (search) {
        whereClause[Op.or] = [
          { description: { [Op.like]: `%${search}%` } },
          { reference: { [Op.like]: `%${search}%` } }
        ];
      }

      const transactions = await WalletTransaction.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        success: true,
        data: {
          transactions: transactions.rows,
          totalCount: transactions.count,
          totalPages: Math.ceil(transactions.count / limit),
          currentPage: page
        }
      };
    } catch (error) {
      console.error('Error getting wallet transactions:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get wallet summary with recent transactions
   */
  static async getWalletSummary(userId) {
    try {
      const wallet = await Wallet.findOne({ where: { userId } });
      
      if (!wallet) {
        return {
          success: true,
          data: {
            balance: 0,
            currency: 'NGN',
            recentTransactions: [],
            totalCredits: 0,
            totalDebits: 0
          }
        };
      }

      // Get recent transactions (last 10)
      const recentTransactions = await WalletTransaction.findAll({
        where: { walletId: wallet.id },
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      // Calculate totals
      const allTransactions = await WalletTransaction.findAll({
        where: { walletId: wallet.id }
      });

      const totalCredits = allTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const totalDebits = allTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return {
        success: true,
        data: {
          balance: wallet.balance,
          currency: wallet.currency,
          recentTransactions,
          totalCredits,
          totalDebits,
          netAmount: totalCredits - totalDebits
        }
      };
    } catch (error) {
      console.error('Error getting wallet summary:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Process referral commission payment to wallet
   */
  static async processReferralCommission(commissionId, commissionAmount, referrerId, subscriptionId, referralId) {
    try {
      const reference = `COMM_${commissionId}`;
      const description = `Referral commission from subscription ${subscriptionId}`;
      const metadata = {
        commissionId,
        subscriptionId,
        referralId,
        transactionType: 'referral_commission'
      };

      const result = await this.creditWallet(
        referrerId,
        commissionAmount,
        reference,
        description,
        metadata
      );

      return result;
    } catch (error) {
      console.error('Error processing referral commission:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Process booking earnings to wallet
   */
  static async processBookingEarnings(bookingId, providerId, amount, customerId) {
    try {
      const reference = `BOOKING_${bookingId}`;
      const description = `Earnings from booking ${bookingId}`;
      const metadata = {
        bookingId,
        customerId,
        transactionType: 'booking_earnings'
      };

      const result = await this.creditWallet(
        providerId,
        amount,
        reference,
        description,
        metadata
      );

      return result;
    } catch (error) {
      console.error('Error processing booking earnings:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Process withdrawal from wallet
   */
  static async processWithdrawal(userId, amount, withdrawalMethod, bankDetails = null) {
    const transaction = await sequelize.transaction();
    
    try {
      const reference = `WITHDRAWAL_${Date.now()}`;
      const description = `Withdrawal via ${withdrawalMethod}`;
      
      // First debit the wallet
      const debitResult = await this.debitWallet(
        userId,
        amount,
        reference,
        description,
        {
          withdrawalMethod,
          bankDetails,
          transactionType: 'withdrawal',
          status: 'pending'
        }
      );

      if (!debitResult.success) {
        await transaction.rollback();
        return debitResult;
      }

      // If withdrawal method is bank_transfer, initiate Paystack transfer
      if (withdrawalMethod === 'bank_transfer' && bankDetails) {
        try {
          const { default: paystackService } = await import('../providers/paystack/index.js');
          
          // Get bank code from bank name
          const bankCodeResult = await new Promise((resolve) => {
            paystackService.getBankCode(bankDetails.bankName, resolve);
          });

          if (!bankCodeResult.success) {
            // Refund the wallet if bank code not found
            await this.creditWallet(
              userId,
              amount,
              `REFUND_${reference}`,
              `Refund for failed withdrawal - Bank not found`,
              {
                originalReference: reference,
                refundReason: 'Bank code not found'
              }
            );
            
            await transaction.commit();
            return {
              success: false,
              message: `Bank "${bankDetails.bankName}" not found. Please check the bank name.`,
              data: null
            };
          }

          // Verify account number
          const accountVerification = await new Promise((resolve) => {
            paystackService.verifyAccountNumber({
              accountNumber: bankDetails.accountNumber,
              bankCode: bankCodeResult.data.code
            }, resolve);
          });

          if (!accountVerification.success) {
            // Refund the wallet if account verification fails
            await this.creditWallet(
              userId,
              amount,
              `REFUND_${reference}`,
              `Refund for failed withdrawal - Account verification failed`,
              {
                originalReference: reference,
                refundReason: 'Account verification failed'
              }
            );
            
            await transaction.commit();
            return {
              success: false,
              message: 'Account verification failed. Please check your account number.',
              data: null
            };
          }

          // Initiate Paystack transfer
          const transferResult = await new Promise((resolve) => {
            paystackService.initiateTransfer({
              amount: amount,
              accountNumber: bankDetails.accountNumber,
              bankCode: bankCodeResult.data.code,
              reason: `Withdrawal from Alabastar wallet - ${bankDetails.accountName}`,
              reference: reference
            }, resolve);
          });

          if (transferResult.success) {
            // Update wallet transaction with Paystack transfer details
            await WalletTransaction.update({
              metadata: JSON.stringify({
                withdrawalMethod,
                bankDetails,
                transactionType: 'withdrawal',
                status: 'processing',
                paystackTransferId: transferResult.data.id,
                paystackReference: transferResult.data.reference,
                accountName: accountVerification.data.account_name
              })
            }, {
              where: { reference },
              transaction
            });

            await transaction.commit();
            
            return {
              success: true,
              message: 'Withdrawal initiated successfully. Transfer is being processed.',
              data: {
                reference,
                amount,
                status: 'processing',
                paystackTransferId: transferResult.data.id,
                accountName: accountVerification.data.account_name,
                estimatedTime: '1-2 business days'
              }
            };
          } else {
            // Refund the wallet if Paystack transfer fails
            await this.creditWallet(
              userId,
              amount,
              `REFUND_${reference}`,
              `Refund for failed withdrawal - Transfer initiation failed`,
              {
                originalReference: reference,
                refundReason: 'Transfer initiation failed',
                paystackError: transferResult.message
              }
            );
            
            await transaction.commit();
            return {
              success: false,
              message: `Transfer initiation failed: ${transferResult.message}`,
              data: null
            };
          }
        } catch (paystackError) {
          console.error('Paystack integration error:', paystackError);
          
          // Refund the wallet if Paystack integration fails
          await this.creditWallet(
            userId,
            amount,
            `REFUND_${reference}`,
            `Refund for failed withdrawal - System error`,
            {
              originalReference: reference,
              refundReason: 'System error',
              error: paystackError.message
            }
          );
          
          await transaction.commit();
          return {
            success: false,
            message: 'Withdrawal processing failed due to system error. Amount has been refunded.',
            data: null
          };
        }
      }

      await transaction.commit();
      return debitResult;
    } catch (error) {
      await transaction.rollback();
      console.error('Error processing withdrawal:', error);
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }
}

export default WalletService;
