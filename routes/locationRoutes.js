import express from 'express';
import locationController from '../controllers/locationController.js';

const router = express.Router();

// Search locations
router.get('/search', locationController.searchLocation);

// Reverse geocode coordinates
router.get('/reverse', locationController.reverseGeocode);

export default router;






