import ReferralService from '../services/referralService.js';
import { SUCCESS, CREATED, BAD_REQUEST, NOT_FOUND, FORBIDDEN, INTERNAL_SERVER_ERROR } from '../constants/statusCode.js';

class ReferralController {
  /**
   * Generate referral code for a provider
   */
  static async generateReferralCode(req, res) {
    try {
      const { providerId } = req.params;
      const userId = req.user.id;

      // Verify the provider belongs to the authenticated user
      const { ProviderProfile } = await import('../schema/index.js');
      const provider = await ProviderProfile.findOne({
        where: { id: providerId, userId: userId }
      });

      if (!provider) {
        return res.status(NOT_FOUND).json({
          success: false,
          message: 'Provider not found or access denied'
        });
      }

      const result = await ReferralService.createReferralCode(providerId);

      if (!result.success) {
        return res.status(BAD_REQUEST).json(result);
      }

      return res.status(CREATED).json(result);
    } catch (error) {
      console.error('Error generating referral code:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Process referral when new provider signs up
   */
  static async processReferral(req, res) {
    try {
      const { referralCode } = req.body;
      const userId = req.user.id;

      if (!referralCode) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: 'Referral code is required'
        });
      }

      // Get the provider profile for the authenticated user
      const { ProviderProfile } = await import('../schema/index.js');
      const provider = await ProviderProfile.findOne({
        where: { userId: userId }
      });

      if (!provider) {
        return res.status(NOT_FOUND).json({
          success: false,
          message: 'Provider profile not found'
        });
      }

      const result = await ReferralService.processReferral(provider.id, referralCode);

      if (!result.success) {
        return res.status(BAD_REQUEST).json(result);
      }

      return res.status(CREATED).json(result);
    } catch (error) {
      console.error('Error processing referral:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get referral statistics for a provider
   */
  static async getReferralStats(req, res) {
    try {
      const { providerId } = req.params;
      const userId = req.user.id;

      // Verify the provider belongs to the authenticated user
      const { ProviderProfile } = await import('../schema/index.js');
      const provider = await ProviderProfile.findOne({
        where: { id: providerId, userId: userId }
      });

      if (!provider) {
        return res.status(NOT_FOUND).json({
          success: false,
          message: 'Provider not found or access denied'
        });
      }

      const result = await ReferralService.getReferralStats(providerId);

      if (!result.success) {
        return res.status(BAD_REQUEST).json(result);
      }

      return res.status(SUCCESS).json(result);
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get referral code details (public endpoint)
   */
  static async getReferralCodeDetails(req, res) {
    try {
      const { referralCode } = req.params;

      if (!referralCode) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: 'Referral code is required'
        });
      }

      const result = await ReferralService.getReferralCodeDetails(referralCode);

      if (!result.success) {
        return res.status(NOT_FOUND).json(result);
      }

      return res.status(SUCCESS).json(result);
    } catch (error) {
      console.error('Error getting referral code details:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get referrals made by a provider
   */
  static async getReferralsMade(req, res) {
    try {
      const { providerId } = req.params;
      const userId = req.user.id;

      // Verify the provider belongs to the authenticated user
      const { ProviderProfile, ProviderReferral } = await import('../schema/index.js');
      const provider = await ProviderProfile.findOne({
        where: { id: providerId, userId: userId }
      });

      if (!provider) {
        return res.status(NOT_FOUND).json({
          success: false,
          message: 'Provider not found or access denied'
        });
      }

      const referrals = await ProviderReferral.findAll({
        where: { referrerId: providerId },
        include: [
          {
            model: ProviderProfile,
            as: 'Referee',
            attributes: ['id', 'businessName', 'category', 'verificationStatus']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.status(SUCCESS).json({
        success: true,
        data: referrals
      });
    } catch (error) {
      console.error('Error getting referrals made:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get commissions earned by a provider
   */
  static async getCommissions(req, res) {
    try {
      const { providerId } = req.params;
      const userId = req.user.id;

      // Verify the provider belongs to the authenticated user
      const { ProviderProfile, ReferralCommission } = await import('../schema/index.js');
      const provider = await ProviderProfile.findOne({
        where: { id: providerId, userId: userId }
      });

      if (!provider) {
        return res.status(NOT_FOUND).json({
          success: false,
          message: 'Provider not found or access denied'
        });
      }

      const commissions = await ReferralCommission.findAll({
        where: { referrerId: providerId },
        include: [
          {
            model: ProviderReferral,
            include: [
              {
                model: ProviderProfile,
                as: 'Referee',
                attributes: ['id', 'businessName', 'category']
              }
            ]
          },
          {
            model: ProviderSubscription,
            include: [
              {
                model: SubscriptionPlan,
                attributes: ['name', 'price']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.status(SUCCESS).json({
        success: true,
        data: commissions
      });
    } catch (error) {
      console.error('Error getting commissions:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get top referrers (public endpoint)
   */
  static async getTopReferrers(req, res) {
    try {
      const { limit = 10 } = req.query;
      const result = await ReferralService.getTopReferrers(parseInt(limit));

      if (!result.success) {
        return res.status(BAD_REQUEST).json(result);
      }

      return res.status(SUCCESS).json(result);
    } catch (error) {
      console.error('Error getting top referrers:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Pay commission (admin only)
   */
  static async payCommission(req, res) {
    try {
      const { commissionId } = req.params;
      const { paymentMethod, paymentReference } = req.body;

      // This should be restricted to admin users
      if (req.user.role !== 'admin') {
        return res.status(FORBIDDEN).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }

      const result = await ReferralService.payCommission(commissionId, paymentMethod, paymentReference);

      if (!result.success) {
        return res.status(BAD_REQUEST).json(result);
      }

      return res.status(SUCCESS).json(result);
    } catch (error) {
      console.error('Error paying commission:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Process commission when subscription is created (internal)
   */
  static async processCommission(req, res) {
    try {
      const { subscriptionId } = req.body;

      if (!subscriptionId) {
        return res.status(BAD_REQUEST).json({
          success: false,
          message: 'Subscription ID is required'
        });
      }

      const result = await ReferralService.processCommission(subscriptionId);

      if (!result.success) {
        return res.status(BAD_REQUEST).json(result);
      }

      return res.status(SUCCESS).json(result);
    } catch (error) {
      console.error('Error processing commission:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async validateReferralCode(req, res) {
    try {
      const { referralCode } = req.params;
      
      if (!referralCode || !referralCode.trim()) {
        return res.status(BAD_REQUEST).json({ 
          success: false, 
          message: 'Referral code is required',
          valid: false 
        });
      }

      // Validate format
      const referralCodeRegex = /^[A-Z0-9]{6,20}$/;
      if (!referralCodeRegex.test(referralCode.trim())) {
        return res.status(BAD_REQUEST).json({ 
          success: false, 
          message: 'Invalid referral code format. Referral codes should be 6-20 characters long and contain only uppercase letters and numbers.',
          valid: false 
        });
      }

      // Check if referral code exists
      const codeDetails = await ReferralService.getReferralCodeDetails(referralCode.trim());
      
      if (codeDetails.success) {
        return res.status(SUCCESS).json({
          success: true,
          message: 'Referral code is valid',
          valid: true,
          data: {
            businessName: codeDetails.data.businessName,
            category: codeDetails.data.category,
            totalReferrals: codeDetails.data.totalReferrals
          }
        });
      } else {
        return res.status(NOT_FOUND).json({
          success: false,
          message: 'Referral code not found or invalid',
          valid: false
        });
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      return res.status(INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: 'Error validating referral code',
        valid: false 
      });
    }
  }
}

export default ReferralController;
