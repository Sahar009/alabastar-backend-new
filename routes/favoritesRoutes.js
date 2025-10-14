import express from 'express';
import { 
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavoriteStatus,
  getFavoriteCount,
  getBulkFavoriteStatus,
  toggleFavorite
} from '../controllers/favoritesController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all user's favorites
router.get('/', getUserFavorites);

// Get favorite count
router.get('/count', getFavoriteCount);

// Check if a provider is favorited
router.get('/check/:providerId', checkFavoriteStatus);

// Get bulk favorite status for multiple providers
router.post('/bulk-check', getBulkFavoriteStatus);

// Add a provider to favorites
router.post('/', addFavorite);

// Toggle favorite status
router.post('/toggle', toggleFavorite);

// Remove a provider from favorites
router.delete('/:providerId', removeFavorite);

export default router;


