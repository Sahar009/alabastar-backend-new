import jwt from 'jsonwebtoken';
import { User, Customer } from '../schema/index.js';
import { messageHandler } from '../utils/index.js';
import { UNAUTHORIZED } from '../constants/statusCode.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return messageHandler(res, UNAUTHORIZED, 'Access token is required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Customer,
        as: 'customer'
      }]
    });

    if (!user || user.status !== 'active') {
      return messageHandler(res, UNAUTHORIZED, 'Invalid or expired token');
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      provider: user.provider
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return messageHandler(res, UNAUTHORIZED, 'Invalid token');
  }
};

export const requireCustomer = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return messageHandler(res, UNAUTHORIZED, 'Customer access required');
  }
  next();
};

export const requireProvider = (req, res, next) => {
  if (req.user.role !== 'provider') {
    return messageHandler(res, UNAUTHORIZED, 'Provider access required');
  }
  next();
};







