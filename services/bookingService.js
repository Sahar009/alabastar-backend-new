import { Booking, User, Service, ProviderProfile } from '../schema/index.js';
import { sendEmail } from '../modules/notifications/email.js';
import NotificationHelper from '../utils/notificationHelper.js';
import notificationService from './notificationService.js';
import { Op } from 'sequelize';
import Review from '../schema/Review.js';

export const createBooking = async (bookingData) => {
  try {
    const {
      userId,
      providerId,
      serviceId,
      scheduledAt,
      locationAddress,
      locationCity,
      locationState,
      latitude,
      longitude,
      notes
    } = bookingData;

    // Validate required fields
    if (!userId || !providerId || !scheduledAt) {
      return { success: false, message: 'Missing required fields', statusCode: 400 };
    }

    // Resolve provider profile id (services reference provider profile id)
    const provider = await ProviderProfile.findOne({
      where: {
        [Op.or]: [
          { userId: providerId },
          { id: providerId }
        ]
      }
    });

    if (!provider) {
      return { success: false, message: 'Provider not available', statusCode: 404 };
    }

    const providerProfileId = provider.id;

    // Check if service exists and belongs to provider profile (only if serviceId is provided)
    let service = null;
    let totalAmount = 0;
    
    if (serviceId) {
      service = await Service.findOne({
        where: {
          id: serviceId,
          providerId: providerProfileId,
          isActive: true
        }
      });

      if (!service) {
        return { success: false, message: 'Service not found or not available', statusCode: 404 };
      }
      
      // Set total amount based on service price
      totalAmount = service.basePrice || 0;
    } else {
      // If no service selected, use provider's starting price
      totalAmount = provider.startingPrice || 0;
    }

    // provider already resolved above

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      where: {
        providerId: providerProfileId,
        scheduledAt: {
          [Op.between]: [
            new Date(new Date(scheduledAt).getTime() - 2 * 60 * 60 * 1000), // 2 hours before
            new Date(new Date(scheduledAt).getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
          ]
        },
        status: {
          [Op.in]: ['accepted', 'in_progress']
        }
      }
    });

    if (conflictingBooking) {
      return { success: false, message: 'Provider is not available at the requested time', statusCode: 409 };
    }

    // Create booking
    const booking = await Booking.create({
      userId,
      providerId: providerProfileId, // store provider profile id per FK
      serviceId,
      scheduledAt: new Date(scheduledAt),
      locationAddress,
      locationCity,
      locationState,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      totalAmount: totalAmount,
      notes
    });

    // Fetch booking with related data
    const bookingWithDetails = await Booking.findByPk(booking.id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: ProviderProfile,
          as: 'providerProfile',
          include: [{ model: User, attributes: ['id', 'fullName', 'email', 'phone'] }]
        },
        ...(serviceId ? [{
          model: Service,
          as: 'service',
          attributes: ['id', 'title', 'description', 'pricingType', 'basePrice']
        }] : [])
      ]
    });

    // Fire-and-forget notifications (do not block booking response)
    (async () => {
      try {
        // Send notification to provider about new booking
        await NotificationHelper.notifyBookingCreated(
          bookingWithDetails,
          bookingWithDetails.providerProfile,
          bookingWithDetails.customer,
          bookingWithDetails.service || { title: 'General Service' }
        );

        // Send confirmation notification to customer
        await notificationService.createNotification({
          userId: bookingWithDetails.userId,
          title: 'Booking Request Sent',
          body: `Your booking request for ${bookingWithDetails.service?.title || 'service'} has been sent to the provider. We'll notify you when they confirm.`,
          type: 'booking_created',
          category: 'booking',
          priority: 'normal',
          channels: ['in_app', 'email'],
          actionUrl: `/bookings/${bookingWithDetails.id}`,
          meta: {
            bookingId: bookingWithDetails.id,
            providerId: bookingWithDetails.providerId,
            serviceId: bookingWithDetails.serviceId
          }
        });
      } catch (e) {
        console.warn('[Booking] Notification failed:', e?.message || e);
      }
    })();

    return { success: true, message: 'Booking created successfully', statusCode: 201, data: bookingWithDetails };

  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, message: 'Failed to create booking', statusCode: 500 };
  }
};

export const getBookings = async (userId, userType = 'customer', filters = {}) => {
  try {
    const {
      status,
      page = 1,
      limit = 10,
      startDate,
      endDate
    } = filters;

  const whereClause = {};
  const includeClause = [
    {
      model: User,
      as: 'customer',
      attributes: ['id', 'fullName', 'email', 'phone']
    },
    {
      model: ProviderProfile,
      as: 'providerProfile',
      include: [{ model: User, attributes: ['id', 'fullName', 'email', 'phone'] }]
    },
    {
      model: Service,
      as: 'service',
      attributes: ['id', 'title', 'description', 'pricingType', 'basePrice'],
      required: false
    },
    {
      model: Review,
      as: 'review',
      required: false,
      attributes: ['id', 'rating', 'comment']
    }
  ];

    // Filter by user type
    if (userType === 'customer') {
      whereClause.userId = userId;
  } else if (userType === 'provider') {
    // When provider views, they pass their provider profile id ideally; if a user id is passed, map externally.
    whereClause.providerId = userId;
  }

    // Additional filters
    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.scheduledAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      success: true,
      message: 'Bookings retrieved successfully',
      statusCode: 200,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    };

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { success: false, message: 'Failed to fetch bookings', statusCode: 500 };
  }
};

export const getBookingById = async (bookingId, userId, userType = 'customer') => {
  try {
    const whereClause = { id: bookingId };
    
    // Ensure user can only access their own bookings
    if (userType === 'customer') {
      whereClause.userId = userId;
    } else if (userType === 'provider') {
      whereClause.providerId = userId;
    }

    const booking = await Booking.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: ProviderProfile,
          as: 'providerProfile',
          attributes: ['id', 'businessName', 'category'],
          include: [{
            model: User,
            attributes: ['id', 'fullName', 'email', 'phone']
          }]
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'title', 'description', 'pricingType', 'basePrice'],
          required: false
        }
      ]
    });

    if (!booking) {
      return { success: false, message: 'Booking not found', statusCode: 404 };
    }

    return { success: true, message: 'Booking retrieved successfully', statusCode: 200, data: booking };

  } catch (error) {
    console.error('Error fetching booking:', error);
    return { success: false, message: 'Failed to fetch booking', statusCode: 500 };
  }
};

export const updateBookingStatus = async (bookingId, userId, userType, newStatus, notes = null) => {
  try {
    const whereClause = { id: bookingId };
    
    // Ensure user can only update their own bookings
    if (userType === 'customer') {
      whereClause.userId = userId;
    } else if (userType === 'provider') {
      whereClause.providerId = userId;
    }

    const booking = await Booking.findOne({ where: whereClause });

    if (!booking) {
      return { success: false, message: 'Booking not found', statusCode: 404 };
    }

    // Validate status transition
    // Allow flexible transitions for customers and providers
    const validTransitions = {
      'requested': ['accepted', 'in_progress', 'completed', 'cancelled'], // Allow all transitions
      'accepted': ['in_progress', 'completed', 'cancelled'], // Allow to complete directly
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[booking.status]?.includes(newStatus)) {
      return { success: false, message: `Invalid status transition from ${booking.status} to ${newStatus}`, statusCode: 400 };
    }

    // Update booking
    await booking.update({
      status: newStatus,
      ...(notes && { notes: booking.notes ? `${booking.notes}\n${notes}` : notes })
    });

    // Fetch updated booking with related data
    const updatedBooking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: ProviderProfile,
          as: 'providerProfile',
          attributes: ['id', 'businessName', 'category'],
          include: [{
            model: User,
            attributes: ['id', 'fullName', 'email', 'phone']
          }]
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'title', 'description', 'pricingType', 'basePrice']
        }
      ]
    });

    // Send notifications based on status change
    (async () => {
      try {
        if (newStatus === 'accepted') {
          // Notify customer that booking was confirmed
          await NotificationHelper.notifyBookingConfirmed(
            updatedBooking,
            updatedBooking.customer,
            updatedBooking.providerProfile,
            updatedBooking.service || { title: 'Service' }
          );
        } else if (newStatus === 'completed') {
          // Process earnings to provider's wallet
          try {
            const { default: WalletService } = await import('./walletService.js');
            const netAmount = parseFloat(updatedBooking.totalAmount) * 0.9; // 90% after 10% platform fee
            
            const walletResult = await WalletService.processBookingEarnings(
              updatedBooking.id,
              updatedBooking.providerId,
              netAmount,
              updatedBooking.userId
            );
            
            if (walletResult.success) {
              console.log(`Booking ${updatedBooking.id} earnings processed to wallet: ${walletResult.data.newBalance}`);
            } else {
              console.error(`Failed to process booking earnings: ${walletResult.message}`);
            }
          } catch (walletError) {
            console.error('Error processing booking earnings to wallet:', walletError);
          }

          // Notify customer that booking is completed
          await NotificationHelper.notifyBookingCompleted(
            updatedBooking,
            updatedBooking.customer,
            updatedBooking.providerProfile,
            updatedBooking.service || { title: 'Service' }
          );
        } else if (newStatus === 'in_progress') {
          // Notify customer that service has started
          await notificationService.createNotification({
            userId: updatedBooking.userId,
            title: 'Service Started',
            body: `Your ${updatedBooking.service?.title || 'service'} has started. The provider is on their way or working on your request.`,
            type: 'booking_created',
            category: 'booking',
            priority: 'high',
            channels: ['in_app', 'push', 'sms'],
            actionUrl: `/bookings/${updatedBooking.id}`,
            meta: {
              bookingId: updatedBooking.id,
              status: newStatus
            }
          });
        }
      } catch (e) {
        console.warn('[Booking] Status notification failed:', e?.message || e);
      }
    })();

    return { success: true, message: 'Booking status updated successfully', statusCode: 200, data: updatedBooking };

  } catch (error) {
    console.error('Error updating booking status:', error);
    return { success: false, message: 'Failed to update booking status', statusCode: 500 };
  }
};

export const cancelBooking = async (bookingId, userId, userType, reason = null) => {
  try {
    const whereClause = { id: bookingId };
    
    // Ensure user can only cancel their own bookings
    if (userType === 'customer') {
      whereClause.userId = userId;
    } else if (userType === 'provider') {
      whereClause.providerId = userId;
    }

    const booking = await Booking.findOne({ where: whereClause });

    if (!booking) {
      return { success: false, message: 'Booking not found', statusCode: 404 };
    }

    // Check if booking can be cancelled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return { success: false, message: 'Booking cannot be cancelled', statusCode: 400 };
    }

    // Fetch full booking details
    const fullBooking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: ProviderProfile,
          as: 'providerProfile',
          include: [{
            model: User,
            attributes: ['id', 'fullName', 'email', 'phone']
          }]
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'title', 'description']
        }
      ]
    });

    // Update booking status
    await booking.update({
      status: 'cancelled',
      notes: booking.notes ? `${booking.notes}\nCancelled: ${reason || 'No reason provided'}` : `Cancelled: ${reason || 'No reason provided'}`
    });

    // Send cancellation notifications to both parties
    (async () => {
      try {
        // Determine who to notify based on who cancelled
        if (userType === 'customer') {
          // Notify provider about customer cancellation
          await NotificationHelper.notifyBookingCancelled(
            fullBooking,
            fullBooking.providerProfile.userId,
            reason || 'Customer cancelled the booking'
          );
        } else if (userType === 'provider') {
          // Notify customer about provider cancellation
          await NotificationHelper.notifyBookingCancelled(
            fullBooking,
            fullBooking.userId,
            reason || 'Provider cancelled the booking'
          );
        }
      } catch (e) {
        console.warn('[Booking] Cancellation notification failed:', e?.message || e);
      }
    })();

    return { success: true, message: 'Booking cancelled successfully', statusCode: 200, data: booking };

  } catch (error) {
    console.error('Error cancelling booking:', error);
    return { success: false, message: 'Failed to cancel booking', statusCode: 500 };
  }
};

export const cancelMostRecentBooking = async (userId, reason = null) => {
  try {
    // Find the most recent active booking for the user
    const mostRecentBooking = await Booking.findOne({
      where: {
        userId: userId,
        status: {
          [Op.in]: ['requested', 'accepted', 'in_progress']
        }
      },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: ProviderProfile,
          as: 'providerProfile',
          include: [{
            model: User,
            attributes: ['id', 'fullName', 'email', 'phone']
          }]
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'title', 'description']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!mostRecentBooking) {
      return { success: false, message: 'No active booking found to cancel', statusCode: 404 };
    }

    // Update booking status to cancelled
    await mostRecentBooking.update({
      status: 'cancelled',
      notes: mostRecentBooking.notes ? `${mostRecentBooking.notes}\nCancelled for new booking: ${reason || 'No reason provided'}` : `Cancelled for new booking: ${reason || 'No reason provided'}`
    });

    // Send cancellation notifications to provider
    (async () => {
      try {
        // Notify provider about customer cancellation
        await NotificationHelper.notifyBookingCancelled(
          mostRecentBooking,
          mostRecentBooking.providerProfile.userId,
          reason || 'Customer cancelled to book another provider'
        );

        // Send email notification to provider
        try {
          await sendEmail({
            to: mostRecentBooking.providerProfile.User.email,
            subject: 'Booking Cancelled - Customer Booking Another Provider',
            template: 'booking-cancelled',
            data: {
              providerName: mostRecentBooking.providerProfile.User.fullName,
              customerName: mostRecentBooking.customer.fullName,
              serviceName: mostRecentBooking.service?.title || 'Service',
              scheduledDate: new Date(mostRecentBooking.scheduledAt).toLocaleDateString(),
              scheduledTime: new Date(mostRecentBooking.scheduledAt).toLocaleTimeString(),
              reason: reason || 'Customer cancelled to book another provider',
              bookingId: mostRecentBooking.id
            }
          });
        } catch (emailError) {
          console.warn('[Booking] Email notification failed:', emailError?.message || emailError);
        }
      } catch (e) {
        console.warn('[Booking] Cancellation notification failed:', e?.message || e);
      }
    })();

    return { 
      success: true, 
      message: 'Most recent booking cancelled successfully', 
      statusCode: 200, 
      data: {
        cancelledBooking: mostRecentBooking,
        providerNotified: true
      }
    };

  } catch (error) {
    console.error('Error cancelling most recent booking:', error);
    return { success: false, message: 'Failed to cancel most recent booking', statusCode: 500 };
  }
};

export const getProviderAvailability = async (providerId, date) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.findAll({
      where: {
        providerId: providerId,
        scheduledAt: {
          [Op.between]: [startOfDay, endOfDay]
        },
        status: {
          [Op.in]: ['requested', 'accepted', 'in_progress']
        }
      },
      attributes: ['scheduledAt', 'status'],
      order: [['scheduledAt', 'ASC']]
    });

    // Generate available time slots (assuming 2-hour slots)
    const availableSlots = [];
    const bookedSlots = bookings.map(booking => new Date(booking.scheduledAt));

    for (let hour = 8; hour < 20; hour += 2) {
      const slotTime = new Date(date);
      slotTime.setHours(hour, 0, 0, 0);
      
      const isBooked = bookedSlots.some(bookedTime => 
        Math.abs(bookedTime.getTime() - slotTime.getTime()) < 2 * 60 * 60 * 1000
      );

      if (!isBooked) {
        availableSlots.push({
          time: slotTime.toISOString(),
          displayTime: slotTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })
        });
      }
    }

    return {
      success: true,
      message: 'Provider availability retrieved successfully',
      statusCode: 200,
      data: {
        date,
        availableSlots,
        bookedSlots: bookings.length
      }
    };

  } catch (error) {
    console.error('Error fetching provider availability:', error);
    return { success: false, message: 'Failed to fetch provider availability', statusCode: 500 };
  }
};
