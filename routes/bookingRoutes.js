import express from 'express';
import {
  createBookingController,
  getBookingsController,
  getBookingByIdController,
  updateBookingStatusController,
  cancelBookingController,
  getProviderAvailabilityController,
  getBookingStatsController
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All booking routes require authentication
router.use(authenticateToken);

// Create a new booking
router.post('/', createBookingController);

// Get user's bookings (customer or provider)
router.get('/', getBookingsController);

// Get booking statistics
router.get('/stats', getBookingStatsController);

// Get specific booking by ID
router.get('/:id', getBookingByIdController);

// Update booking status (accept, start, complete, etc.)
router.patch('/:id/status', updateBookingStatusController);

// Cancel a booking
router.patch('/:id/cancel', cancelBookingController);

// Get provider availability for a specific date
router.get('/provider/:providerId/availability', getProviderAvailabilityController);

export default router;
