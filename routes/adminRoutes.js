import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import sequelize from '../database/db.js';
import { User, ProviderProfile, Booking, Payment, Review, Notification, Customer, ProviderSubscription, ProviderRegistrationProgress, ServiceCategory, Service, SubscriptionPlan } from '../schema/index.js';
import { authenticateAdmin, authenticateSuperAdmin, adminRateLimit } from '../middleware/adminAuth.js';

const router = Router();

// Apply admin authentication and rate limiting to all routes
router.use(authenticateAdmin);
router.use(adminRateLimit);

// ==================== USER MANAGEMENT ====================

// Get all users with pagination and filters
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Add role filter
    if (role) {
      whereClause.role = role;
    }

    // Add status filter
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: [
        'id', 'fullName', 'email', 'phone', 'alternativePhone', 'role', 'status', 
        'isEmailVerified', 'isPhoneVerified', 'createdAt', 'updatedAt',
        'lastLoginAt', 'avatarUrl', 'provider'
      ]
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get user by ID with comprehensive detailed information
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get basic user information
    const user = await User.findByPk(id, {
      attributes: [
        'id', 'fullName', 'email', 'phone', 'alternativePhone', 'role', 'status',
        'isEmailVerified', 'isPhoneVerified', 'createdAt', 'updatedAt',
        'lastLoginAt', 'avatarUrl', 'provider', 'firebaseUid'
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize comprehensive data object
    const userData = {
      user,
      bookings: [],
      payments: [],
      reviews: {
        given: [],
        received: []
      },
      customerProfile: null,
      providerProfile: null,
      providerRegistrationProgress: null,
      providerSubscriptions: [],
      notifications: [],
      statistics: {
        totalBookings: 0,
        totalSpent: 0,
        totalEarned: 0,
        averageRating: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        pendingBookings: 0
      }
    };

    // Get all bookings (both as customer and provider)
    const customerBookings = await Booking.findAll({
      where: { userId: id },
      include: [
        {
          model: ProviderProfile,
          as: 'providerProfile',
          include: [{ 
            model: User, 
            attributes: ['id', 'fullName', 'email', 'phone'] 
          }],
          attributes: [
            'id', 'businessName', 'category', 'subcategories', 'verificationStatus',
            'locationCity', 'locationState', 'portfolio'
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    const providerBookings = await Booking.findAll({
      where: { providerId: id },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // Combine and deduplicate bookings
    const allBookings = [...customerBookings, ...providerBookings];
    userData.bookings = allBookings;

    // Get all payments
    const payments = await Payment.findAll({
      where: { 
        [Op.or]: [
          { userId: id },
          { providerId: id }
        ]
      },
      include: [
        {
          model: Booking,
          attributes: ['id', 'scheduledAt', 'status', 'totalAmount'],
          include: [
            {
              model: ProviderProfile,
              as: 'providerProfile',
              attributes: ['businessName', 'category']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    userData.payments = payments;

    // Get all reviews (both given and received)
    const givenReviews = await Review.findAll({
      where: { reviewerId: id },
      include: [
        {
          model: Booking,
          include: [
            {
              model: ProviderProfile,
              as: 'providerProfile',
              attributes: ['businessName', 'category']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const receivedReviews = await Review.findAll({
      where: { providerId: id },
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Booking,
          attributes: ['id', 'scheduledAt', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    userData.reviews = {
      given: givenReviews,
      received: receivedReviews
    };

    // Get customer profile if user is a customer
    if (user.role === 'customer') {
      const customerProfile = await Customer.findOne({
        where: { userId: id },
        attributes: [
          'id', 'preferences', 'emergencyContact', 'emergencyPhone',
          'preferredLanguage', 'notificationSettings', 'status', 'createdAt', 'updatedAt'
        ]
      });
      userData.customerProfile = customerProfile;
    }

    // Get provider profile and related data if user is a provider
    if (user.role === 'provider') {
      const providerProfile = await ProviderProfile.findOne({
        where: { userId: id },
        attributes: [
          'id', 'businessName', 'category', 'subcategories', 'bio', 'verificationStatus',
          'verifiedAt', 'locationCity', 'locationState', 'latitude', 'longitude',
          'portfolio', 'referralCode', 'referredBy', 'totalReferrals',
          'totalCommissionsEarned', 'referralSettings', 'videoUrl', 'videoThumbnail',
          'videoDuration', 'videoUploadedAt', 'topListingStartDate', 'topListingEndDate',
          'listingPriority', 'createdAt', 'updatedAt'
        ]
      });
      userData.providerProfile = providerProfile;

      // Get provider registration progress
      const registrationProgress = await ProviderRegistrationProgress.findOne({
        where: { userId: id },
        attributes: [
          'id', 'currentStep', 'stepData', 'lastUpdated', 'createdAt', 'updatedAt'
        ]
      });
      userData.providerRegistrationProgress = registrationProgress;

      // Get provider subscriptions
      const subscriptions = await ProviderSubscription.findAll({
        where: { providerId: providerProfile?.id },
        attributes: [
          'id', 'planId', 'status', 'currentPeriodStart', 'currentPeriodEnd',
          'autoRenew', 'metadata', 'createdAt', 'updatedAt'
        ],
        order: [['createdAt', 'DESC']]
      });
      userData.providerSubscriptions = subscriptions;
    }

    // Get recent notifications
    const notifications = await Notification.findAll({
      where: { userId: id },
      attributes: [
        'id', 'type', 'title', 'body', 'isRead', 'meta', 'createdAt', 'updatedAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    userData.notifications = notifications;

    // Calculate comprehensive statistics
    const stats = userData.statistics;
    
    // Booking statistics
    stats.totalBookings = allBookings.length;
    stats.completedBookings = allBookings.filter(b => b.status === 'completed').length;
    stats.cancelledBookings = allBookings.filter(b => b.status === 'cancelled').length;
    stats.pendingBookings = allBookings.filter(b => ['requested', 'accepted', 'in_progress'].includes(b.status)).length;

    // Payment statistics
    const successfulPayments = payments.filter(p => p.status === 'successful');
    stats.totalSpent = successfulPayments
      .filter(p => p.userId === id)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    stats.totalEarned = successfulPayments
      .filter(p => p.providerId === id)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Rating statistics
    const allReceivedReviews = [...givenReviews, ...receivedReviews];
    if (allReceivedReviews.length > 0) {
      const totalRating = allReceivedReviews.reduce((sum, r) => sum + r.rating, 0);
      stats.averageRating = (totalRating / allReceivedReviews.length).toFixed(2);
    }

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
});

// Update user status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ status });

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: { user: { id: user.id, status: user.status } }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// ==================== PROVIDER MANAGEMENT ====================

// Get all providers with pagination and filters
router.get('/providers', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '',
      isVerified = '',
      serviceCategory = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { businessName: { [Op.iLike]: `%${search}%` } },
        { '$User.fullName$': { [Op.iLike]: `%${search}%` } },
        { '$User.email$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Add status filter (using User status)
    if (status) {
      whereClause['$User.status$'] = status;
    }

    // Add verification filter
    if (isVerified !== '') {
      whereClause.verificationStatus = isVerified === 'true' ? 'verified' : 'pending';
    }

    // Add service category filter
    if (serviceCategory) {
      whereClause.category = serviceCategory;
    }

    const { count, rows: providers } = await ProviderProfile.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email', 'phone', 'status', 'createdAt']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: [
        'id', 'businessName', 'category', 'bio', 'verificationStatus', 
        'verifiedAt', 'locationCity', 'locationState', 'createdAt', 'updatedAt',
        'portfolio', 'referralCode', 'totalReferrals', 'listingPriority'
      ]
    });

    res.json({
      success: true,
      data: {
        providers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch providers',
      error: error.message
    });
  }
});

// Get provider by ID with detailed information
router.get('/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await ProviderProfile.findByPk(id, {
      include: [
        {
          model: User,
          attributes: [
            'id', 'fullName', 'email', 'phone', 'status',
            'isEmailVerified', 'isPhoneVerified', 'createdAt', 'updatedAt'
          ]
        }
      ],
      attributes: [
        'id', 'businessName', 'category', 'subcategories', 'bio', 'verificationStatus',
        'verifiedAt', 'locationCity', 'locationState', 'latitude', 'longitude',
        'portfolio', 'referralCode', 'referredBy', 'totalReferrals', 
        'totalCommissionsEarned', 'videoUrl', 'videoThumbnail', 'videoDuration',
        'topListingStartDate', 'topListingEndDate', 'listingPriority',
        'createdAt', 'updatedAt'
      ]
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Get provider's bookings
    const bookings = await Booking.findAll({
      where: { providerId: id },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['fullName', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get provider's reviews
    const reviews = await Review.findAll({
      where: { providerId: id },
      include: [
        {
          model: User,
          attributes: ['fullName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get provider's services (if you have a services table)
    // const services = await Service.findAll({
    //   where: { providerId: id },
    //   order: [['createdAt', 'DESC']]
    // });

    res.json({
      success: true,
      data: {
        provider,
        bookings,
        reviews
        // services
      }
    });
  } catch (error) {
    console.error('Get provider by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch provider details',
      error: error.message
    });
  }
});

// Update provider verification status
router.put('/providers/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isVerified must be a boolean value'
      });
    }

    const provider = await ProviderProfile.findByPk(id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    await provider.update({ verificationStatus: isVerified ? 'verified' : 'pending' });

    res.json({
      success: true,
      message: `Provider ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: { provider: { id: provider.id, verificationStatus: provider.verificationStatus } }
    });
  } catch (error) {
    console.error('Update provider verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update provider verification',
      error: error.message
    });
  }
});

// Update provider status
router.put('/providers/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended'
      });
    }

    const provider = await ProviderProfile.findByPk(id, {
      include: [{ model: User }]
    });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Update the user's status instead of provider status
    await provider.User.update({ status });

    res.json({
      success: true,
      message: 'Provider status updated successfully',
      data: { provider: { id: provider.id, status: provider.User.status } }
    });
  } catch (error) {
    console.error('Update provider status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update provider status',
      error: error.message
    });
  }
});

// Dashboard Statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Basic counts
    const [
      totalUsers,
      totalProviders,
      totalBookings,
      totalRevenue,
      activeUsers,
      pendingBookings,
      totalReviews,
      completedBookings,
      cancelledBookings
    ] = await Promise.all([
      User.count({ where: { role: 'customer' } }),
      User.count({ where: { role: 'provider' } }),
      Booking.count(),
      Payment.sum('amount', { where: { status: 'completed' } }),
      User.count({ where: { status: 'active' } }),
      Booking.count({ where: { status: 'pending' } }),
      Review.count(),
      Booking.count({ where: { status: 'completed' } }),
      Booking.count({ where: { status: 'cancelled' } })
    ]);

    // Monthly metrics
    const [
      monthlyRevenue,
      monthlyBookings,
      monthlyUsers,
      lastMonthRevenue,
      lastMonthBookings,
      lastMonthUsers
    ] = await Promise.all([
      Payment.sum('amount', { 
        where: { 
          status: 'completed',
          createdAt: { [Op.gte]: startOfMonth }
        } 
      }),
      Booking.count({ 
        where: { 
          createdAt: { [Op.gte]: startOfMonth }
        } 
      }),
      User.count({ 
        where: { 
          createdAt: { [Op.gte]: startOfMonth }
        } 
      }),
      Payment.sum('amount', { 
        where: { 
          status: 'completed',
          createdAt: { [Op.between]: [startOfLastMonth, endOfLastMonth] }
        } 
      }),
      Booking.count({ 
        where: { 
          createdAt: { [Op.between]: [startOfLastMonth, endOfLastMonth] }
        } 
      }),
      User.count({ 
        where: { 
          createdAt: { [Op.between]: [startOfLastMonth, endOfLastMonth] }
        } 
      })
    ]);

    // Chart data - Last 30 days
    const chartData = await Promise.all([
      // Revenue chart
      Payment.findAll({
        where: {
          status: 'completed',
          createdAt: { [Op.gte]: thirtyDaysAgo }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'revenue']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      }),
      // Bookings chart
      Booking.findAll({
        where: {
          createdAt: { [Op.gte]: thirtyDaysAgo }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'bookings']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      }),
      // Users chart
      User.findAll({
        where: {
          createdAt: { [Op.gte]: thirtyDaysAgo }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'users']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      })
    ]);

    // Top performing providers (simplified for now)
    const topProviders = await ProviderProfile.findAll({
      include: [
        { 
          model: User, 
          attributes: ['fullName', 'email'] 
        }
      ],
      attributes: [
        'id',
        'businessName'
      ],
      limit: 5
    });

    // Recent activities
    const recentBookings = await Booking.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'customer', attributes: ['fullName', 'email'] },
        { 
          model: ProviderProfile, 
          as: 'providerProfile',
          include: [{ model: User, attributes: ['fullName'] }],
          attributes: ['businessName']
        }
      ],
      attributes: ['id', 'status', 'totalAmount', 'createdAt']
    });

    const recentUsers = await User.findAll({
      where: { role: 'customer' },
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'fullName', 'email', 'createdAt', 'status']
    });

    // Calculate growth percentages
    const revenueGrowth = lastMonthRevenue ? 
      ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;
    const bookingsGrowth = lastMonthBookings ? 
      ((monthlyBookings - lastMonthBookings) / lastMonthBookings * 100) : 0;
    const usersGrowth = lastMonthUsers ? 
      ((monthlyUsers - lastMonthUsers) / lastMonthUsers * 100) : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProviders,
          totalBookings,
          totalRevenue: totalRevenue || 0,
          activeUsers,
          pendingBookings,
          totalReviews,
          completedBookings,
          cancelledBookings,
          monthlyRevenue: monthlyRevenue || 0,
          monthlyBookings,
          monthlyUsers,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          bookingsGrowth: Math.round(bookingsGrowth * 100) / 100,
          usersGrowth: Math.round(usersGrowth * 100) / 100
        },
        charts: {
          revenue: chartData[0],
          bookings: chartData[1],
          users: chartData[2]
        },
        topProviders,
        recentActivities: {
          bookings: recentBookings,
          users: recentUsers
        }
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

// User Management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all', role = 'all' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (status !== 'all') {
      whereClause.status = status;
    }
    
    if (role !== 'all') {
      whereClause.role = role;
    }

    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'fullName', 'email', 'phone', 'role', 'status', 'createdAt', 'lastLoginAt']
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get User Details
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'fullName', 'email', 'phone', 'role', 'status', 'createdAt', 'lastLoginAt', 'avatarUrl'],
      include: [
        { model: ProviderProfile, as: 'providerProfile' },
        { model: Booking, as: 'bookings', limit: 10 }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
});

// Update User Status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ status });

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: { user: { id: user.id, status: user.status } }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// Provider Management
router.get('/providers', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { role: 'provider' };
    
    if (status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: providers } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ProviderProfile,
          attributes: ['businessName', 'locationCity', 'locationState', 'isVerified', 'rating', 'totalJobs']
        }
      ],
      attributes: ['id', 'fullName', 'email', 'phone', 'status', 'createdAt', 'lastLoginAt']
    });

    res.json({
      success: true,
      data: {
        providers,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch providers'
    });
  }
});

// Verify Provider
router.put('/providers/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const providerProfile = await ProviderProfile.findOne({
      where: { userId: id }
    });

    if (!providerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    await providerProfile.update({ isVerified });

    res.json({
      success: true,
      message: `Provider ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: { providerId: id, isVerified }
    });

  } catch (error) {
    console.error('Verify provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update provider verification'
    });
  }
});

// Booking Management
router.get('/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (status !== 'all') {
      whereClause.status = status;
    }

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'customer', attributes: ['fullName', 'email'] },
        { model: ProviderProfile, include: [{ model: User, attributes: ['fullName'] }] }
      ]
    });

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// Update Booking Status
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const booking = await Booking.findByPk(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.update({ status });

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking: { id: booking.id, status: booking.status } }
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
});

// Review Management
router.get('/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (status !== 'all') {
      whereClause.status = status;
    }

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'customer', attributes: ['fullName', 'email'] },
        { model: ProviderProfile, include: [{ model: User, attributes: ['fullName'] }] }
      ]
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Update Review Status
router.put('/reviews/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const review = await Review.findByPk(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.update({ status });

    res.json({
      success: true,
      message: 'Review status updated successfully',
      data: { review: { id: review.id, status: review.status } }
    });

  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review status'
    });
  }
});

// Send Notification to Users
router.post('/notifications/send', async (req, res) => {
  try {
    const { title, message, type = 'general', targetUsers = 'all', targetRoles = [] } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Create notification for all users or specific roles
    const whereClause = {};
    
    if (targetUsers !== 'all') {
      whereClause.id = targetUsers;
    } else if (targetRoles.length > 0) {
      whereClause.role = targetRoles;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id']
    });

    const notifications = users.map(user => ({
      userId: user.id,
      title,
      body: message,
      type,
      category: 'admin',
      priority: 'normal',
      isRead: false
    }));

    await Notification.bulkCreate(notifications);

    res.json({
      success: true,
      message: `Notification sent to ${users.length} users`,
      data: { sentTo: users.length }
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

// Create Admin User (Super Admin only)
router.post('/create-admin', authenticateSuperAdmin, async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required'
      });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: {
        email: email.toLowerCase(),
        role: 'admin'
      }
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin user already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const admin = await User.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      status: 'active',
      isEmailVerified: true,
      isPhoneVerified: true
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== BOOKINGS MANAGEMENT ====================

// Get all bookings with pagination and filters
router.get('/bookings', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '', 
      paymentStatus = '', 
      dateFrom = '', 
      dateTo = '',
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { id: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
        { locationAddress: { [Op.like]: `%${search}%` } },
        { locationCity: { [Op.like]: `%${search}%` } }
      ];
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Payment status filter
    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.createdAt[Op.lte] = new Date(dateTo);
      }
    }

    const { count, rows: bookings } = await Booking.findAndCountAll({
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
          include: [
            {
              model: User,
              attributes: ['id', 'fullName', 'email', 'phone']
            }
          ],
          attributes: ['id', 'businessName', 'category', 'verificationStatus']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: [
        'id', 'userId', 'providerId', 'serviceId', 'scheduledAt', 'status',
        'locationAddress', 'locationCity', 'locationState', 'latitude', 'longitude',
        'totalAmount', 'currency', 'paymentStatus', 'escrowStatus', 'notes',
        'createdAt', 'updatedAt'
      ]
    });

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});

// Get single booking with comprehensive details
router.get('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: User,
          as: 'customer',
          attributes: [
            'id', 'fullName', 'email', 'phone', 'alternativePhone', 'role', 'status',
            'isEmailVerified', 'isPhoneVerified', 'createdAt', 'lastLoginAt'
          ]
        },
        {
          model: ProviderProfile,
          as: 'providerProfile',
          include: [
            {
              model: User,
              attributes: [
                'id', 'fullName', 'email', 'phone', 'alternativePhone', 'role', 'status',
                'isEmailVerified', 'isPhoneVerified', 'createdAt', 'lastLoginAt'
              ]
            }
          ],
          attributes: [
            'id', 'businessName', 'category', 'subcategories', 'bio', 'verificationStatus',
            'verifiedAt', 'locationCity', 'locationState', 'portfolio', 'referralCode',
            'totalReferrals', 'totalCommissionsEarned', 'createdAt', 'updatedAt'
          ]
        }
      ],
      attributes: [
        'id', 'userId', 'providerId', 'serviceId', 'scheduledAt', 'status',
        'locationAddress', 'locationCity', 'locationState', 'latitude', 'longitude',
        'totalAmount', 'currency', 'paymentStatus', 'escrowStatus', 'notes',
        'createdAt', 'updatedAt'
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Get related payments
    const payments = await Payment.findAll({
      where: { bookingId: id },
      attributes: [
        'id', 'amount', 'currency', 'status', 'reference', 'paymentMethod',
        'paymentType', 'customerEmail', 'metadata', 'createdAt', 'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get related reviews
    const reviews = await Review.findAll({
      where: { bookingId: id },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      attributes: [
        'id', 'rating', 'comment', 'isVisible', 'createdAt', 'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get related notifications
    const notifications = await Notification.findAll({
      where: { 
        userId: [booking.userId, booking.providerId],
        meta: {
          bookingId: id
        }
      },
      attributes: [
        'id', 'type', 'title', 'body', 'isRead', 'meta', 'createdAt', 'updatedAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        booking,
        payments,
        reviews,
        notifications
      }
    });

  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      error: error.message
    });
  }
});

// Update booking status
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['requested', 'accepted', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be requested, accepted, in_progress, completed, or cancelled'
      });
    }

    const booking = await Booking.findByPk(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.update({ status });

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking: { id: booking.id, status: booking.status } }
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
});

// Update booking payment status
router.put('/bookings/:id/payment-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!['pending', 'paid', 'refunded'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status. Must be pending, paid, or refunded'
      });
    }

    const booking = await Booking.findByPk(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.update({ paymentStatus });

    res.json({
      success: true,
      message: 'Booking payment status updated successfully',
      data: { booking: { id: booking.id, paymentStatus: booking.paymentStatus } }
    });

  } catch (error) {
    console.error('Update booking payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking payment status',
      error: error.message
    });
  }
});

// ==================== SERVICE CATEGORIES MANAGEMENT ====================

// Get all service categories with pagination and filters
router.get('/categories', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      isActive = '', 
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } }
      ];
    }

    // Active status filter
    if (isActive !== '') {
      whereClause.isActive = isActive === 'true';
    }

    const { count, rows: categories } = await ServiceCategory.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Service,
          as: 'Services',
          attributes: ['id'],
          where: { isActive: true },
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: [
        'id', 'name', 'slug', 'description', 'icon', 'isActive', 'createdAt', 'updatedAt'
      ]
    });

    // Add service count to each category
    const categoriesWithCounts = categories.map(category => ({
      ...category.toJSON(),
      serviceCount: category.Services ? category.Services.length : 0
    }));

    res.json({
      success: true,
      data: {
        categories: categoriesWithCounts,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// Get single category with services
router.get('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await ServiceCategory.findByPk(id, {
      include: [
        {
          model: Service,
          as: 'Services',
          include: [
            {
              model: ProviderProfile,
              as: 'Provider',
              attributes: ['id', 'businessName', 'verificationStatus'],
              include: [
                {
                  model: User,
                  attributes: ['id', 'fullName', 'email']
                }
              ]
            }
          ],
          attributes: [
            'id', 'title', 'description', 'pricingType', 'basePrice', 
            'isActive', 'photos', 'createdAt', 'updatedAt'
          ],
          order: [['createdAt', 'DESC']]
        }
      ],
      attributes: [
        'id', 'name', 'slug', 'description', 'icon', 'isActive', 'createdAt', 'updatedAt'
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category details',
      error: error.message
    });
  }
});

// Create new category
router.post('/categories', async (req, res) => {
  try {
    const { name, description, icon, isActive = true } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if category with same name or slug already exists
    const existingCategory = await ServiceCategory.findOne({
      where: {
        [Op.or]: [
          { name: name },
          { slug: slug }
        ]
      }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = await ServiceCategory.create({
      name,
      slug,
      description,
      icon,
      isActive
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
});

// Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, isActive } = req.body;

    const category = await ServiceCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Generate new slug if name is being updated
    let slug = category.slug;
    if (name && name !== category.name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Check if new slug already exists
      const existingCategory = await ServiceCategory.findOne({
        where: {
          slug: slug,
          id: { [Op.ne]: id }
        }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    await category.update({
      name: name || category.name,
      slug: slug,
      description: description !== undefined ? description : category.description,
      icon: icon !== undefined ? icon : category.icon,
      isActive: isActive !== undefined ? isActive : category.isActive
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await ServiceCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has active services
    const serviceCount = await Service.count({
      where: {
        categoryId: id,
        isActive: true
      }
    });

    if (serviceCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${serviceCount} active services. Please deactivate or delete the services first.`
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
});

// ==================== SERVICES MANAGEMENT ====================

// Get all services with pagination and filters
router.get('/services', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      categoryId = '', 
      providerId = '', 
      isActive = '', 
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Category filter
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    // Provider filter
    if (providerId) {
      whereClause.providerId = providerId;
    }

    // Active status filter
    if (isActive !== '') {
      whereClause.isActive = isActive === 'true';
    }

    const { count, rows: services } = await Service.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ServiceCategory,
          as: 'Category',
          attributes: ['id', 'name', 'slug', 'icon']
        },
        {
          model: ProviderProfile,
          as: 'Provider',
          attributes: ['id', 'businessName', 'verificationStatus'],
          include: [
            {
              model: User,
              attributes: ['id', 'fullName', 'email', 'phone']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: [
        'id', 'title', 'description', 'pricingType', 'basePrice', 
        'isActive', 'photos', 'createdAt', 'updatedAt'
      ]
    });

    res.json({
      success: true,
      data: {
        services,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

// Get single service with details
router.get('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id, {
      include: [
        {
          model: ServiceCategory,
          as: 'Category',
          attributes: ['id', 'name', 'slug', 'description', 'icon']
        },
        {
          model: ProviderProfile,
          as: 'Provider',
          attributes: [
            'id', 'businessName', 'category', 'verificationStatus', 
            'locationCity', 'locationState', 'bio'
          ],
          include: [
            {
              model: User,
              attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
            }
          ]
        }
      ],
      attributes: [
        'id', 'title', 'description', 'pricingType', 'basePrice', 
        'isActive', 'photos', 'createdAt', 'updatedAt'
      ]
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });

  } catch (error) {
    console.error('Get service by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service details',
      error: error.message
    });
  }
});

// Update service status
router.put('/services/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await service.update({ isActive });

    res.json({
      success: true,
      message: `Service ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { service: { id: service.id, isActive: service.isActive } }
    });

  } catch (error) {
    console.error('Update service status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service status',
      error: error.message
    });
  }
});

// ==================== SUBSCRIPTION PLANS MANAGEMENT ====================

// Get all subscription plans with pagination and filters
router.get('/subscription-plans', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      isActive = '', 
      interval = '',
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } }
      ];
    }

    // Active status filter
    if (isActive !== '') {
      whereClause.isActive = isActive === 'true';
    }

    // Interval filter
    if (interval) {
      whereClause.interval = interval;
    }

    const { count, rows: plans } = await SubscriptionPlan.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ProviderSubscription,
          as: 'ProviderSubscriptions',
          attributes: ['id'],
          where: { status: 'active' },
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: [
        'id', 'name', 'slug', 'price', 'interval', 'benefits', 'features', 'isActive', 'createdAt', 'updatedAt'
      ]
    });

    // Add subscription count to each plan
    const plansWithCounts = plans.map(plan => ({
      ...plan.toJSON(),
      activeSubscriptions: plan.ProviderSubscriptions ? plan.ProviderSubscriptions.length : 0
    }));

    res.json({
      success: true,
      data: {
        plans: plansWithCounts,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans',
      error: error.message
    });
  }
});

// Get single subscription plan
router.get('/subscription-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findByPk(id, {
      include: [
        {
          model: ProviderSubscription,
          as: 'ProviderSubscriptions',
          include: [
            {
              model: ProviderProfile,
              as: 'Provider',
              attributes: ['id', 'businessName', 'verificationStatus'],
              include: [
                {
                  model: User,
                  attributes: ['id', 'fullName', 'email']
                }
              ]
            }
          ],
          attributes: [
            'id', 'status', 'currentPeriodStart', 'currentPeriodEnd', 
            'autoRenew', 'createdAt', 'updatedAt'
          ],
          order: [['createdAt', 'DESC']]
        }
      ],
      attributes: [
        'id', 'name', 'slug', 'price', 'interval', 'benefits', 'features', 'isActive', 'createdAt', 'updatedAt'
      ]
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });

  } catch (error) {
    console.error('Get subscription plan by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plan details',
      error: error.message
    });
  }
});

// Create new subscription plan
router.post('/subscription-plans', async (req, res) => {
  try {
    const { name, price, interval, benefits, features, isActive = true } = req.body;

    // Validate required fields
    if (!name || !price || !interval) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and interval are required'
      });
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Check if plan with same name or slug already exists
    const existingPlan = await SubscriptionPlan.findOne({
      where: {
        [Op.or]: [
          { name: name },
          { slug: slug }
        ]
      }
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Subscription plan with this name or slug already exists'
      });
    }

    const plan = await SubscriptionPlan.create({
      name,
      slug,
      price,
      interval,
      benefits: benefits || [],
      features: features || {
        maxPhotos: 5,
        maxVideos: 0,
        videoMaxDuration: 0,
        topListingDays: 14,
        rewardsAccess: ['monthly'],
        promotionChannels: ['youtube'],
        promotionEvents: ['special'],
        priority: 1
      },
      isActive
    });

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: plan
    });

  } catch (error) {
    console.error('Create subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription plan',
      error: error.message
    });
  }
});

// Update subscription plan
router.put('/subscription-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, interval, benefits, features, isActive } = req.body;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // If name is being updated, generate new slug
    let slug = plan.slug;
    if (name && name !== plan.name) {
      slug = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      // Check if new slug already exists
      const existingPlan = await SubscriptionPlan.findOne({
        where: {
          slug: slug,
          id: { [Op.ne]: id }
        }
      });

      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: 'Subscription plan with this slug already exists'
        });
      }
    }

    await plan.update({
      name: name || plan.name,
      slug: slug,
      price: price !== undefined ? price : plan.price,
      interval: interval || plan.interval,
      benefits: benefits !== undefined ? benefits : plan.benefits,
      features: features !== undefined ? features : plan.features,
      isActive: isActive !== undefined ? isActive : plan.isActive
    });

    res.json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: plan
    });

  } catch (error) {
    console.error('Update subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription plan',
      error: error.message
    });
  }
});

// Delete subscription plan
router.delete('/subscription-plans/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Check if plan has active subscriptions
    const activeSubscriptionsCount = await ProviderSubscription.count({
      where: {
        planId: id,
        status: 'active'
      }
    });

    if (activeSubscriptionsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. It has ${activeSubscriptionsCount} active subscription(s). Please cancel or transfer the subscriptions first.`
      });
    }

    await plan.destroy();

    res.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });

  } catch (error) {
    console.error('Delete subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subscription plan',
      error: error.message
    });
  }
});

// Toggle subscription plan status
router.put('/subscription-plans/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    await plan.update({ isActive });

    res.json({
      success: true,
      message: `Subscription plan ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: plan.id,
        name: plan.name,
        isActive: plan.isActive
      }
    });

  } catch (error) {
    console.error('Toggle subscription plan status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle subscription plan status',
      error: error.message
    });
  }
});

// ==================== PROVIDER SUBSCRIPTIONS MANAGEMENT ====================

// Get all provider subscriptions with pagination and filters
router.get('/subscriptions', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '', 
      planId = '',
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Plan filter
    if (planId) {
      whereClause.planId = planId;
    }

    const { count, rows: subscriptions } = await ProviderSubscription.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ProviderProfile,
          as: 'ProviderProfile',
          attributes: ['id', 'businessName', 'verificationStatus'],
          include: [
            {
              model: User,
              attributes: ['id', 'fullName', 'email'],
              where: search ? {
                [Op.or]: [
                  { fullName: { [Op.like]: `%${search}%` } },
                  { email: { [Op.like]: `%${search}%` } }
                ]
              } : undefined,
              required: search ? true : false
            }
          ],
          required: search ? true : false
        },
        {
          model: SubscriptionPlan,
          as: 'SubscriptionPlan',
          attributes: ['id', 'name', 'slug', 'price', 'interval', 'features']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: [
        'id', 'status', 'currentPeriodStart', 'currentPeriodEnd', 
        'autoRenew', 'metadata', 'createdAt', 'updatedAt'
      ]
    });

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
});

// Get single subscription with details
router.get('/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await ProviderSubscription.findByPk(id, {
      include: [
        {
          model: ProviderProfile,
          as: 'ProviderProfile',
          attributes: [
            'id', 'businessName', 'verificationStatus', 'businessAddress', 
            'businessPhone', 'businessEmail', 'yearsOfExperience'
          ],
          include: [
            {
              model: User,
              attributes: ['id', 'fullName', 'email', 'phone']
            }
          ]
        },
        {
          model: SubscriptionPlan,
          as: 'SubscriptionPlan',
          attributes: ['id', 'name', 'slug', 'price', 'interval', 'benefits', 'features']
        }
      ],
      attributes: [
        'id', 'status', 'currentPeriodStart', 'currentPeriodEnd', 
        'autoRenew', 'metadata', 'createdAt', 'updatedAt'
      ]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: subscription
    });

  } catch (error) {
    console.error('Get subscription by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription details',
      error: error.message
    });
  }
});

// Update subscription status
router.put('/subscriptions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const subscription = await ProviderSubscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await subscription.update({ status });

    res.json({
      success: true,
      message: `Subscription ${status} successfully`,
      data: subscription
    });

  } catch (error) {
    console.error('Update subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription status',
      error: error.message
    });
  }
});

// Update subscription auto-renewal
router.put('/subscriptions/:id/auto-renew', async (req, res) => {
  try {
    const { id } = req.params;
    const { autoRenew } = req.body;

    const subscription = await ProviderSubscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await subscription.update({ autoRenew });

    res.json({
      success: true,
      message: `Auto-renewal ${autoRenew ? 'enabled' : 'disabled'} successfully`,
      data: subscription
    });

  } catch (error) {
    console.error('Update subscription auto-renewal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription auto-renewal',
      error: error.message
    });
  }
});

// Get subscription expiration statistics
router.get('/subscription-expiration-stats', async (req, res) => {
  try {
    const SubscriptionExpirationService = (await import('../services/subscriptionExpirationService.js')).default;
    const expirationService = new SubscriptionExpirationService();
    
    const stats = await expirationService.getExpirationStats();
    
    res.json({
      success: true,
      message: 'Subscription expiration statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Get subscription expiration stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription expiration statistics',
      error: error.message
    });
  }
});

// Manually trigger subscription expiration check
router.post('/subscription-expiration-check', async (req, res) => {
  try {
    const SubscriptionExpirationService = (await import('../services/subscriptionExpirationService.js')).default;
    const expirationService = new SubscriptionExpirationService();
    
    await expirationService.checkExpiredSubscriptions();
    
    res.json({
      success: true,
      message: 'Subscription expiration check completed successfully'
    });
  } catch (error) {
    console.error('Manual subscription expiration check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run subscription expiration check',
      error: error.message
    });
  }
});

// Get expired subscriptions with pagination
router.get('/expired-subscriptions', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'currentPeriodEnd', 
      sortOrder = 'DESC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {
      status: 'expired'
    };

    const { count, rows: subscriptions } = await ProviderSubscription.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ProviderProfile,
          as: 'ProviderProfile',
          attributes: ['id', 'businessName', 'verificationStatus'],
          include: [
            {
              model: User,
              attributes: ['id', 'fullName', 'email'],
              where: search ? {
                [Op.or]: [
                  { fullName: { [Op.like]: `%${search}%` } },
                  { email: { [Op.like]: `%${search}%` } }
                ]
              } : undefined,
              required: search ? true : false
            }
          ],
          required: search ? true : false
        },
        {
          model: SubscriptionPlan,
          as: 'SubscriptionPlan',
          attributes: ['id', 'name', 'slug', 'price', 'interval', 'features']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: [
        'id', 'status', 'currentPeriodStart', 'currentPeriodEnd', 
        'autoRenew', 'metadata', 'createdAt', 'updatedAt'
      ]
    });

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get expired subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expired subscriptions',
      error: error.message
    });
  }
});

// Renew expired subscription
router.post('/subscriptions/:id/renew', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPeriodEnd, planId } = req.body;

    const subscription = await ProviderSubscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status !== 'expired') {
      return res.status(400).json({
        success: false,
        message: 'Only expired subscriptions can be renewed'
      });
    }

    // Update subscription
    const updateData = {
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: newPeriodEnd ? new Date(newPeriodEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    if (planId) {
      updateData.planId = planId;
    }

    await subscription.update(updateData);

    // Update provider payment status
    await ProviderProfile.update(
      { paymentStatus: 'paid' },
      { where: { id: subscription.providerId } }
    );

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      data: subscription
    });

  } catch (error) {
    console.error('Renew subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew subscription',
      error: error.message
    });
  }
});

export default router;



