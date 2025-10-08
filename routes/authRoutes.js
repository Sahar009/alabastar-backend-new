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
router.post('/provider/login', authController.loginProvider);
router.post('/firebase', authController.firebaseAuth);

// Protected routes
router.get('/verify', authenticateToken, authController.verifyToken);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);
router.delete('/delete-account', authenticateToken, authController.deleteAccount);

export default router;
