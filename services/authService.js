import { User, Customer } from '../schema/index.js';
import { hashPassword, verifyPassword } from '../utils/index.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../modules/notifications/email.js';
import NotificationHelper from '../utils/notificationHelper.js';
import crypto from 'crypto';
import initializeFirebase from '../config/firebase.js';

class AuthService {
  async registerUser(userData) {
    const {
      fullName,
      email,
      phone,
      password,
      provider = 'email' // 'email' or 'google'
    } = userData;

    // Check if user already exists by email
    const existingUserByEmail = await User.findOne({
      where: { email }
    });

    if (existingUserByEmail) {
      throw new Error('User already exists with this email');
    }

    // Check if user already exists by phone (if phone is provided and not empty)
    if (phone && phone.trim()) {
      const existingUserByPhone = await User.findOne({
        where: { phone: phone.trim() }
      });

      if (existingUserByPhone) {
        throw new Error('Phone number is already registered with another account');
      }
    }

    let passwordHash = null;
    if (provider === 'email' && password) {
      passwordHash = await hashPassword(password);
    }

    const user = await User.create({
      fullName,
      email,
      phone: phone && phone.trim() ? phone.trim() : null,
      passwordHash,
      role: 'customer',
      status: 'active',
      provider
    });

    // Create customer profile
    const customer = await Customer.create({
      userId: user.id,
      preferences: {},
      notificationSettings: {
        email: true,
        sms: true,
        push: true
      }
    });

    // Send welcome email
    if (provider === 'email') {
      try {
        await sendEmail(
          email,
          'Welcome to Alabastar!',
          '',
          'customer-welcome',
          {
            fullName,
            email
          }
        );
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }
    }

    // Send welcome notification
    (async () => {
      try {
        await NotificationHelper.notifyWelcome(user.id, user.fullName, 'customer');
      } catch (error) {
        console.error('Error sending welcome notification:', error);
      }
    })();

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        provider: user.provider
      },
      customer: {
        id: customer.id,
        preferences: customer.preferences,
        notificationSettings: customer.notificationSettings
      }
    };
  }

  async loginUser(email, password, role = 'customer') {
    const user = await User.findOne({
      where: { email, role },
      include: [{
        model: Customer,
        as: 'customer'
      }]
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    if (user.provider === 'email') {
      if (!password) {
        throw new Error('Password is required');
      }

      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        provider: user.provider
      },
      customer: user.customer ? {
        id: user.customer.id,
        preferences: user.customer.preferences,
        notificationSettings: user.customer.notificationSettings
      } : null
    };
  }

  async loginProvider(email, password) {
    const user = await User.findOne({
      where: { email, role: 'provider' }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    if (user.provider === 'email') {
      if (!password) {
        throw new Error('Password is required');
      }

      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        provider: user.provider
      }
    };
  }

  async googleAuth(googleUserData) {
    const { email, name, picture, googleId } = googleUserData;

    // Check if user exists
    let user = await User.findOne({
      where: { email, role: 'customer' },
      include: [{
        model: Customer,
        as: 'customer'
      }]
    });

    if (user) {
      // Update user data if needed
      if (user.provider !== 'google') {
        user.provider = 'google';
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      const result = await this.registerUser({
        fullName: name,
        email,
        provider: 'google'
      });
      user = result.user;
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        provider: user.provider
      },
      customer: user.customer ? {
        id: user.customer.id,
        preferences: user.customer.preferences,
        notificationSettings: user.customer.notificationSettings
      } : null
    };
  }

  async firebaseAuth(firebaseData) {
    try {
      const admin = initializeFirebase();
      if (!admin) {
        throw new Error('Firebase Admin SDK not configured');
      }
      
      const { idToken, email, displayName, photoURL, uid, phone } = firebaseData;

      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      if (decodedToken.uid !== uid) {
        throw new Error('Token UID mismatch');
      }

      // Check if user exists
      let user = await User.findOne({
        where: { email, role: 'customer' },
        include: [{
          model: Customer,
          as: 'customer'
        }]
      });

      if (user) {
        // Update user data if needed
        if (user.provider !== 'firebase') {
          user.provider = 'firebase';
          user.firebaseUid = uid;
          await user.save();
        }
      } else {
        // Create new user
        const result = await this.registerUser({
          fullName: displayName || 'User',
          email,
          phone,
          provider: 'firebase',
          firebaseUid: uid
        });
        user = result.user;
      }

      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          provider: user.provider
        },
        customer: user.customer ? {
          id: user.customer.id,
          preferences: user.customer.preferences,
          notificationSettings: user.customer.notificationSettings
        } : null
      };
    } catch (error) {
      console.error('Firebase auth error:', error);
      throw new Error('Firebase authentication failed');
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findByPk(decoded.userId, {
        include: [{
          model: Customer,
          as: 'customer'
        }]
      });

      if (!user || user.status !== 'active') {
        throw new Error('Invalid token');
      }

      return {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          provider: user.provider
        },
        customer: user.customer ? {
          id: user.customer.id,
          preferences: user.customer.preferences,
          notificationSettings: user.customer.notificationSettings
        } : null
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async updateProfile(userId, updateData) {
    const user = await User.findByPk(userId, {
      include: [{
        model: Customer,
        as: 'customer'
      }]
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update user data
    const allowedUserFields = ['fullName', 'phone'];
    for (const field of allowedUserFields) {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    }

    await user.save();

    // Update customer data
    if (user.customer && updateData.preferences) {
      user.customer.preferences = { ...user.customer.preferences, ...updateData.preferences };
      await user.customer.save();
    }

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        provider: user.provider
      },
      customer: user.customer ? {
        id: user.customer.id,
        preferences: user.customer.preferences,
        notificationSettings: user.customer.notificationSettings
      } : null
    };
  }

  async updateProfilePicture(userId, uploadData) {
    const user = await User.findByPk(userId, {
      include: [{
        model: Customer,
        as: 'customer'
      }]
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!uploadData?.secure_url) {
      throw new Error('Invalid upload data');
    }

    user.avatarUrl = uploadData.secure_url;
    await user.save();

    return {
      avatarUrl: user.avatarUrl,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        provider: user.provider,
        avatarUrl: user.avatarUrl
      },
      customer: user.customer ? {
        id: user.customer.id,
        preferences: user.customer.preferences,
        notificationSettings: user.customer.notificationSettings
      } : null
    };
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      user.passwordHash = newPasswordHash;
      await user.save();

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, message: error.message || 'Failed to change password' };
    }
  }

  async deleteAccount(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{
          model: Customer,
          as: 'customer'
        }]
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Delete customer profile if exists
      if (user.customer) {
        await user.customer.destroy();
      }

      // Delete user account
      await user.destroy();

      return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
      console.error('Error deleting account:', error);
      return { success: false, message: error.message || 'Failed to delete account' };
    }
  }
}

export default new AuthService();
