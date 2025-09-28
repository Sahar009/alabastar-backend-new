import express from 'express';
import providerController from '../controllers/providerController.js';
import { uploadProviderDocuments, processUploadedFiles, handleUploadError } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Provider registration
router.post('/register', providerController.registerProvider);

// Get provider profile
router.get('/profile/:providerId', providerController.getProviderProfile);

// Update provider profile
router.put('/profile/:providerId', providerController.updateProviderProfile);

// Get providers by category
router.get('/category/:category', providerController.getProvidersByCategory);

// Search providers
router.get('/search', providerController.searchProviders);

// Get provider's active services (by provider profile id)
router.get('/:providerId/services', providerController.getProviderServices);

// Get popular subcategories for a category
router.get('/subcategories/:category', providerController.getPopularSubcategories);

// Upload provider documents
router.post('/documents/upload', uploadProviderDocuments, processUploadedFiles, handleUploadError, (req, res) => {
  try {
    if (!req.uploadResults || !req.uploadResults.documents) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = req.files.map((file, index) => ({
      filename: req.uploadResults.documents[index].public_id,
      originalName: file.originalname,
      url: req.uploadResults.documents[index].secure_url,
      size: file.size,
      mimetype: file.mimetype,
      publicId: req.uploadResults.documents[index].public_id
    }));

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed'
    });
  }
});

export default router;
