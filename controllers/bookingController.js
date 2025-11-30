import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  cancelMostRecentBooking,
  getProviderAvailability
} from '../services/bookingService.js';
import { Booking, User, Service } from '../schema/index.js';

export const createBookingController = async (req, res) => {
  try {
    console.log('Creating booking:', req.body);
    
    const bookingData = {
      ...req.body,
      userId: req.user.userId // Get from authenticated user
    };

    const result = await createBooking(bookingData);
    
    if (result.success) {
      res.status(result.statusCode).json(result);
    } else {
      res.status(result.statusCode).json(result);
    }
  } catch (error) {
    console.error('Error in createBookingController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
};

export const getBookingsController = async (req, res) => {
  try {
    console.log('Fetching bookings for user:', req.user.userId);
    
    const userId = req.user.userId;
    const userType = req.query.userType || 'customer';
    const filters = {
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await getBookings(userId, userType, filters);
    
    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error in getBookingsController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
};

export const getBookingByIdController = async (req, res) => {
  try {
    console.log('Fetching booking by ID:', req.params.id);
    
    const { id } = req.params;
    const userId = req.user.userId;
    const userType = req.query.userType || 'customer';

    const result = await getBookingById(id, userId, userType);
    
    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error in getBookingByIdController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
};

export const updateBookingStatusController = async (req, res) => {
  try {
    console.log('Updating booking status:', req.params.id, req.body);
    
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.userId;
    const userType = req.query.userType || 'customer';

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
        statusCode: 400
      });
    }

    const result = await updateBookingStatus(id, userId, userType, status, notes);
    
    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error in updateBookingStatusController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
};

export const cancelBookingController = async (req, res) => {
  try {
    console.log('Cancelling booking:', req.params.id);
    
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const userType = req.query.userType || 'customer';

    const result = await cancelBooking(id, userId, userType, reason);
    
    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error in cancelBookingController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
};

export const getProviderAvailabilityController = async (req, res) => {
  try {
    console.log('Fetching provider availability:', req.params.providerId);
    
    const { providerId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
        statusCode: 400
      });
    }

    const result = await getProviderAvailability(providerId, date);
    
    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error in getProviderAvailabilityController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
};

export const getBookingStatsController = async (req, res) => {
  try {
    console.log('Fetching booking stats for user:', req.user.userId);
    
    const userId = req.user.userId;
    const userType = req.query.userType || 'customer';
    
    // This would typically involve more complex queries
    // For now, we'll return basic stats
    const stats = {
      totalBookings: 0,
      pendingBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalEarnings: 0
    };

    res.status(200).json({
      success: true,
      message: 'Booking stats retrieved successfully',
      statusCode: 200,
      data: stats
    });
  } catch (error) {
    console.error('Error in getBookingStatsController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
};

export const getActiveBookingsController = async (req, res) => {
  try {
    console.log('Checking active bookings for provider:', req.params.providerId);
    
    const { providerId } = req.params;
    const userId = req.user.userId;
    
    // Find active bookings for this user with this provider
    const activeBookings = await Booking.findAll({
      where: {
        userId: userId,
        providerId: providerId,
        status: ['pending', 'confirmed'] // Only active statuses
      },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Active bookings retrieved successfully',
      statusCode: 200,
      data: {
        hasActiveBookings: activeBookings.length > 0,
        activeBookings: activeBookings,
        count: activeBookings.length
      }
    });
  } catch (error) {
    console.error('Error in getActiveBookingsController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
};

export const cancelMostRecentBookingController = async (req, res) => {
  try {
    console.log('Cancelling most recent booking for user:', req.user.userId);
    
    const userId = req.user.userId;
    const { reason } = req.body;

    const result = await cancelMostRecentBooking(userId, reason);
    
    if (result.success) {
      res.status(result.statusCode).json(result);
    } else {
      res.status(result.statusCode).json(result);
    }
  } catch (error) {
    console.error('Error in cancelMostRecentBookingController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
};
