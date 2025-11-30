import jwt from 'jsonwebtoken';
import { User } from '../schema/index.js';

// Admin Authentication Middleware
export const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (decoded.role !== 'admin' || !decoded.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get admin user
    const admin = await User.findByPk(decoded.userId, {
      attributes: ['id', 'fullName', 'email', 'role', 'status', 'avatarUrl']
    });

    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin user not found or inactive.'
      });
    }

    // Add admin info to request
    req.admin = {
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      avatarUrl: admin.avatarUrl
    };

    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token expired.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

// Optional Admin Authentication (doesn't fail if no token)
export const optionalAdminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      req.admin = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (decoded.role !== 'admin' || !decoded.isAdmin) {
      req.admin = null;
      return next();
    }

    // Get admin user
    const admin = await User.findByPk(decoded.userId, {
      attributes: ['id', 'fullName', 'email', 'role', 'status', 'avatarUrl']
    });

    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      req.admin = null;
      return next();
    }

    // Add admin info to request
    req.admin = {
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      avatarUrl: admin.avatarUrl
    };

    next();
  } catch (error) {
    console.error('Optional admin authentication error:', error);
    req.admin = null;
    next();
  }
};

// Super Admin Authentication (for critical operations)
export const authenticateSuperAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (decoded.role !== 'admin' || !decoded.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get admin user
    const admin = await User.findByPk(decoded.userId, {
      attributes: ['id', 'fullName', 'email', 'role', 'status', 'avatarUrl', 'createdAt']
    });

    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin user not found or inactive.'
      });
    }

    // Check if super admin (created within first 30 days or has specific email)
    const isSuperAdmin = admin.email === 'admin@alabastar.ng' || 
                        admin.email === 'superadmin@alabastar.ng' ||
                        (new Date() - admin.createdAt) < (30 * 24 * 60 * 60 * 1000); // 30 days

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    // Add admin info to request
    req.admin = {
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      avatarUrl: admin.avatarUrl,
      isSuperAdmin: true
    };

    next();
  } catch (error) {
    console.error('Super admin authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token expired.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

// Rate limiting for admin routes
export const adminRateLimit = (req, res, next) => {
  // Simple rate limiting - in production, use redis or similar
  const adminId = req.admin?.id;
  const now = Date.now();
  
  if (!global.adminRateLimit) {
    global.adminRateLimit = new Map();
  }

  if (adminId) {
    const userLimit = global.adminRateLimit.get(adminId);
    
    if (userLimit) {
      const timeDiff = now - userLimit.lastRequest;
      const requestsInMinute = userLimit.requests;
      
      if (timeDiff < 60000) { // 1 minute
        if (requestsInMinute >= 100) { // 100 requests per minute
          return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.'
          });
        }
        userLimit.requests++;
      } else {
        userLimit.requests = 1;
        userLimit.lastRequest = now;
      }
    } else {
      global.adminRateLimit.set(adminId, {
        requests: 1,
        lastRequest: now
      });
    }
  }

  next();
};

export default {
  authenticateAdmin,
  optionalAdminAuth,
  authenticateSuperAdmin,
  adminRateLimit
};





