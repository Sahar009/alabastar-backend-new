import multer from 'multer';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function for documents
const fileFilter = (req, file, cb) => {
  // Allowed file types for KYC documents
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// File filter function for messaging (allows more file types)
const messagingFileFilter = (req, file, cb) => {
  // Allowed file types for messaging (images, videos, audio, documents)
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    // Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed for messaging.`), false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files for provider documents
  }
});

// File filter for profile pictures (images only)
const profilePictureFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for profile pictures.'), false);
  }
};

const profilePictureUpload = multer({
  storage,
  fileFilter: profilePictureFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile pictures
    files: 1
  }
});

/**
 * Middleware for uploading KYC documents
 */
export const uploadKycDocuments = upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

/**
 * Middleware for uploading single document
 */
export const uploadSingleDocument = upload.single('document');

/**
 * Middleware for uploading profile pictures
 */
export const uploadProfilePicture = profilePictureUpload.single('avatar');

/**
 * Middleware for uploading multiple provider documents
 */
export const uploadProviderDocuments = upload.array('documents', 5);

/**
 * Middleware for uploading brand images
 */
export const uploadBrandImages = upload.array('brandImages', 10);

/**
 * Multer configuration for messaging
 */
const messagingUpload = multer({
  storage,
  fileFilter: messagingFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for messaging (videos can be large)
    files: 1
  }
});

/**
 * Middleware for uploading message files (images, videos, audio, documents)
 */
export const uploadMessageFile = messagingUpload.single('file');

/**
 * Process uploaded files and upload to Cloudinary
 */
export const processUploadedFiles = async (req, res, next) => {
  try {
    if (!req.files && !req.file) {
      return next();
    }

    const uploadResults = {};

    // Handle multiple files from upload.array() - files are in req.files as array
    if (req.files && Array.isArray(req.files)) {
      const documents = [];
      for (const file of req.files) {
        const uploadOptions = {
          folder: req.route?.path?.includes('brand-images') ? 'alabastar/brand-images' : 'alabastar/documents',
          resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw'
        };

        const result = await uploadToCloudinary(file.buffer, uploadOptions);
        
        if (result.success) {
          documents.push({
            public_id: result.data.public_id,
            secure_url: result.data.secure_url,
            format: result.data.format,
            bytes: result.data.bytes
          });
        } else {
          throw new Error(`Failed to upload document: ${result.error}`);
        }
      }
      uploadResults.documents = documents;
    }

    // Handle multiple files (document + thumbnail) - files are in req.files as object
    if (req.files && !Array.isArray(req.files)) {
      for (const [fieldName, files] of Object.entries(req.files)) {
        if (files && files.length > 0) {
          const file = files[0];
          const uploadOptions = {
            folder: `awari-kyc/${fieldName}`,
            resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw'
          };

          const result = await uploadToCloudinary(file.buffer, uploadOptions);
          
          if (result.success) {
            uploadResults[fieldName] = {
              public_id: result.data.public_id,
              secure_url: result.data.secure_url,
              format: result.data.format,
              bytes: result.data.bytes
            };
          } else {
            throw new Error(`Failed to upload ${fieldName}: ${result.error}`);
          }
        }
      }
    }

    // Handle single file
    if (req.file) {
      // Use different folder for profile pictures
      const folder = req.route?.path?.includes('/profile/picture') 
        ? 'alabastar/profile-pictures' 
        : 'awari-kyc/documents';
      
      const uploadOptions = {
        folder: folder,
        resource_type: req.file.mimetype.startsWith('image/') ? 'image' : 'raw'
      };

      const result = await uploadToCloudinary(req.file.buffer, uploadOptions);
      
      if (result.success) {
        uploadResults.document = {
          public_id: result.data.public_id,
          secure_url: result.data.secure_url,
          format: result.data.format,
          bytes: result.data.bytes
        };
      } else {
        throw new Error(`Failed to upload document: ${result.error}`);
      }
    }

    // Attach upload results to request
    req.uploadResults = uploadResults;
    next();
  } catch (error) {
    console.error('File processing error:', error);
    res.status(400).json({
      success: false,
      message: 'File upload failed',
      error: error.message
    });
  }
};

/**
 * Clean up uploaded files on error
 */
export const cleanupUploadedFiles = async (req, res, next) => {
  try {
    next();
  } catch (error) {
    // Clean up any uploaded files if there's an error
    if (req.uploadResults) {
      for (const [fieldName, fileData] of Object.entries(req.uploadResults)) {
        if (fileData.public_id) {
          await deleteFromCloudinary(fileData.public_id);
        }
      }
    }
    throw error;
  }
};

/**
 * Error handler for multer errors
 */
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 2 files.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }

  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};
