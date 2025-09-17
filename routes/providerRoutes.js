import express from 'express';
import providerController from '../controllers/providerController.js';
import { uploadSingleDocument, processUploadedFiles, handleUploadError } from '../middlewares/uploadMiddleware.js';

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

// Upload provider documents
router.post('/documents/upload', uploadSingleDocument, processUploadedFiles, handleUploadError, (req, res) => {
  try {
    if (!req.uploadResults || !req.uploadResults.document) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFile = {
      filename: req.uploadResults.document.public_id,
      originalName: req.file.originalname,
      url: req.uploadResults.document.secure_url,
      size: req.file.size,
      mimetype: req.file.mimetype,
      publicId: req.uploadResults.document.public_id
    };

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: uploadedFile
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
