import { SUCCESS, CREATED, BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR } from '../constants/statusCode.js';
import FavoritesService from '../services/favoritesService.js';

/**
 * Add a provider to favorites
 * @route POST /api/favorites
 */
export const addFavorite = async (req, res) => {
  try {
    const { providerId } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!providerId) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Provider ID is required'
      });
    }

    const favorite = await FavoritesService.addFavorite(userId, providerId);

    return res.status(CREATED).json({
      success: true,
      message: 'Provider added to favorites successfully',
      data: favorite
    });
  } catch (error) {
    console.error('Error adding favorite:', error);

    if (error.message === 'Provider not found') {
      return res.status(NOT_FOUND).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Provider is already in favorites') {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: error.message
      });
    }

    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to add provider to favorites',
      error: error.message
    });
  }
};

/**
 * Remove a provider from favorites
 * @route DELETE /api/favorites/:providerId
 */
export const removeFavorite = async (req, res) => {
  try {
    const { providerId } = req.params;
    const userId = req.user.id;

    if (!providerId) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Provider ID is required'
      });
    }

    await FavoritesService.removeFavorite(userId, providerId);

    return res.status(SUCCESS).json({
      success: true,
      message: 'Provider removed from favorites successfully'
    });
  } catch (error) {
    console.error('Error removing favorite:', error);

    if (error.message === 'Favorite not found') {
      return res.status(NOT_FOUND).json({
        success: false,
        message: error.message
      });
    }

    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to remove provider from favorites',
      error: error.message
    });
  }
};

/**
 * Get all favorite providers for a user
 * @route GET /api/favorites
 */
export const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, category, location, search } = req.query;

    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      category,
      location,
      search
    };

    const result = await FavoritesService.getUserFavorites(userId, options);

    return res.status(SUCCESS).json({
      success: true,
      message: 'Favorites retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error getting favorites:', error);

    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve favorites',
      error: error.message
    });
  }
};

/**
 * Check if a provider is favorited
 * @route GET /api/favorites/check/:providerId
 */
export const checkFavoriteStatus = async (req, res) => {
  try {
    const { providerId } = req.params;
    const userId = req.user.id;

    if (!providerId) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Provider ID is required'
      });
    }

    const isFavorited = await FavoritesService.isFavorited(userId, providerId);

    return res.status(SUCCESS).json({
      success: true,
      data: {
        isFavorited,
        providerId
      }
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);

    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to check favorite status',
      error: error.message
    });
  }
};

/**
 * Get favorite count for user
 * @route GET /api/favorites/count
 */
export const getFavoriteCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await FavoritesService.getFavoriteCount(userId);

    return res.status(SUCCESS).json({
      success: true,
      data: {
        count
      }
    });
  } catch (error) {
    console.error('Error getting favorite count:', error);

    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get favorite count',
      error: error.message
    });
  }
};

/**
 * Get bulk favorite status for multiple providers
 * @route POST /api/favorites/bulk-check
 */
export const getBulkFavoriteStatus = async (req, res) => {
  try {
    const { providerIds } = req.body;
    const userId = req.user.id;

    if (!providerIds || !Array.isArray(providerIds)) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Provider IDs array is required'
      });
    }

    const favoriteMap = await FavoritesService.getBulkFavoriteStatus(userId, providerIds);

    return res.status(SUCCESS).json({
      success: true,
      data: favoriteMap
    });
  } catch (error) {
    console.error('Error getting bulk favorite status:', error);

    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get bulk favorite status',
      error: error.message
    });
  }
};

/**
 * Toggle favorite status (add if not exists, remove if exists)
 * @route POST /api/favorites/toggle
 */
export const toggleFavorite = async (req, res) => {
  try {
    const { providerId } = req.body;
    const userId = req.user.id;

    if (!providerId) {
      return res.status(BAD_REQUEST).json({
        success: false,
        message: 'Provider ID is required'
      });
    }

    const result = await FavoritesService.toggleFavorite(userId, providerId);

    return res.status(SUCCESS).json({
      success: true,
      message: result.message,
      data: {
        action: result.action,
        isFavorited: result.isFavorited,
        providerId
      }
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);

    if (error.message === 'Provider not found') {
      return res.status(NOT_FOUND).json({
        success: false,
        message: error.message
      });
    }

    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to toggle favorite',
      error: error.message
    });
  }
};


