import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../schema/index.js';
import { uploadSingleDocument, processUploadedFiles, handleUploadError } from '../middlewares/uploadMiddleware.js';

const router = Router();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find admin user
    const admin = await User.findOne({
      where: {
        email: email.toLowerCase(),
        role: 'admin',
        status: 'active'
      }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await admin.update({ lastLoginAt: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: admin.id,
        email: admin.email,
        role: admin.role,
        isAdmin: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          avatarUrl: admin.avatarUrl,
          lastLoginAt: admin.lastLoginAt
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create Admin User (for initial setup)
router.post('/create', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required'
      });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: {
        email: email.toLowerCase(),
        role: 'admin'
      }
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin user already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const admin = await User.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      status: 'active',
      isEmailVerified: true,
      isPhoneVerified: true
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify Admin Token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin' || !decoded.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token'
      });
    }

    // Get admin user
    const admin = await User.findByPk(decoded.userId, {
      attributes: ['id', 'fullName', 'email', 'role', 'avatarUrl', 'lastLoginAt']
    });

    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Admin user not found or inactive'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        admin: {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          avatarUrl: admin.avatarUrl,
          lastLoginAt: admin.lastLoginAt
        }
      }
    });

  } catch (error) {
    console.error('Admin token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Get Admin Profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin' || !decoded.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token'
      });
    }

    // Get admin user
    const admin = await User.findByPk(decoded.userId, {
      attributes: ['id', 'fullName', 'email', 'role', 'avatarUrl', 'lastLoginAt', 'createdAt', 'status']
    });

    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Admin user not found or inactive'
      });
    }

    res.json({
      success: true,
      message: 'Admin profile retrieved successfully',
      data: {
        admin: {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          avatarUrl: admin.avatarUrl,
          lastLoginAt: admin.lastLoginAt,
          createdAt: admin.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update Admin Profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { fullName, avatarUrl } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin' || !decoded.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token'
      });
    }

    // Get admin user
    const admin = await User.findByPk(decoded.userId);

    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Admin user not found or inactive'
      });
    }

    // Update profile
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    await admin.update(updateData);

    res.json({
      success: true,
      message: 'Admin profile updated successfully',
      data: {
        admin: {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          avatarUrl: admin.avatarUrl,
          lastLoginAt: admin.lastLoginAt
        }
      }
    });

  } catch (error) {
    console.error('Admin profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change Admin Password
router.put('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { currentPassword, newPassword } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin' || !decoded.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token'
      });
    }

    // Get admin user
    const admin = await User.findByPk(decoded.userId);

    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Admin user not found or inactive'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await admin.update({ passwordHash: newPasswordHash });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Admin password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload Admin Avatar
router.post('/upload-avatar', uploadSingleDocument, processUploadedFiles, handleUploadError, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin' || !decoded.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token'
      });
    }

    if (!req.uploadResults || !req.uploadResults.document) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or upload failed'
      });
    }

    // Get admin user
    const admin = await User.findByPk(decoded.userId);

    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Admin user not found or inactive'
      });
    }

    // Update admin avatar URL with Cloudinary URL
    const avatarUrl = req.uploadResults.document.secure_url;
    await admin.update({ avatarUrl });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl: avatarUrl
      }
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;






