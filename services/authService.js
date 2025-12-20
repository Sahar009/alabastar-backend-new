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
          provider: user.provider,
          privacySettings: user.privacySettings
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
    const allowedUserFields = ['fullName', 'phone', 'privacySettings'];
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
        provider: user.provider,
        privacySettings: user.privacySettings
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

  async forgotPassword(email) {
    try {
      // Find user by email (both customer and provider)
      const user = await User.findOne({ where: { email } });

      if (!user) {
        // Don't reveal if user exists or not for security
        return { success: true, message: 'If an account exists with this email, a reset code has been sent.' };
      }

      // Generate 6-digit OTP code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Hash the reset code for storage
      const resetCodeHash = crypto.createHash('sha256').update(resetCode).digest('hex');
      
      // Set expiration to 15 minutes from now
      const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

      // Save reset code and expiry to user
      user.resetPasswordToken = resetCodeHash;
      user.resetPasswordExpires = resetCodeExpiry;
      await user.save();

      // Send email with reset code
      try {
        await sendEmail(
          email,
          'Password Reset Code - Alabastar',
          '',
          'password-reset-code',
          {
            fullName: user.fullName,
            resetCode: resetCode,
            expiryMinutes: 15
          }
        );
      } catch (emailError) {
        console.error('Failed to send reset code email:', emailError);
        throw new Error('Failed to send reset code. Please try again.');
      }

      return { 
        success: true, 
        message: 'A 6-digit reset code has been sent to your email.' 
      };
    } catch (error) {
      console.error('Error in forgotPassword:', error);
      throw error;
    }
  }

  async verifyResetCode(email, code) {
    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw new Error('Invalid reset code');
      }

      if (!user.resetPasswordToken || !user.resetPasswordExpires) {
        throw new Error('No reset code found. Please request a new one.');
      }

      // Check if code has expired
      if (new Date() > user.resetPasswordExpires) {
        throw new Error('Reset code has expired. Please request a new one.');
      }

      // Hash the provided code and compare
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      
      if (codeHash !== user.resetPasswordToken) {
        throw new Error('Invalid reset code');
      }

      // Generate a temporary token for password reset
      const resetToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          purpose: 'password-reset'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '15m' }
      );

      return { 
        success: true, 
        message: 'Code verified successfully',
        resetToken
      };
    } catch (error) {
      console.error('Error in verifyResetCode:', error);
      throw error;
    }
  }

  async resetPassword(resetToken, newPassword) {
    try {
      // Verify the reset token
      const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'your-secret-key');
      
      if (decoded.purpose !== 'password-reset') {
        throw new Error('Invalid reset token');
      }

      const user = await User.findByPk(decoded.userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Hash the new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password and clear reset token fields
      user.passwordHash = newPasswordHash;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      // Send confirmation email
      try {
        await sendEmail(
          user.email,
          'Password Changed Successfully - Alabastar',
          '',
          'password-changed',
          {
            fullName: user.fullName
          }
        );
      } catch (emailError) {
        console.error('Failed to send password change confirmation email:', emailError);
      }

      return { 
        success: true, 
        message: 'Password has been reset successfully' 
      };
    } catch (error) {
      console.error('Error in resetPassword:', error);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new Error('Invalid or expired reset token');
      }
      throw error;
    }
  }
}

export default new AuthService();
