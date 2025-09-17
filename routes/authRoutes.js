import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth API is working' });
});

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/firebase', authController.firebaseAuth);

// Protected routes
router.get('/verify', authenticateToken, authController.verifyToken);
router.put('/profile', authenticateToken, authController.updateProfile);

export default router;
