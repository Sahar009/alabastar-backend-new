import express from 'express';
import newsletterRoutes from './newsletterRoutes.js';
import providerRoutes from './providerRoutes.js';
import locationRoutes from './locationRoutes.js';
import authRoutes from './authRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import referralRoutes from './referralRoutes.js';
import subscriptionPlanRoutes from './subscriptionPlanRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import earningsRoutes from './earningsRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import favoritesRoutes from './favoritesRoutes.js';

const router = (app) => {
  // API routes

  // Auth routes
  app.use('/api/auth', authRoutes);
  
  // Newsletter routes
  app.use('/api/newsletter', newsletterRoutes);
  
  // Provider routes
  app.use('/api/providers', providerRoutes);
  
  // Location routes
  app.use('/api/location', locationRoutes);
  
  // Booking routes
  app.use('/api/bookings', bookingRoutes);
  
  // Payment routes
  app.use('/api/payments', paymentRoutes);
  
  // Notification routes
  app.use('/api/notifications', notificationRoutes);
  
  // Review routes
  app.use('/api/reviews', reviewRoutes);
  
  // Referral routes
  app.use('/api/referrals', referralRoutes);
  
  // Subscription plan routes
  app.use('/api/subscription-plans', subscriptionPlanRoutes);
  
  // Subscription routes (for providers)
  app.use('/api/subscriptions', subscriptionRoutes);
  
  // Earnings routes (for providers)
  app.use('/api/earnings', earningsRoutes);
  
  // Dashboard routes (for providers)
  app.use('/api/dashboard', dashboardRoutes);
  
  // Favorites routes
  app.use('/api/favorites', favoritesRoutes);

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'AWARI Projects API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  });

  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to Alabastar Projects API, you have no business here !! ',
      documentation: '/api-docs',
      health: '/api/health'
    });
  });
};

export default router;