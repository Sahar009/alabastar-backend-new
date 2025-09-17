import authService from '../services/authService.js';
import { messageHandler } from '../utils/index.js';
import { BAD_REQUEST, SUCCESS, CREATED, UNAUTHORIZED, INTERNAL_SERVER_ERROR } from '../constants/statusCode.js';

class AuthController {
  async register(req, res) {
    try {
      console.log('Register request received:', req.body);
      const { fullName, email, phone, password } = req.body;

      // Validation
      if (!fullName || !email) {
        console.log('Validation failed: missing fullName or email');
        return messageHandler(res, BAD_REQUEST, 'Full name and email are required');
      }

      if (!password) {
        return messageHandler(res, BAD_REQUEST, 'Password is required');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return messageHandler(res, BAD_REQUEST, 'Invalid email format');
      }

      // Password validation
      if (password.length < 8) {
        return messageHandler(res, BAD_REQUEST, 'Password must be at least 8 characters long');
      }

      // Phone validation (optional)
      if (phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
          return messageHandler(res, BAD_REQUEST, 'Invalid phone number format');
        }
      }

      const result = await authService.registerUser({
        fullName,
        email,
        phone,
        password,
        provider: 'email'
      });

      console.log('Registration successful, sending response:', result);
      return messageHandler(res, CREATED, 'User registered successfully', result);
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.message === 'User already exists with this email') {
        return messageHandler(res, BAD_REQUEST, error.message);
      }
      
      if (error.message === 'Phone number is already registered with another account') {
        return messageHandler(res, BAD_REQUEST, error.message);
      }
      
      // Handle duplicate phone number error
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.fields && error.fields.phone) {
          return messageHandler(res, BAD_REQUEST, 'Phone number is already registered with another account');
        }
        if (error.fields && error.fields.email) {
          return messageHandler(res, BAD_REQUEST, 'Email address is already registered');
        }
        return messageHandler(res, BAD_REQUEST, 'Account with this information already exists');
      }
      
      // Handle validation errors
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => err.message).join(', ');
        return messageHandler(res, BAD_REQUEST, `Validation failed: ${validationErrors}`);
      }
      
      return messageHandler(res, INTERNAL_SERVER_ERROR, 'Registration failed');
    }
  }

  async login(req, res) {
    try {
      console.log('Login request received:', { email: req.body.email, password: req.body.password ? '[HIDDEN]' : 'missing' });
      const { email, password } = req.body;

      if (!email || !password) {
        console.log('Validation failed: missing email or password');
        return messageHandler(res, BAD_REQUEST, 'Email and password are required');
      }

      const result = await authService.loginUser(email, password);

      console.log('Login successful, sending response');
      return messageHandler(res, SUCCESS, 'Login successful', result);
    } catch (error) {
      console.error('Login error:', error);
      if (error.message === 'Invalid credentials' || error.message === 'Account is not active') {
        return messageHandler(res, UNAUTHORIZED, error.message);
      }
      
      // Handle validation errors
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => err.message).join(', ');
        return messageHandler(res, BAD_REQUEST, `Validation failed: ${validationErrors}`);
      }
      
      return messageHandler(res, INTERNAL_SERVER_ERROR, 'Login failed');
    }
  }

  async firebaseAuth(req, res) {
    try {
      const { idToken, email, displayName, photoURL, uid, phone } = req.body;

      if (!idToken || !email || !uid) {
        return messageHandler(res, BAD_REQUEST, 'Firebase authentication data is incomplete');
      }

      const result = await authService.firebaseAuth({
        idToken,
        email,
        displayName,
        photoURL,
        uid,
        phone
      });

      return messageHandler(res, SUCCESS, 'Firebase authentication successful', result);
    } catch (error) {
      console.error('Firebase auth error:', error);
      return messageHandler(res, INTERNAL_SERVER_ERROR, 'Firebase authentication failed');
    }
  }

  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return messageHandler(res, UNAUTHORIZED, 'Token is required');
      }

      const result = await authService.verifyToken(token);

      return messageHandler(res, SUCCESS, 'Token is valid', result);
    } catch (error) {
      console.error('Token verification error:', error);
      return messageHandler(res, UNAUTHORIZED, 'Invalid token');
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const updateData = req.body;

      const result = await authService.updateProfile(userId, updateData);

      return messageHandler(res, SUCCESS, 'Profile updated successfully', result);
    } catch (error) {
      console.error('Profile update error:', error);
      if (error.message === 'User not found') {
        return messageHandler(res, BAD_REQUEST, error.message);
      }
      return messageHandler(res, INTERNAL_SERVER_ERROR, 'Profile update failed');
    }
  }
}

export default new AuthController();
