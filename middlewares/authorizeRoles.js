import { messageHandler } from '../utils/index.js';
import { FORBIDDEN } from '../constants/statusCode.js';

/**
 * Middleware to authorize users based on their roles
 * @param {string[]} allowedRoles - Array of roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return messageHandler(res, FORBIDDEN, 'Authentication required');
      }

      // Check if user has one of the allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return messageHandler(res, FORBIDDEN, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      return messageHandler(res, FORBIDDEN, 'Authorization error');
    }
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = authorizeRoles(['admin']);

/**
 * Middleware to check if user is provider
 */
export const requireProvider = authorizeRoles(['provider']);

/**
 * Middleware to check if user is customer
 */
export const requireCustomer = authorizeRoles(['customer']);

/**
 * Middleware to check if user is admin or provider
 */
export const requireAdminOrProvider = authorizeRoles(['admin', 'provider']);

/**
 * Middleware to check if user is admin or customer
 */
export const requireAdminOrCustomer = authorizeRoles(['admin', 'customer']);
