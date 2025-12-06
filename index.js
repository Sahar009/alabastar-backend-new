import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { specs, swaggerUi } from './config/swagger.js';
import router from './routes/index.js';
import { connectToDB } from './database/db.js';
import { config } from './config/config.js';
import initializeFirebase from './config/firebase.js';
import { initializeSocket } from './config/socket.js';
import SubscriptionExpirationService from './services/subscriptionExpirationService.js';
import { ensurePrivacySettingsColumn } from './utils/ensurePrivacySettingsColumn.js';
import { initializeAdminUsers } from './utils/initializeAdminUsers.js';
import './schema/index.js';

const app = express();
const httpServer = createServer(app);
const PORT = config.server.port; 

app.use(helmet());

app.use(cors({
  origin:'*',
  credentials: true
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ALABASTAR Projects API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true
  }
}));

// API routes
router(app);

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});


const startServer = async () => {
  try {
    // Check critical environment variables
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not set in environment variables!');
      console.error('⚠️  Admin authentication will fail. Please set JWT_SECRET in your .env file.');
    }

    await connectToDB();
    console.log('✅ Database connected successfully');

    // Ensure privacySettings column exists (auto-migration on startup)
    await ensurePrivacySettingsColumn();

    // Initialize default admin users (admin@alabastar.com and support@alabastar.com)
    await initializeAdminUsers();

    // Initialize Firebase Admin SDK
    const firebaseInitialized = initializeFirebase();
    if (firebaseInitialized) {
      console.log('🔥 Firebase Admin SDK initialized successfully');
    } else {
      console.log('⚠️  Firebase Admin SDK not configured - Google Sign-In will not work');
    }

    // Initialize Socket.io for real-time messaging
    initializeSocket(httpServer);

    // Initialize Subscription Expiration Service
    const subscriptionExpirationService = new SubscriptionExpirationService();
    subscriptionExpirationService.start();
    console.log('⏰ Subscription expiration monitoring started');

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`💬 Socket.io: Real-time messaging enabled`);
      console.log(`⏰ Subscription Expiration: Monitoring active`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();


