import { Review, Booking, User, ProviderProfile, Notification } from '../schema/index.js';
import { SUCCESS, CREATED, BAD_REQUEST, NOT_FOUND, FORBIDDEN, INTERNAL_SERVER_ERROR } from '../constants/statusCode.js';
import ReviewService from '../services/reviewService.js';
import NotificationHelper from '../utils/notificationHelper.js';

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const reviewerId = req.user.id;

    // Validate required fields
    if (!bookingId || !rating) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Booking ID and rating are required'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if booking exists and belongs to the user
    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: [
        { model: User, as: 'customer' },
        { model: ProviderProfile, as: 'providerProfile' }
      ]
    });

    if (!booking) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if the booking belongs to the reviewer
    if (booking.userId !== reviewerId) {
      return res.status(FORBIDDEN).json({
        success: false,
        message: 'You can only review your own bookings'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'You can only review completed bookings'
      });
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({
      where: { bookingId }
    });

    if (existingReview) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Create the review
    const review = await Review.create({
      bookingId,
      reviewerId,
      providerId: booking.providerId,
      rating,
      comment: comment || null
    });

    // Send notification to provider
    try {
      await NotificationHelper.notifyReviewReceived(
        booking.providerId,
        booking.customer.fullName,
        rating,
        comment
      );
    } catch (notificationError) {
      console.error('Error sending review notification:', notificationError);
      // Don't fail the review creation if notification fails
    }

    // Fetch the created review with associations
    const createdReview = await Review.findOne({
      where: { id: review.id },
      include: [
        { 
          model: User, 
          attributes: ['id', 'fullName', 'email']
        },
        { 
          model: ProviderProfile, 
          attributes: ['id', 'businessName', 'category']
        },
        { 
          model: Booking, 
          attributes: ['id', 'scheduledAt', 'status', 'totalAmount']
        }
      ]
    });

    res.status(CREATED).json({
      success: true,
      message: 'Review created successfully',
      data: createdReview
    });

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get reviews for a specific provider
export const getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { providerId, isVisible: true };

    // Filter by rating if provided
    if (rating) {
      whereClause.rating = rating;
    }

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          attributes: ['id', 'fullName']
        },
        { 
          model: Booking, 
          attributes: ['id', 'scheduledAt', 'status', 'totalAmount']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate average rating
    const allReviews = await Review.findAll({
      where: { providerId, isVisible: true },
      attributes: ['rating']
    });

    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
      : 0;

    // Calculate rating distribution
    const ratingDistribution = {
      5: allReviews.filter(r => r.rating === 5).length,
      4: allReviews.filter(r => r.rating === 4).length,
      3: allReviews.filter(r => r.rating === 3).length,
      2: allReviews.filter(r => r.rating === 2).length,
      1: allReviews.filter(r => r.rating === 1).length
    };

    res.status(SUCCESS).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalReviews: count,
          hasNext: offset + reviews.length < count,
          hasPrev: page > 1
        },
        statistics: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: allReviews.length,
          ratingDistribution
        }
      }
    });

  } catch (error) {
    console.error('Error fetching provider reviews:', error);
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all reviews (admin)
export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, providerId, rating, isVisible } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Apply filters
    if (providerId) whereClause.providerId = providerId;
    if (rating) whereClause.rating = rating;
    if (isVisible !== undefined) whereClause.isVisible = isVisible === 'true';

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          attributes: ['id', 'fullName', 'email']
        },
        { 
          model: ProviderProfile, 
          attributes: ['id', 'businessName', 'category']
        },
        { 
          model: Booking, 
          attributes: ['id', 'scheduledAt', 'status', 'totalAmount']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(SUCCESS).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalReviews: count,
          hasNext: offset + reviews.length < count,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update review visibility (admin)
export const updateReviewVisibility = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isVisible } = req.body;

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.isVisible = isVisible;
    await review.save();

    res.status(SUCCESS).json({
      success: true,
      message: `Review ${isVisible ? 'made visible' : 'hidden'} successfully`,
      data: review
    });

  } catch (error) {
    console.error('Error updating review visibility:', error);
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete review (admin or reviewer)
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user can delete this review
    if (userRole !== 'admin' && review.reviewerId !== userId) {
      return res.status(FORBIDDEN).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    await review.destroy();

    res.status(SUCCESS).json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { reviewerId: userId },
      include: [
        { 
          model: ProviderProfile, 
          attributes: ['id', 'businessName', 'category']
        },
        { 
          model: Booking, 
          attributes: ['id', 'scheduledAt', 'status', 'totalAmount']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(SUCCESS).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalReviews: count,
          hasNext: offset + reviews.length < count,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get provider review statistics
export const getProviderReviewStats = async (req, res) => {
  try {
    const { providerId } = req.params;

    const stats = await ReviewService.getProviderRatingInfo(providerId);

    res.status(SUCCESS).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching provider review stats:', error);
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get provider with rating information
export const getProviderWithRating = async (req, res) => {
  try {
    const { providerId } = req.params;

    const provider = await ReviewService.getProviderWithRating(providerId);

    if (!provider) {
      return res.status(NOT_FOUND).json({
        success: false,
        message: 'Provider not found'
      });
    }

    res.status(SUCCESS).json({
      success: true,
      data: provider
    });

  } catch (error) {
    console.error('Error fetching provider with rating:', error);
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};



