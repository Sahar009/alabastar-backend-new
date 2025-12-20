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
router.post('/google', authController.googleAuth);
router.post('/firebase', authController.firebaseAuth);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/verify', authenticateToken, authController.verifyToken);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);
router.delete('/delete-account', authenticateToken, authController.deleteAccount);

export default router;
