import express from 'express';
import newsletterRoutes from './newsletterRoutes.js';
import providerRoutes from './providerRoutes.js';
import locationRoutes from './locationRoutes.js';
import authRoutes from './authRoutes.js';

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