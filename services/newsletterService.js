import { NewsletterSubscription } from '../schema/index.js';
import { sendEmail } from '../modules/notifications/email.js';
import crypto from 'crypto';

class NewsletterService {
  /**
   * Subscribe email to newsletter
   * @param {string} email - Email address
   * @param {string} ipAddress - IP address (optional)
   * @returns {Object} Result message
   */
  async subscribe(email, ipAddress = null) {
    try {
      const existingSubscription = await NewsletterSubscription.findOne({
        where: { email }
      });

      if (existingSubscription) {
        if (existingSubscription.status === 'subscribed') {
          throw new Error('This email is already subscribed to our newsletter');
        }
        
        const unsubscribeToken = crypto.randomBytes(16).toString('hex');
        await existingSubscription.update({
          status: 'subscribed',
          unsubscribeToken,
          ipAddress
        });

        await this.sendConfirmationEmail(email, unsubscribeToken);

        return {
          success: true,
          message: 'Successfully subscribed to our newsletter! Check your email for confirmation.'
        };
      }

      const unsubscribeToken = crypto.randomBytes(16).toString('hex');
      
      await NewsletterSubscription.create({
        email,
        unsubscribeToken,
        ipAddress
      });

      // Send confirmation email
      await this.sendConfirmationEmail(email, unsubscribeToken);

      return {
        success: true,
        message: 'Successfully subscribed to our newsletter! Check your email for confirmation.'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unsubscribe email from newsletter
   * @param {string} email - Email address
   * @param {string} token - Unsubscribe token (optional)
   * @returns {Object} Result message
   */
  async unsubscribe(email, token = null) {
    try {
      const whereClause = { email };
      
      if (token) {
        whereClause.unsubscribeToken = token;
      }

      const subscription = await NewsletterSubscription.findOne({
        where: whereClause
      });

      if (!subscription) {
        throw new Error('Email not found in our newsletter');
      }

      if (subscription.status === 'unsubscribed') {
        throw new Error('This email is already unsubscribed');
      }

      await subscription.update({
        status: 'unsubscribed'
      });

      return {
        success: true,
        message: 'Successfully unsubscribed from our newsletter. Sorry to see you go!'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if email is subscribed
   * @param {string} email - Email address
   * @returns {Object} Subscription status
   */
  async isSubscribed(email) {
    try {
      const subscription = await NewsletterSubscription.findOne({
        where: { email, status: 'subscribed' }
      });

      return {
        subscribed: !!subscription,
        subscribedAt: subscription?.createdAt || null
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all active subscribers (for admin)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Object} Subscribers list
   */
  async getSubscribers(page = 1, limit = 50) {
    try {
      const subscribers = await NewsletterSubscription.findAndCountAll({
        where: { status: 'subscribed' },
        attributes: ['email', 'createdAt'],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['createdAt', 'DESC']]
      });

      return {
        subscribers: subscribers.rows,
        totalCount: subscribers.count,
        totalPages: Math.ceil(subscribers.count / limit),
        currentPage: parseInt(page)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send subscription confirmation email
   */
  async sendConfirmationEmail(email, unsubscribeToken) {
    try {
      const subject = 'Welcome to AWARI Newsletter! 🎉';
      const context = {
        email,
        unsubscribeToken,
        unsubscribeUrl: `${process.env.API_URL || 'http://localhost:3000'}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`
      };

      await sendEmail(email, subject, '', 'newsletter-simple', context);
      console.log(`Newsletter confirmation email sent to ${email}`);
    } catch (error) {
      console.error('Error sending newsletter confirmation email:', error);
      // Don't throw error to avoid blocking subscription
    }
  }
}

export default new NewsletterService();