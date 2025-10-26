import { Review, Booking, User, ProviderProfile, Notification } from '../schema/index.js';
import NotificationHelper from '../utils/notificationHelper.js';
import sequelize from '../database/db.js';

class ReviewService {
  // Create a new review
  static async createReview(reviewData) {
    const { bookingId, reviewerId, rating, comment } = reviewData;

    // Validate booking exists and is completed
    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: [
        { model: User, as: 'customer' },
        { model: ProviderProfile, as: 'providerProfile' }
      ]
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'completed') {
      throw new Error('Can only review completed bookings');
    }

    if (booking.userId !== reviewerId) {
      throw new Error('Can only review your own bookings');
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      where: { bookingId }
    });

    if (existingReview) {
      throw new Error('Review already exists for this booking');
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

    return review;
  }

  // Get reviews for a provider with statistics
  static async getProviderReviews(providerId, options = {}) {
    const { page = 1, limit = 10, rating, includeStats = true } = options;
    const offset = (page - 1) * limit;

    const whereClause = { providerId, isVisible: true };
    if (rating) whereClause.rating = rating;

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

    let statistics = null;
    if (includeStats) {
      statistics = await this.getProviderRatingInfo(providerId);
    }

    return {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalReviews: count,
        hasNext: offset + reviews.length < count,
        hasPrev: page > 1
      },
      statistics
    };
  }

  // Get provider rating information (replaces the old ratingAverage/ratingCount fields)
  static async getProviderRatingInfo(providerId) {
    const reviews = await Review.findAll({
      where: { providerId, isVisible: true },
      attributes: ['rating']
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution
    };
  }

  // Get provider with rating information included
  static async getProviderWithRating(providerId) {
    const provider = await ProviderProfile.findByPk(providerId, {
      include: [
        { model: User, attributes: ['id', 'fullName', 'email', 'phone'] }
      ]
    });

    if (!provider) {
      return null;
    }

    const ratingInfo = await this.getProviderRatingInfo(providerId);
    
    return {
      ...provider.toJSON(),
      ratingInfo
    };
  }

  // Get multiple providers with their rating information
  static async getProvidersWithRatings(providers) {
    const providersWithRatings = await Promise.all(
      providers.map(async (provider) => {
        const ratingInfo = await this.getProviderRatingInfo(provider.id);
        return {
          ...provider.toJSON(),
          ratingInfo
        };
      })
    );

    return providersWithRatings;
  }

  // Get user's reviews
  static async getUserReviews(userId, options = {}) {
    const { page = 1, limit = 10 } = options;
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

    return {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalReviews: count,
        hasNext: offset + reviews.length < count,
        hasPrev: page > 1
      }
    };
  }

  // Update review visibility
  static async updateReviewVisibility(reviewId, isVisible) {
    const review = await Review.findByPk(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    review.isVisible = isVisible;
    await review.save();

    return review;
  }

  // Delete review
  static async deleteReview(reviewId, userId, userRole) {
    const review = await Review.findByPk(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // Check permissions
    if (userRole !== 'admin' && review.reviewerId !== userId) {
      throw new Error('Insufficient permissions to delete this review');
    }

    await review.destroy();
    return true;
  }

  // Get all reviews with filters (admin)
  static async getAllReviews(options = {}) {
    const { page = 1, limit = 20, providerId, rating, isVisible } = options;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (providerId) whereClause.providerId = providerId;
    if (rating) whereClause.rating = rating;
    if (isVisible !== undefined) whereClause.isVisible = isVisible;

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

    return {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalReviews: count,
        hasNext: offset + reviews.length < count,
        hasPrev: page > 1
      }
    };
  }

  // Check if user can review a booking
  static async canReviewBooking(bookingId, userId) {
    const booking = await Booking.findOne({
      where: { id: bookingId }
    });

    if (!booking) {
      return { canReview: false, reason: 'Booking not found' };
    }

    if (booking.userId !== userId) {
      return { canReview: false, reason: 'Not your booking' };
    }

    if (booking.status !== 'completed') {
      return { canReview: false, reason: 'Booking not completed' };
    }

    const existingReview = await Review.findOne({
      where: { bookingId }
    });

    if (existingReview) {
      return { canReview: false, reason: 'Review already exists' };
    }

    return { canReview: true };
  }

  // Get recent reviews across all providers
  static async getRecentReviews(limit = 10) {
    const reviews = await Review.findAll({
      where: { isVisible: true },
      include: [
        { 
          model: User, 
          as: 'reviewer',
          attributes: ['id', 'fullName']
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
      limit: parseInt(limit)
    });

    return reviews;
  }

  // Get top-rated providers
  static async getTopRatedProviders(limit = 10) {
    const providers = await ProviderProfile.findAll({
      include: [
        {
          model: Review,
          where: { isVisible: true },
          required: true,
          attributes: []
        }
      ],
      attributes: [
        'id',
        'businessName',
        'category',
        'bio',
        'locationCity',
        'locationState'
      ],
      group: ['ProviderProfile.id'],
      having: sequelize.where(
        sequelize.fn('AVG', sequelize.col('reviews.rating')),
        '>=',
        4.0
      ),
      order: [
        [sequelize.fn('AVG', sequelize.col('reviews.rating')), 'DESC'],
        [sequelize.fn('COUNT', sequelize.col('reviews.id')), 'DESC']
      ],
      limit: parseInt(limit)
    });

    // Add average rating to each provider
    for (let provider of providers) {
      const stats = await this.getProviderRatingInfo(provider.id);
      provider.dataValues.averageRating = stats.averageRating;
      provider.dataValues.totalReviews = stats.totalReviews;
    }

    return providers;
  }
}

export default ReviewService;
