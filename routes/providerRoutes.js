import express from 'express';
import providerController from '../controllers/providerController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { uploadProviderDocuments, uploadBrandImages, processUploadedFiles, handleUploadError } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Provider registration (complete registration)
router.post('/register', providerController.registerProvider);

// Step-by-step provider registration
router.post('/register/step/:stepNumber', providerController.saveRegistrationStep);
router.get('/register/progress', authenticateToken, providerController.getRegistrationProgress);
router.put('/register/progress', authenticateToken, providerController.updateRegistrationProgress);

// Debug endpoint to check user's provider status
router.get('/debug-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ProviderProfile, Payment, User } = await import('../schema/index.js');
    
    // Get user info
    const user = await User.findByPk(userId);
    
    // Get provider profile
    const providerProfile = await ProviderProfile.findOne({ where: { userId } });
    
    // Get payments for this user
    const payments = await Payment.findAll({ 
      where: { customerEmail: user.email },
      order: [['createdAt', 'DESC']]
    });
    
    // Get registration progress
    const { default: providerService } = await import('../services/providerService.js');
    const progressResult = await providerService.getRegistrationProgress(userId);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        providerProfile: providerProfile ? {
          id: providerProfile.id,
          businessName: providerProfile.businessName,
          paymentStatus: providerProfile.paymentStatus,
          verificationStatus: providerProfile.verificationStatus,
          createdAt: providerProfile.createdAt
        } : null,
        payments: payments.map(p => ({
          reference: p.reference,
          amount: p.amount,
          status: p.status,
          paymentType: p.paymentType,
          providerId: p.providerId,
          createdAt: p.createdAt,
          metadata: p.metadata ? JSON.parse(p.metadata) : null
        })),
        registrationProgress: progressResult.data
      }
    });
  } catch (error) {
    console.error('Debug status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get debug status',
      error: error.message
    });
  }
});

// Fix registration progress for users who have paid but progress wasn't updated
router.post('/fix-registration-progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { default: providerService } = await import('../services/providerService.js');
    
    // This will automatically fix the progress if user has paid but progress is incomplete
    const result = await providerService.getRegistrationProgress(userId);
    
    res.json({
      success: true,
      message: 'Registration progress checked and fixed if needed',
      data: result.data
    });
  } catch (error) {
    console.error('Error fixing registration progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix registration progress',
      error: error.message
    });
  }
});

// Initialize payment for registration (before provider registration)
router.post('/initialize-payment', providerController.initializePaymentForRegistration);

// Get provider profile
router.get('/profile/:providerId', providerController.getProviderProfile);

// Get current user's provider profile (requires authentication)
router.get('/profile', authenticateToken, providerController.getCurrentProviderProfile);

// Update provider profile
router.put('/profile/:providerId', providerController.updateProviderProfile);

// Update current user's provider profile (requires authentication)
router.put('/profile', authenticateToken, providerController.updateCurrentProviderProfile);

// Get providers by category
router.get('/category/:category', providerController.getProvidersByCategory);

// Search providers
router.get('/search', providerController.searchProviders);

// Get provider documents
router.get('/:providerId/documents', authenticateToken, providerController.getProviderDocuments);

// Upload provider document
router.post('/:providerId/documents', authenticateToken, uploadProviderDocuments, processUploadedFiles, handleUploadError, providerController.uploadProviderDocument);

// Delete provider document
router.delete('/:providerId/documents/:documentId', authenticateToken, providerController.deleteProviderDocument);

// Get provider feature limits
router.get('/:providerId/feature-limits', authenticateToken, providerController.getFeatureLimits);

// Get current user's feature limits (for subscription page)
router.get('/feature-limits', authenticateToken, providerController.getCurrentUserFeatureLimits);

// Upload provider video (Premium feature)
router.post('/:providerId/video', authenticateToken, providerController.uploadProviderVideo);

// Delete provider video
router.delete('/:providerId/video', authenticateToken, providerController.deleteProviderVideo);

// Initialize provider payment
router.post('/:providerId/initialize-payment', providerController.initializeProviderPayment);

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

// Upload brand images
router.post('/brand-images/upload', uploadBrandImages, processUploadedFiles, handleUploadError, (req, res) => {
  try {
    if (!req.uploadResults || !req.uploadResults.documents) {
      return res.status(400).json({
        success: false,
        message: 'No brand images uploaded'
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
      message: 'Brand images uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Brand image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Brand image upload failed'
    });
  }
});

export default router;
