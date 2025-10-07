import express from 'express';
import { 
  createReview,
  getProviderReviews,
  getAllReviews,
  updateReviewVisibility,
  deleteReview,
  getUserReviews,
  getProviderReviewStats,
  getProviderWithRating
} from '../controllers/reviewController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/provider/:providerId', getProviderReviews);
router.get('/provider/:providerId/stats', getProviderReviewStats);
router.get('/provider/:providerId/info', getProviderWithRating);

// Protected routes (require authentication)
router.post('/', authenticateToken, createReview);
router.get('/my-reviews', authenticateToken, getUserReviews);
router.delete('/:reviewId', authenticateToken, deleteReview);

// Admin routes
router.get('/admin/all', authenticateToken, getAllReviews);
router.patch('/admin/:reviewId/visibility', authenticateToken, updateReviewVisibility);

export default router;



