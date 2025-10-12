import express from 'express';
import { getDashboardStats, getRecentActivities } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';

const router = express.Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get provider dashboard statistics
 * @access  Private (Provider only)
 */
router.get('/stats', authenticateToken, authorizeRoles(['provider']), getDashboardStats);

/**
 * @route   GET /api/dashboard/activities
 * @desc    Get recent activities for provider dashboard
 * @access  Private (Provider only)
 */
router.get('/activities', authenticateToken, authorizeRoles(['provider']), getRecentActivities);

export default router;

