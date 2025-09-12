import multer from 'multer';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
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

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 2 // Maximum 2 files (document + thumbnail)
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
 * Process uploaded files and upload to Cloudinary
 */
export const processUploadedFiles = async (req, res, next) => {
  try {
    if (!req.files && !req.file) {
      return next();
    }

    const uploadResults = {};

    // Handle multiple files (document + thumbnail)
    if (req.files) {
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
      const uploadOptions = {
        folder: 'awari-kyc/documents',
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
