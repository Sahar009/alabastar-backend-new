import dashboardService from '../services/dashboardService.js';
import { messageHandler } from '../utils/index.js';
import { SUCCESS, INTERNAL_SERVER_ERROR, NOT_FOUND } from '../constants/statusCode.js';
import { ProviderProfile } from '../schema/index.js';

/**
 * Get provider dashboard statistics
 */
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Get provider profile
    const providerProfile = await ProviderProfile.findOne({
      where: { userId }
    });

    if (!providerProfile) {
      return messageHandler(res, NOT_FOUND, 'Provider profile not found');
    }

    const stats = await dashboardService.getProviderDashboardStats(providerProfile.id);
    
    return messageHandler(res, SUCCESS, 'Dashboard statistics retrieved successfully', stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return messageHandler(res, INTERNAL_SERVER_ERROR, 'Failed to fetch dashboard statistics', null);
  }
};

/**
 * Get recent activities for provider dashboard
 */
export const getRecentActivities = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Get provider profile
    const providerProfile = await ProviderProfile.findOne({
      where: { userId }
    });

    if (!providerProfile) {
      return messageHandler(res, NOT_FOUND, 'Provider profile not found');
    }

    const activities = await dashboardService.getRecentActivities(providerProfile.id, limit);
    
    return messageHandler(res, SUCCESS, 'Recent activities retrieved successfully', { activities });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return messageHandler(res, INTERNAL_SERVER_ERROR, 'Failed to fetch recent activities', null);
  }
};

