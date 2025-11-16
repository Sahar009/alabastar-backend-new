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
        user.firebaseUid = googleId; // Store Google ID in firebaseUid field
        if (picture && !user.avatarUrl) {
          user.avatarUrl = picture;
        }
        await user.save();
      } else {
        // Update Google ID if missing
        if (googleId && !user.firebaseUid) {
          user.firebaseUid = googleId;
        }
        // Update avatar if missing
        if (picture && !user.avatarUrl) {
          user.avatarUrl = picture;
        }
        if ((googleId && !user.firebaseUid) || (picture && !user.avatarUrl)) {
          await user.save();
        }
      }
    } else {
      // Create new user
      const result = await this.registerUser({
        fullName: name,
        email,
        provider: 'google',
        avatarUrl: picture
      });
      user = result.user;
      
      // Update firebaseUid (Google ID) after user creation
      if (googleId) {
        user.firebaseUid = googleId;
        await user.save();
      }
    }

    // Refresh user data to get customer relation
    user = await User.findByPk(user.id, {
      include: [{
        model: Customer,
        as: 'customer'
      }]
    });

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

  async firebaseAuth(firebaseData) {
    try {
      const admin = initializeFirebase();
      if (!admin) {
        throw new Error('Firebase Admin SDK not configured');
      }
      
      const { idToken, email, displayName, photoURL, uid, phone } = firebaseData;

      // Verify the Firebase/Google ID token
      // Firebase Admin SDK can verify both Firebase ID tokens and Google ID tokens
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (error) {
        // If Firebase verification fails, try to verify as Google ID token
        // Google ID tokens can also be verified by Firebase if they're from the same project
        throw new Error('Invalid or expired ID token');
      }
      
      // Use decodedToken.uid if uid is not provided, or verify they match if both provided
      const verifiedUid = decodedToken.uid || uid;
      if (uid && decodedToken.uid && decodedToken.uid !== uid) {
        throw new Error('Token UID mismatch');
      }

      // Extract user info from decoded token (works for both Firebase and Google tokens)
      const tokenEmail = decodedToken.email || email;
      const tokenName = decodedToken.name || displayName || decodedToken.display_name || 'User';
      const tokenPicture = decodedToken.picture || photoURL;
      const tokenUid = verifiedUid;

      if (!tokenEmail) {
        throw new Error('Email is required for authentication');
      }

      // Check if user exists
      let user = await User.findOne({
        where: { email: tokenEmail, role: 'customer' },
        include: [{
          model: Customer,
          as: 'customer'
        }]
      });

      if (user) {
        // Update user data if needed
        if (user.provider !== 'firebase' && user.provider !== 'google') {
          user.provider = 'firebase';
        }
        if (tokenUid && !user.firebaseUid) {
          user.firebaseUid = tokenUid;
        }
        if (tokenPicture && !user.avatarUrl) {
          user.avatarUrl = tokenPicture;
        }
        if ((tokenUid && !user.firebaseUid) || (tokenPicture && !user.avatarUrl)) {
          await user.save();
        }
      } else {
        // Create new user
        const result = await this.registerUser({
          fullName: tokenName,
          email: tokenEmail,
          phone,
          provider: 'firebase',
          avatarUrl: tokenPicture
        });
        user = result.user;
        
        // Update firebaseUid after user creation
        if (tokenUid) {
          user.firebaseUid = tokenUid;
          await user.save();
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

      // Refresh user data to get customer relation
      user = await User.findByPk(user.id, {
        include: [{
          model: Customer,
          as: 'customer'
        }]
      });

      return {
        token,
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
    } catch (error) {
      console.error('Firebase auth error:', error);
      throw new Error(error.message || 'Firebase authentication failed');
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
