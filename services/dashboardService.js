import { Booking, Payment, ProviderProfile } from '../schema/index.js';
import { Op } from 'sequelize';

class DashboardService {
  /**
   * Get comprehensive dashboard statistics for a provider
   * @param {string} providerId - Provider profile ID
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getProviderDashboardStats(providerId) {
    try {
      // Fetch all bookings for this provider
      const bookings = await Booking.findAll({
        where: { providerId },
        include: [
          {
            model: Payment,
            as: 'Payments',
            attributes: ['id', 'amount', 'status', 'createdAt', 'updatedAt']
          }
        ],
        attributes: ['id', 'status', 'totalAmount', 'scheduledAt', 'createdAt', 'updatedAt']
      });

      // Calculate booking statistics
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const pendingBookings = bookings.filter(b => b.status === 'requested').length;
      const acceptedBookings = bookings.filter(b => b.status === 'accepted').length;
      const inProgressBookings = bookings.filter(b => b.status === 'in_progress').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

      // Calculate earnings
      const totalEarnings = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, booking) => sum + (parseFloat(booking.totalAmount) || 0), 0);

      // Calculate this month's earnings
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const thisMonthEarnings = bookings
        .filter(b => 
          b.status === 'completed' && 
          new Date(b.updatedAt) >= startOfMonth
        )
        .reduce((sum, booking) => sum + (parseFloat(booking.totalAmount) || 0), 0);

      // Calculate this week's bookings
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const thisWeekBookings = bookings.filter(b => 
        new Date(b.createdAt) >= startOfWeek
      ).length;

      // Calculate today's bookings
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayBookings = bookings.filter(b => 
        new Date(b.createdAt) >= startOfDay
      ).length;

      // Calculate average booking value
      const averageBookingValue = completedBookings > 0 
        ? totalEarnings / completedBookings 
        : 0;

      // Calculate completion rate
      const completionRate = totalBookings > 0 
        ? (completedBookings / totalBookings) * 100 
        : 0;

      // Get upcoming bookings (accepted or in_progress, scheduled in future)
      const upcomingBookings = bookings.filter(b => 
        (b.status === 'accepted' || b.status === 'in_progress') &&
        new Date(b.scheduledAt) >= new Date()
      ).length;

      return {
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          pending: pendingBookings,
          accepted: acceptedBookings,
          inProgress: inProgressBookings,
          cancelled: cancelledBookings,
          upcoming: upcomingBookings,
          today: todayBookings,
          thisWeek: thisWeekBookings
        },
        earnings: {
          total: parseFloat(totalEarnings.toFixed(2)),
          thisMonth: parseFloat(thisMonthEarnings.toFixed(2)),
          average: parseFloat(averageBookingValue.toFixed(2))
        },
        performance: {
          completionRate: parseFloat(completionRate.toFixed(2))
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get recent activity feed for provider dashboard
   * @param {string} providerId - Provider profile ID
   * @param {number} limit - Number of activities to return
   * @returns {Promise<Array>} Recent activities
   */
  async getRecentActivities(providerId, limit = 10) {
    try {
      // Fetch recent bookings with customer info
      const bookings = await Booking.findAll({
        where: { providerId },
        include: [
          {
            association: 'customer',
            attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
          },
          {
            model: Payment,
            as: 'Payments',
            attributes: ['id', 'amount', 'status', 'createdAt', 'updatedAt']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: limit * 2, // Get more to ensure we have enough after filtering
        attributes: ['id', 'status', 'totalAmount', 'scheduledAt', 'createdAt', 'updatedAt']
      });

      // Transform bookings into activity format
      const activities = bookings.map(booking => {
        const createdDate = new Date(booking.createdAt);
        const now = new Date();
        const diffInMs = now.getTime() - createdDate.getTime();
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
        
        let timeAgo;
        if (diffInHours < 1) {
          timeAgo = 'Just now';
        } else if (diffInHours < 24) {
          timeAgo = `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        } else if (diffInDays < 7) {
          timeAgo = `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        } else {
          timeAgo = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        // Determine activity type and message
        let type = 'booking';
        let message = '';
        
        if (booking.status === 'requested') {
          message = `New booking request from ${booking.customer?.fullName || 'Customer'}`;
        } else if (booking.status === 'accepted') {
          message = `Booking accepted with ${booking.customer?.fullName || 'Customer'}`;
        } else if (booking.status === 'in_progress') {
          message = `Service in progress for ${booking.customer?.fullName || 'Customer'}`;
        } else if (booking.status === 'completed') {
          if (booking.totalAmount) {
            type = 'payment';
            message = `Payment received: ₦${parseFloat(booking.totalAmount).toLocaleString()} from ${booking.customer?.fullName || 'Customer'}`;
          } else {
            message = `Completed service for ${booking.customer?.fullName || 'Customer'}`;
          }
        } else if (booking.status === 'cancelled') {
          message = `Booking cancelled by ${booking.customer?.fullName || 'Customer'}`;
        } else {
          message = `Booking ${booking.status} - ${booking.customer?.fullName || 'Customer'}`;
        }

        return {
          id: booking.id,
          type,
          message,
          time: timeAgo,
          status: booking.status,
          serviceType: 'General Service', // Default since serviceType is not in Booking schema
          amount: booking.totalAmount,
          createdAt: booking.createdAt
        };
      });

      return activities.slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }
}

export default new DashboardService();

