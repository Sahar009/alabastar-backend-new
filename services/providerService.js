import { User, ProviderProfile, ProviderDocument, ProviderRegistrationProgress } from '../schema/index.js';
import { Service } from '../schema/index.js';
import { sendEmail } from '../modules/notifications/email.js';
import NotificationHelper from '../utils/notificationHelper.js';
import { generateToken } from '../utils/index.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Op } from 'sequelize';
import sequelize from '../database/db.js';
import paystackService from '../providers/paystack/index.js';

class ProviderService {
  // Get provider registration fee (this should be configurable by admin)
  getRegistrationFee() {
    // For now, return a fixed amount. This should be fetched from admin settings
    return process.env.PROVIDER_REGISTRATION_FEE || 5000; // Default 5000 NGN
  }

  // Initialize payment for provider registration
  async initializeProviderPayment(providerData) {
    return new Promise(async (resolve, reject) => {
      try {
        const { SubscriptionPlan } = await import('../schema/index.js');
        
        // Get the selected subscription plan
        let selectedPlan = null;
        if (providerData.subscriptionPlanId) {
          selectedPlan = await SubscriptionPlan.findByPk(providerData.subscriptionPlanId);
          if (!selectedPlan) {
            throw new Error('Selected subscription plan not found');
          }
        } else {
          // Default to the cheapest active plan
          selectedPlan = await SubscriptionPlan.findOne({
            where: { isActive: true },
            order: [['price', 'ASC']]
          });
          
          if (!selectedPlan) {
            throw new Error('No active subscription plans available');
          }
        }

        const reference = `provider_reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Determine callback URL based on platform
        let callbackUrl;
        if (providerData.platform === 'mobile') {
          // Mobile deep link for mobile apps
          callbackUrl = `alabastar://payment-success?reference=${reference}&type=registration`;
          console.log('Using mobile deep link callback for registration:', callbackUrl);
        } else {
          // Web URL for web frontend (default for backward compatibility)
          callbackUrl = `${process.env.FRONTEND_URL || 'https://alabastar.ng'}/provider/registration/success?reference=${reference}`;
          console.log('Using web callback URL for registration:', callbackUrl);
        }
        
        const paymentData = {
          email: providerData.email,
          amount: selectedPlan.price * 100, // Paystack expects amount in kobo (multiply by 100)
          reference,
          callback_url: callbackUrl,
          provider_id: null, // Will be set after successful payment
          business_name: providerData.businessName,
          full_name: providerData.fullName,
          phone: providerData.phone,
          category: providerData.category,
          registration_data: {
            ...providerData,
            subscriptionPlanId: selectedPlan.id,
            subscriptionPlanName: selectedPlan.name,
            subscriptionPlanPrice: selectedPlan.price
          } // Store all registration data including subscription plan
        };

        console.log('Initializing payment with data:', paymentData);
        
        paystackService.initializeTransaction(paymentData, (response) => {
          console.log('Paystack response:', response);
          if (response.success) {
            resolve({
              ...response.data,
              subscriptionPlan: {
                id: selectedPlan.id,
                name: selectedPlan.name,
                price: selectedPlan.price,
                interval: selectedPlan.interval,
                benefits: selectedPlan.benefits
              },
              reference,
              registrationData: providerData // Include registration data for frontend
            });
          } else {
            reject(new Error(response.message || 'Failed to initialize payment'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Normalize Nigerian phone numbers to international format
  normalizePhoneNumber(phone) {
    if (!phone) return phone;
    
    const cleanPhone = phone.replace(/\s/g, '');
    
    // If it starts with 0, replace with +234
    if (cleanPhone.startsWith('0')) {
      return '+234' + cleanPhone.substring(1);
    }
    
    // If it starts with 234, add +
    if (cleanPhone.startsWith('234')) {
      return '+' + cleanPhone;
    }
    
    // If it already has +, return as is
    if (cleanPhone.startsWith('+')) {
      return cleanPhone;
    }
    
    // Default: assume it's a local number and add +234
    return '+234' + cleanPhone;
  }

  // Save registration step progress
  async saveRegistrationStep(userId, stepNumber, stepData) {
    try {
      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get or create registration progress record
      let progress = await ProviderRegistrationProgress.findOne({
        where: { userId }
      });

      if (!progress) {
        progress = await ProviderRegistrationProgress.create({
          userId,
          currentStep: stepNumber,
          stepData: {}
        });
      }

      // Update step data
      const updatedStepData = {
        ...progress.stepData,
        [`step${stepNumber}`]: stepData
      };

      // Update current step if this is a higher step
      const newCurrentStep = Math.max(progress.currentStep, stepNumber);

      await progress.update({
        currentStep: newCurrentStep,
        stepData: updatedStepData,
        lastUpdated: new Date()
      });

      return {
        success: true,
        data: {
          currentStep: newCurrentStep,
          stepData: updatedStepData,
          completedSteps: Object.keys(updatedStepData).length
        }
      };
    } catch (error) {
      console.error('Error saving registration step:', error);
      throw error;
    }
  }

  // Create provider profile from payment data (for payment completion)
  async createProviderProfileFromPaymentData(userId, registrationData, paymentReference) {
    try {
      console.log('Creating provider profile from payment data for user:', userId);
      
      // Check if provider profile already exists
      const existingProfile = await ProviderProfile.findOne({ where: { userId } });
      if (existingProfile) {
        return {
          success: true,
          providerProfile: existingProfile,
          message: 'Provider profile already exists'
        };
      }

      // Generate unique referral code
      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      // Create provider profile
      const providerProfile = await ProviderProfile.create({
        userId,
        businessName: registrationData.businessName,
        category: registrationData.category,
        subcategories: registrationData.subcategories,
        bio: registrationData.bio || '',
        locationCity: registrationData.locationCity,
        locationState: registrationData.locationState,
        latitude: registrationData.latitude,
        longitude: registrationData.longitude,
        verificationStatus: 'pending',
        paymentStatus: 'paid',
        referralCode: referralCode,
        portfolio: {
          documents: registrationData.documents || [],
          brandImages: registrationData.brandImages || []
        }
      });

      console.log('Provider profile created:', {
        id: providerProfile.id,
        businessName: providerProfile.businessName,
        referralCode: providerProfile.referralCode
      });

      // Create subscription
      const { SubscriptionPlan, ProviderSubscription } = await import('../schema/index.js');
      const subscriptionPlan = await SubscriptionPlan.findByPk(registrationData.subscriptionPlanId);
      
      if (subscriptionPlan) {
        const subscription = await ProviderSubscription.create({
          providerId: providerProfile.id,
          planId: subscriptionPlan.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          autoRenew: true,
          metadata: {
            registrationPaymentReference: paymentReference,
            planName: subscriptionPlan.name,
            planPrice: subscriptionPlan.price
          }
        });
        
        console.log('Subscription created:', {
          id: subscription.id,
          planName: subscriptionPlan.name,
          status: subscription.status
        });
      }

      return {
        success: true,
        providerProfile,
        subscription: subscriptionPlan ? await ProviderSubscription.findOne({ 
          where: { providerId: providerProfile.id },
          order: [['createdAt', 'DESC']]
        }) : null
      };
    } catch (error) {
      console.error('Error creating provider profile from payment data:', error);
      throw error;
    }
  }

  // Get registration progress
  async getRegistrationProgress(userId) {
    try {
      const progress = await ProviderRegistrationProgress.findOne({
        where: { userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'phone', 'role']
          }
        ]
      });

      if (!progress) {
        return {
          success: true,
          data: {
            currentStep: 1,
            stepData: {},
            completedSteps: 0,
            isComplete: false
          }
        };
      }

      // Check if user has a provider profile and if payment is completed
      const providerProfile = await ProviderProfile.findOne({ where: { userId } });
      if (providerProfile && providerProfile.paymentStatus === 'paid' && !progress.isComplete) {
        // User has paid but registration progress is not marked as complete
        // This is a fix for users who paid but their progress wasn't updated
        console.log(`Fixing registration progress for user ${userId} - payment completed but progress not updated`);
        
        await ProviderRegistrationProgress.update(
          { 
            currentStep: 5,
            isComplete: true,
            stepData: {
              ...progress.stepData,
              step4: {
                ...progress.stepData.step4,
                paymentCompleted: true,
                paymentReference: 'auto-fixed'
              },
              step5: {
                paymentCompleted: true,
                paymentReference: 'auto-fixed',
                completedAt: new Date()
              }
            },
            lastUpdated: new Date()
          },
          { where: { userId } }
        );
        
        // Reload the progress after update
        const updatedProgress = await ProviderRegistrationProgress.findOne({
          where: { userId },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'email', 'phone', 'role']
            }
          ]
        });
        
        return {
          success: true,
          data: {
            currentStep: updatedProgress.currentStep,
            stepData: updatedProgress.stepData,
            completedSteps: Object.keys(updatedProgress.stepData).length,
            isComplete: true,
            lastUpdated: updatedProgress.lastUpdated
          }
        };
      }

      // Check if registration is complete
      // Registration is complete if currentStep is 5 and payment is completed
      const isComplete = progress.currentStep >= 5 && 
                        progress.stepData.step4?.paymentCompleted === true &&
                        progress.stepData.step5?.paymentCompleted === true;

      return {
        success: true,
        data: {
          currentStep: progress.currentStep,
          stepData: progress.stepData,
          completedSteps: Object.keys(progress.stepData).length,
          isComplete,
          lastUpdated: progress.lastUpdated
        }
      };
    } catch (error) {
      console.error('Error getting registration progress:', error);
      throw error;
    }
  }

  // Update registration progress
  async updateRegistrationProgress(userId, updateData) {
    try {
      const progress = await ProviderRegistrationProgress.findOne({
        where: { userId }
      });

      if (!progress) {
        throw new Error('Registration progress not found');
      }

      // Merge step data
      const updatedStepData = {
        ...progress.stepData,
        ...updateData.stepData
      };

      // Update current step if provided
      const newCurrentStep = updateData.currentStep || progress.currentStep;

      await progress.update({
        currentStep: newCurrentStep,
        stepData: updatedStepData,
        lastUpdated: new Date()
      });

      return {
        success: true,
        data: {
          currentStep: progress.currentStep,
          stepData: progress.stepData,
          completedSteps: Object.keys(progress.stepData).length,
          isComplete: progress.currentStep >= 5
        }
      };
    } catch (error) {
      console.error('Error updating registration progress:', error);
      throw error;
    }
  }

  // Complete registration from saved progress
  async completeRegistrationFromProgress(userId) {
    try {
      const progress = await ProviderRegistrationProgress.findOne({
        where: { userId }
      });

      if (!progress) {
        throw new Error('Registration progress not found');
      }

      // Check if all steps are completed
      if (progress.currentStep < 5 || !progress.stepData.step1 || !progress.stepData.step2 || 
          !progress.stepData.step3 || !progress.stepData.step4 || !progress.stepData.step5) {
        throw new Error('All registration steps must be completed');
      }

      // Merge all step data
      const allStepData = {
        ...progress.stepData.step1,
        ...progress.stepData.step2,
        ...progress.stepData.step3,
        ...progress.stepData.step4,
        ...progress.stepData.step5
      };

      // Complete the registration
      const registrationResult = await this.registerProvider(allStepData);

      // Delete the progress record after successful registration
      await progress.destroy();

      return registrationResult;
    } catch (error) {
      console.error('Error completing registration from progress:', error);
      throw error;
    }
  }

  async registerProvider(providerData) {
    const {
      // User data
      fullName,
      email,
      phone,
      alternativePhone,
      password,
      
      // Provider profile data
      businessName,
      category,
      subcategories,
      bio,
      locationCity,
      locationState,
      latitude,
      longitude,
      portfolio,
      referralCode, // Add referral code
      
      // Document data
      documents,
      brandImages
    } = providerData;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if phone is already taken
    if (phone) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        throw new Error('User with this phone number already exists');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      fullName,
      email,
      phone: this.normalizePhoneNumber(phone),
      alternativePhone: this.normalizePhoneNumber(alternativePhone),
      passwordHash,
      role: 'provider',
      status: 'active'
    });

    // Create provider profile
    const providerProfile = await ProviderProfile.create({
      userId: user.id,
      businessName,
      category,
      subcategories: subcategories || [],
      bio,
      locationCity,
      locationState,
      latitude,
      longitude,
      portfolio: portfolio || [],
      verificationStatus: 'pending',
      paymentStatus: 'pending' // Add payment status
    });

    // Process referral code if provided
    if (referralCode && referralCode.trim()) {
      try {
        // Import ReferralService dynamically to avoid circular dependency
        const { default: ReferralService } = await import('./referralService.js');
        
        // Process the referral
        const referralResult = await ReferralService.processReferral(providerProfile.id, referralCode.trim());
        
        if (referralResult.success) {
          console.log(`Provider ${providerProfile.id} successfully referred by code: ${referralCode}`);
        } else {
          console.log(`Referral code ${referralCode} processing failed: ${referralResult.message}`);
        }
      } catch (referralError) {
        console.error('Error processing referral code:', referralError);
        // Don't fail the registration if referral processing fails
      }
    }

    // Create provider documents
    const createdDocuments = [];
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        const document = await ProviderDocument.create({
          providerId: providerProfile.id,
          type: doc.type,
          url: doc.url,
          status: 'pending',
          notes: doc.notes
        });
        createdDocuments.push(document);
      }
    }

    // Create brand images
    const createdBrandImages = [];
    if (brandImages && brandImages.length > 0) {
      for (const image of brandImages) {
        const brandImage = await ProviderDocument.create({
          providerId: providerProfile.id,
          type: 'brand_image',
          url: image.url,
          status: 'approved', // Brand images are auto-approved
          notes: image.notes || 'Brand image'
        });
        createdBrandImages.push(brandImage);
      }
    }

    // Send welcome email
    try {
      await this.sendWelcomeEmail(user.email, user.fullName);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }

    // Send welcome notification
    (async () => {
      try {
        await NotificationHelper.notifyWelcome(user.id, user.fullName, 'provider');
      } catch (error) {
        console.error('Error sending welcome notification:', error);
      }
    })();

    // Create subscription for the provider using selected plan
    let subscription = null;
    try {
      const { default: SubscriptionService } = await import('./subscriptionService.js');
      const { SubscriptionPlan } = await import('../schema/index.js');
      
      // Use the selected subscription plan from registration data
      let selectedPlan = null;
      if (providerData.subscriptionPlanId) {
        selectedPlan = await SubscriptionPlan.findByPk(providerData.subscriptionPlanId);
      }
      
      // Fallback to cheapest active plan if no plan selected
      if (!selectedPlan) {
        selectedPlan = await SubscriptionPlan.findOne({ 
          where: { isActive: true },
          order: [['price', 'ASC']] // Get the cheapest plan first
        });
      }
      
      // If no plan exists, create a default one
      if (!selectedPlan) {
        selectedPlan = await SubscriptionPlan.create({
          name: 'Basic Plan',
          slug: 'basic-plan',
          price: 5000.00, // Same as registration fee
          interval: 'monthly',
          benefits: ['Basic listing', 'Customer support'],
          isActive: true
        });
      }
      
      // Create subscription for the provider
      const subscriptionResult = await SubscriptionService.createSubscription(
        providerProfile.id,
        selectedPlan.id,
        { 
          registrationType: 'provider_registration',
          registrationFee: this.getRegistrationFee(),
          selectedPlanName: selectedPlan.name,
          selectedPlanPrice: selectedPlan.price
        }
      );
      
      if (subscriptionResult.success) {
        subscription = subscriptionResult.data;
        console.log(`Subscription created for provider ${providerProfile.id}: ${subscription.id} (Plan: ${selectedPlan.name})`);
      } else {
        console.error('Failed to create subscription:', subscriptionResult.message);
      }
    } catch (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      // Don't fail the registration if subscription creation fails
    }

    // Generate JWT token for the new user
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    const token = generateToken(tokenPayload, '7d');

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        alternativePhone: user.alternativePhone,
        role: user.role,
        status: user.status
      },
      providerProfile: {
        id: providerProfile.id,
        businessName: providerProfile.businessName,
        category: providerProfile.category,
        subcategories: providerProfile.subcategories,
        bio: providerProfile.bio,
        locationCity: providerProfile.locationCity,
        locationState: providerProfile.locationState,
        verificationStatus: providerProfile.verificationStatus,
        paymentStatus: providerProfile.paymentStatus
      },
      documents: createdDocuments,
      brandImages: createdBrandImages,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd
      } : null,
      token: token
    };
  }

  // Initialize payment for existing provider
  async initializeProviderRegistrationPayment(providerId) {
    const provider = await ProviderProfile.findByPk(providerId, {
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email', 'phone']
        }
      ]
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    if (provider.paymentStatus === 'paid') {
      throw new Error('Payment already completed');
    }

    const providerData = {
      provider_id: provider.id,
      email: provider.User.email,
      businessName: provider.businessName,
      fullName: provider.User.fullName,
      phone: provider.User.phone,
      category: provider.category
    };

    return await this.initializeProviderPayment(providerData);
  }

  async getProviderProfile(providerId) {
    const provider = await ProviderProfile.findByPk(providerId, {
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl', 'isEmailVerified', 'isPhoneVerified']
        },
        {
          model: ProviderDocument,
          attributes: ['id', 'type', 'url', 'status', 'notes', 'createdAt']
        }
      ]
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    return provider;
  }

  async getProviderProfileByUserId(userId) {
    const provider = await ProviderProfile.findOne({
      where: { userId: userId },
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl', 'isEmailVerified', 'isPhoneVerified', 'privacySettings']
        },
        {
          model: ProviderDocument,
          attributes: ['id', 'type', 'url', 'status', 'notes', 'createdAt']
        }
      ]
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    return provider.toJSON();
  }

  async updateProviderProfile(providerId, updateData) {
    const provider = await ProviderProfile.findByPk(providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    const updatedProvider = await provider.update(updateData);
    return updatedProvider;
  }

  async getProvidersByCategory(category, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const providers = await ProviderProfile.findAndCountAll({
      where: { 
        category,
        verificationStatus: 'verified'
      },
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
        }
      ],
      limit,
      offset,
      order: [
        // Top listed providers first (those with active top listing)
        [sequelize.literal('CASE WHEN topListingEndDate > NOW() THEN 1 ELSE 0 END'), 'DESC'],
        // Then by priority (Premium = 2, Basic = 1)
        ['listingPriority', 'DESC'],
        // Then by newest
        ['createdAt', 'DESC']
      ]
    });

    // Add computed fields
    const providersWithStatus = providers.rows.map(provider => {
      const isTopListed = provider.topListingEndDate && new Date(provider.topListingEndDate) > new Date();
      const daysRemaining = isTopListed 
        ? Math.ceil((new Date(provider.topListingEndDate) - new Date()) / (1000 * 60 * 60 * 24))
        : 0;

      // Extract brand images from ProviderDocuments
      const brandImages = provider.ProviderDocuments 
        ? provider.ProviderDocuments
            .filter(doc => doc.status === 'approved' || doc.status === 'pending')
            .map(doc => ({ url: doc.url, id: doc.id }))
        : [];


      return {
        ...provider.toJSON(),
        isTopListed,
        daysRemaining,
        brandImages: brandImages
      };
    });

    return {
      providers: providersWithStatus,
      totalCount: providers.count,
      totalPages: Math.ceil(providers.count / limit),
      currentPage: page
    };
  }

  async searchProviders(searchTerm, category = null, location = null, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const whereClause = {
      verificationStatus: 'verified'
    };

    if (category) {
      whereClause.category = category;
    }

    if (location) {
      whereClause[Op.or] = [
        { locationCity: { [Op.like]: `%${location}%` } },
        { locationState: { [Op.like]: `%${location}%` } }
      ];
    }

    // Build order clause with location priority if location is specified
    const orderClause = [];
    
    if (location) {
      // Priority 1: Exact city match (providers in the searched city appear first)
      orderClause.push([
        sequelize.literal(`CASE WHEN locationCity LIKE '${location}%' THEN 1 ELSE 0 END`),
        'DESC'
      ]);
    }
    
    // Priority 2: Top listed providers (within the location)
    orderClause.push([
      sequelize.literal('CASE WHEN topListingEndDate > NOW() THEN 1 ELSE 0 END'),
      'DESC'
    ]);
    
    // Priority 3: Listing priority (Premium = 2, Basic = 1)
    orderClause.push(['listingPriority', 'DESC']);
    
    // Priority 4: Newest first
    orderClause.push(['createdAt', 'DESC']);

    const providers = await ProviderProfile.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          where: searchTerm ? {
            [Op.or]: [
              { fullName: { [Op.like]: `%${searchTerm}%` } },
              { email: { [Op.like]: `%${searchTerm}%` } }
            ]
          } : {},
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
        },
        {
          model: ProviderDocument,
          attributes: ['id', 'url', 'status', 'type'],
          required: false
        }
      ],
      limit,
      offset,
      order: orderClause
    });

    // Add computed fields
    const providersWithStatus = providers.rows.map(provider => {
      const isTopListed = provider.topListingEndDate && new Date(provider.topListingEndDate) > new Date();
      const daysRemaining = isTopListed 
        ? Math.ceil((new Date(provider.topListingEndDate) - new Date()) / (1000 * 60 * 60 * 24))
        : 0;

      // Extract brand images from ProviderDocuments
      const brandImages = provider.ProviderDocuments 
        ? provider.ProviderDocuments
            .filter(doc => doc.status === 'approved' || doc.status === 'pending')
            .map(doc => ({ url: doc.url, id: doc.id }))
        : [];


      return {
        ...provider.toJSON(),
        isTopListed,
        daysRemaining,
        brandImages: brandImages
      };
    });

    return {
      providers: providersWithStatus,
      totalCount: providers.count,
      totalPages: Math.ceil(providers.count / limit),
      currentPage: page
    };
  }

  async getProviderServices(providerProfileId) {
    const services = await Service.findAll({
      where: {
        providerId: providerProfileId,
        isActive: true,
      },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'description', 'pricingType', 'basePrice', 'isActive']
    });

    return services;
  }

  async getPopularSubcategories(category, limit = 10) {
    try {
      const providers = await ProviderProfile.findAll({
        where: { 
          category,
          verificationStatus: 'verified'
        },
        attributes: ['subcategories']
      });

      // Count subcategory occurrences
      const subcategoryCounts = {};
      providers.forEach(provider => {
        if (provider.subcategories && Array.isArray(provider.subcategories)) {
          provider.subcategories.forEach(sub => {
            subcategoryCounts[sub] = (subcategoryCounts[sub] || 0) + 1;
          });
        }
      });

      // Sort by count and return top subcategories
      return Object.entries(subcategoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([subcategory]) => subcategory);
    } catch (error) {
      console.error('Error getting popular subcategories:', error);
      return [];
    }
  }

  async sendWelcomeEmail(email, fullName) {
    try {
      const subject = 'Welcome to Alabastar as a Provider! 🎉';
      const context = {
        fullName,
        email,
        dashboardUrl: `${process.env.API_URL || 'http://localhost:3000'}/provider/dashboard`
      };
      await sendEmail(email, subject, '', 'provider-welcome', context);
      console.log(`Provider welcome email sent to ${email}`);
    } catch (error) {
      console.error('Error sending provider welcome email:', error);
    }
  }

  async getProviderDocuments(providerId, type = null) {
    try {
      const whereClause = { providerId };
      if (type) {
        whereClause.type = type;
      }

      const documents = await ProviderDocument.findAll({
        where: whereClause,
        attributes: ['id', 'type', 'url', 'status', 'notes', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });

      return documents;
    } catch (error) {
      console.error('Error fetching provider documents:', error);
      throw error;
    }
  }

  async createProviderDocument(documentData) {
    try {
      // Check photo limit if this is a brand image
      if (documentData.type === 'brand_image' || documentData.documentType === 'brand_image') {
        const SubscriptionHelper = (await import('../utils/subscriptionHelper.js')).default;
        const photoCheck = await SubscriptionHelper.canUploadPhoto(documentData.providerId);
        
        if (!photoCheck.allowed) {
          throw new Error(`Photo limit reached. ${photoCheck.reason}. You have ${photoCheck.currentCount}/${photoCheck.maxAllowed} photos.`);
        }
      }

      const document = await ProviderDocument.create(documentData);
      return document;
    } catch (error) {
      console.error('Error creating provider document:', error);
      throw error;
    }
  }

  async deleteProviderDocument(documentId, providerId) {
    try {
      const document = await ProviderDocument.findOne({
        where: {
          id: documentId,
          providerId: providerId
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      await document.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting provider document:', error);
      throw error;
    }
  }

  async uploadProviderVideo(providerId, videoData) {
    try {
      const { videoUrl, videoThumbnail, videoDuration } = videoData;

      // Check if provider can upload video
      const SubscriptionHelper = (await import('../utils/subscriptionHelper.js')).default;
      const videoCheck = await SubscriptionHelper.canUploadVideo(providerId);

      if (!videoCheck.allowed) {
        throw new Error(videoCheck.reason || 'Video upload not allowed');
      }

      // Validate video duration
      if (videoDuration > videoCheck.maxDuration) {
        throw new Error(`Video duration exceeds limit. Maximum ${videoCheck.maxDuration} seconds allowed.`);
      }

      // Update provider profile with video
      const provider = await ProviderProfile.findByPk(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      await provider.update({
        videoUrl,
        videoThumbnail,
        videoDuration,
        videoUploadedAt: new Date()
      });

      return {
        success: true,
        message: 'Video uploaded successfully',
        data: {
          videoUrl,
          videoThumbnail,
          videoDuration
        }
      };
    } catch (error) {
      console.error('Error uploading provider video:', error);
      throw error;
    }
  }

  async deleteProviderVideo(providerId) {
    try {
      const provider = await ProviderProfile.findByPk(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      await provider.update({
        videoUrl: null,
        videoThumbnail: null,
        videoDuration: null,
        videoUploadedAt: null
      });

      return {
        success: true,
        message: 'Video deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting provider video:', error);
      throw error;
    }
  }

  async getFeatureLimits(providerId) {
    try {
      const SubscriptionHelper = (await import('../utils/subscriptionHelper.js')).default;
      const limits = await SubscriptionHelper.getFeatureLimits(providerId);
      
      // Get current photo count
      const photoCount = await ProviderDocument.count({
        where: {
          providerId,
          type: 'brand_image'
        }
      });

      // Get video status
      const provider = await ProviderProfile.findByPk(providerId, {
        attributes: ['videoUrl', 'videoDuration']
      });

      return {
        success: true,
        data: {
          ...limits,
          currentPhotoCount: photoCount,
          photosRemaining: Math.max(0, limits.features.maxPhotos - photoCount),
          hasVideo: !!provider?.videoUrl,
          videoDetails: provider?.videoUrl ? {
            url: provider.videoUrl,
            thumbnail: provider.videoThumbnail,
            duration: provider.videoDuration
          } : null
        }
      };
    } catch (error) {
      console.error('Error getting feature limits:', error);
      throw error;
    }
  }

  // Create user account and registration progress (for step 1)
  async createUserAndRegistrationProgress(stepData) {
    try {
      const { fullName, email, password, phone, alternativePhone, businessName, referralCode } = stepData;

      // Validate required fields for step 1
      if (!fullName || !email || !password) {
        throw new Error('Full name, email, and password are required for step 1');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await User.create({
        fullName,
        email,
        passwordHash,
        phone: phone || null,
        alternativePhone: alternativePhone || null,
        role: 'provider',
        status: 'active',
        provider: 'email'
      });

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Create registration progress record
      const progress = await ProviderRegistrationProgress.create({
        userId: user.id,
        currentStep: 1,
        stepData: {
          step1: {
            fullName,
            email,
            phone: phone || null,
            alternativePhone: alternativePhone || null,
            businessName: businessName || null,
            referralCode: referralCode || null
          }
        },
        lastUpdated: new Date()
      });

      return {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status
          },
          registrationProgress: {
            currentStep: progress.currentStep,
            stepData: progress.stepData,
            completedSteps: 1
          }
        }
      };
    } catch (error) {
      console.error('Error creating user and registration progress:', error);
      throw error;
    }
  }
}

export default new ProviderService();
