import { Booking, Payment, ProviderProfile, User } from '../schema/index.js';
import { Op } from 'sequelize';
import sequelize from '../database/db.js';

class EarningsService {
  /**
   * Get provider earnings statistics
   */
  static async getEarningsStats(providerId) {
    try {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // Total earnings from completed bookings
      const completedBookings = await Booking.findAll({
        where: {
          providerId,
          status: 'completed'
        },
        attributes: ['totalAmount', 'createdAt']
      });

      const totalEarnings = completedBookings.reduce((sum, booking) => {
        return sum + parseFloat(booking.totalAmount || 0);
      }, 0);

      // This month earnings
      const thisMonthEarnings = completedBookings
        .filter(booking => new Date(booking.createdAt) >= thisMonthStart)
        .reduce((sum, booking) => sum + parseFloat(booking.totalAmount || 0), 0);

      // Last month earnings
      const lastMonthEarnings = completedBookings
        .filter(booking => {
          const date = new Date(booking.createdAt);
          return date >= lastMonthStart && date <= lastMonthEnd;
        })
        .reduce((sum, booking) => sum + parseFloat(booking.totalAmount || 0), 0);

      // Pending earnings (bookings that are confirmed but not completed)
      const pendingBookings = await Booking.findAll({
        where: {
          providerId,
          status: {
            [Op.in]: ['pending', 'confirmed']
          }
        },
        attributes: ['totalAmount']
      });

      const pendingEarnings = pendingBookings.reduce((sum, booking) => {
        return sum + parseFloat(booking.totalAmount || 0);
      }, 0);

      // Get referral commissions
      const { default: ReferralService } = await import('./referralService.js');
      const referralStats = await ReferralService.getReferralStats(providerId);
      const commissionEarned = referralStats.success 
        ? parseFloat(referralStats.data.stats.totalCommissions || 0)
        : 0;

      // Calculate platform fee (10%)
      const platformFee = totalEarnings * 0.1;
      const netEarnings = totalEarnings - platformFee;

      // TODO: Get actual withdrawals from Wallet/Withdrawal table when implemented
      const totalWithdrawals = 0;

      // Available balance = net earnings - withdrawals
      const availableBalance = netEarnings - totalWithdrawals;

      return {
        success: true,
        data: {
          totalEarnings: parseFloat(totalEarnings.toFixed(2)),
          thisMonth: parseFloat(thisMonthEarnings.toFixed(2)),
          lastMonth: parseFloat(lastMonthEarnings.toFixed(2)),
          availableBalance: parseFloat(availableBalance.toFixed(2)),
          pendingEarnings: parseFloat(pendingEarnings.toFixed(2)),
          totalWithdrawals: parseFloat(totalWithdrawals.toFixed(2)),
          commissionEarned: parseFloat(commissionEarned.toFixed(2)),
          platformFee: parseFloat(platformFee.toFixed(2)),
          netEarnings: parseFloat(netEarnings.toFixed(2))
        }
      };
    } catch (error) {
      console.error('Error getting earnings stats:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get transaction history for a provider
   */
  static async getTransactions(providerId, options = {}) {
    try {
      const { type = 'all', dateRange = 'all', page = 1, limit = 50, search = '' } = options;

      const transactions = [];

      // Get booking earnings
      const bookingWhere = {
        providerId,
        status: 'completed'
      };

      // Apply date range filter
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
            const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterMonth, 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }

        if (startDate) {
          bookingWhere.createdAt = { [Op.gte]: startDate };
        }
      }

      // Fetch bookings if type includes earnings
      if (type === 'all' || type === 'earning') {
        const bookings = await Booking.findAll({
          where: bookingWhere,
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['fullName']
            }
          ],
          order: [['createdAt', 'DESC']],
          limit: parseInt(limit)
        });

        bookings.forEach(booking => {
          if (search && !booking.customer?.fullName?.toLowerCase().includes(search.toLowerCase())) {
            return;
          }

          transactions.push({
            id: booking.id,
            type: 'earning',
            amount: parseFloat(booking.totalAmount || 0),
            status: 'completed',
            description: `${booking.serviceType || 'Service'} - ${booking.customer?.fullName || 'Customer'}`,
            reference: `BK-${booking.id.substring(0, 8)}`,
            date: booking.createdAt,
            customer: booking.customer?.fullName,
            bookingId: booking.id
          });
        });
      }

      // Fetch referral commissions if type includes commission
      if (type === 'all' || type === 'commission') {
        const { ReferralCommission } = await import('../schema/index.js');
        
        const commissions = await ReferralCommission.findAll({
          where: {
            referrerId: providerId,
            status: {
              [Op.in]: ['pending', 'paid']
            }
          },
          include: [
            {
              model: ProviderProfile,
              attributes: ['businessName']
            }
          ],
          order: [['createdAt', 'DESC']],
          limit: parseInt(limit)
        });

        commissions.forEach(commission => {
          transactions.push({
            id: commission.id,
            type: 'commission',
            amount: parseFloat(commission.commissionAmount || 0),
            status: commission.status === 'paid' ? 'completed' : 'pending',
            description: `Referral commission - ${commission.ProviderProfile?.businessName || 'Provider'} subscription`,
            reference: `COM-${commission.id.substring(0, 8)}`,
            date: commission.createdAt
          });
        });
      }

      // TODO: Add withdrawals when Withdrawal model is implemented
      // TODO: Add refunds when refund logic is implemented

      // Sort all transactions by date
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedTransactions = transactions.slice(offset, offset + parseInt(limit));

      return {
        success: true,
        data: {
          transactions: paginatedTransactions,
          total: transactions.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(transactions.length / parseInt(limit))
        }
      };
    } catch (error) {
      console.error('Error getting transactions:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Request withdrawal
   */
  static async requestWithdrawal(providerId, withdrawalData) {
    try {
      const { amount, bankName, accountNumber, accountName } = withdrawalData;

      // Validate amount
      if (!amount || amount <= 0) {
        return {
          success: false,
          message: 'Invalid withdrawal amount'
        };
      }

      // Get earnings stats to check available balance
      const stats = await this.getEarningsStats(providerId);
      if (!stats.success) {
        return {
          success: false,
          message: 'Failed to get earnings stats'
        };
      }

      if (amount > stats.data.availableBalance) {
        return {
          success: false,
          message: 'Insufficient balance'
        };
      }

      // Validate bank details
      if (!bankName || !accountNumber || !accountName) {
        return {
          success: false,
          message: 'Bank details are required'
        };
      }

      if (accountNumber.length !== 10) {
        return {
          success: false,
          message: 'Account number must be 10 digits'
        };
      }

      // TODO: Implement actual withdrawal creation when Withdrawal model exists
      // For now, return success
      const withdrawalId = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        message: 'Withdrawal request submitted successfully',
        data: {
          id: withdrawalId,
          providerId,
          amount: parseFloat(amount),
          bankName,
          accountNumber,
          accountName,
          status: 'pending',
          createdAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get earnings breakdown by period
   */
  static async getEarningsBreakdown(providerId, period = 'month') {
    try {
      const now = new Date();
      let startDate, groupBy;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupBy = 'day';
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          groupBy = 'day';
          break;
        case 'quarter':
          const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterMonth, 1);
          groupBy = 'week';
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          groupBy = 'month';
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          groupBy = 'day';
      }

      const bookings = await Booking.findAll({
        where: {
          providerId,
          status: 'completed',
          createdAt: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      });

      return {
        success: true,
        data: {
          period,
          groupBy,
          breakdown: bookings.map(b => ({
            date: b.getDataValue('date'),
            amount: parseFloat(b.getDataValue('total') || 0)
          }))
        }
      };
    } catch (error) {
      console.error('Error getting earnings breakdown:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default EarningsService;

