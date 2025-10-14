import { SavedProvider, ProviderProfile, User } from '../schema/index.js';
import { Op } from 'sequelize';

class FavoritesService {
  /**
   * Add a provider to user's favorites
   * @param {string} userId - User ID
   * @param {string} providerId - Provider ID
   * @returns {Promise<Object>} Saved provider object
   */
  static async addFavorite(userId, providerId) {
    // Validate provider exists
    const provider = await ProviderProfile.findByPk(providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    // Check if already favorited
    const existingFavorite = await SavedProvider.findOne({
      where: { userId, providerId }
    });

    if (existingFavorite) {
      throw new Error('Provider is already in favorites');
    }

    // Create favorite
    const favorite = await SavedProvider.create({
      userId,
      providerId
    });

    return favorite;
  }

  /**
   * Remove a provider from user's favorites
   * @param {string} userId - User ID
   * @param {string} providerId - Provider ID
   * @returns {Promise<boolean>} Success status
   */
  static async removeFavorite(userId, providerId) {
    const favorite = await SavedProvider.findOne({
      where: { userId, providerId }
    });

    if (!favorite) {
      throw new Error('Favorite not found');
    }

    await favorite.destroy();
    return true;
  }

  /**
   * Get all favorite providers for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Favorite providers with pagination
   */
  static async getUserFavorites(userId, options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      category,
      location,
      search 
    } = options;

    const offset = (page - 1) * limit;

    // Build where clause for provider filtering
    const providerWhere = {};
    if (category) providerWhere.category = category;
    if (location) {
      providerWhere[Op.or] = [
        { locationCity: { [Op.iLike]: `%${location}%` } },
        { locationState: { [Op.iLike]: `%${location}%` } }
      ];
    }
    if (search) {
      providerWhere[Op.or] = [
        { businessName: { [Op.iLike]: `%${search}%` } },
        { bio: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: favorites } = await SavedProvider.findAndCountAll({
      where: { userId },
      include: [
        {
          model: ProviderProfile,
          as: 'provider',
          where: Object.keys(providerWhere).length > 0 ? providerWhere : undefined,
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      favorites: favorites.map(fav => ({
        id: fav.id,
        providerId: fav.providerId,
        savedAt: fav.createdAt,
        provider: fav.provider
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  /**
   * Check if a provider is in user's favorites
   * @param {string} userId - User ID
   * @param {string} providerId - Provider ID
   * @returns {Promise<boolean>} Is favorited status
   */
  static async isFavorited(userId, providerId) {
    const favorite = await SavedProvider.findOne({
      where: { userId, providerId }
    });

    return !!favorite;
  }

  /**
   * Get favorite count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Count of favorites
   */
  static async getFavoriteCount(userId) {
    const count = await SavedProvider.count({
      where: { userId }
    });

    return count;
  }

  /**
   * Get multiple favorite statuses at once
   * @param {string} userId - User ID
   * @param {Array<string>} providerIds - Array of provider IDs
   * @returns {Promise<Object>} Map of provider IDs to favorite status
   */
  static async getBulkFavoriteStatus(userId, providerIds) {
    const favorites = await SavedProvider.findAll({
      where: {
        userId,
        providerId: { [Op.in]: providerIds }
      },
      attributes: ['providerId']
    });

    const favoriteMap = {};
    providerIds.forEach(id => {
      favoriteMap[id] = favorites.some(fav => fav.providerId === id);
    });

    return favoriteMap;
  }

  /**
   * Toggle favorite status (add if not exists, remove if exists)
   * @param {string} userId - User ID
   * @param {string} providerId - Provider ID
   * @returns {Promise<Object>} Result with action taken
   */
  static async toggleFavorite(userId, providerId) {
    // Validate provider exists
    const provider = await ProviderProfile.findByPk(providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    const existingFavorite = await SavedProvider.findOne({
      where: { userId, providerId }
    });

    if (existingFavorite) {
      // Remove from favorites
      await existingFavorite.destroy();
      return {
        action: 'removed',
        isFavorited: false,
        message: 'Provider removed from favorites'
      };
    } else {
      // Add to favorites
      await SavedProvider.create({
        userId,
        providerId
      });
      return {
        action: 'added',
        isFavorited: true,
        message: 'Provider added to favorites'
      };
    }
  }
}

export default FavoritesService;


