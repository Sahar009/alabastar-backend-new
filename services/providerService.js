import { User, ProviderProfile, ProviderDocument } from '../schema/index.js';
import { Service } from '../schema/index.js';
import { sendEmail } from '../modules/notifications/email.js';
import { generateToken } from '../utils/index.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Op } from 'sequelize';

class ProviderService {
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
      verificationStatus: 'pending'
    });

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
        verificationStatus: providerProfile.verificationStatus
      },
      documents: createdDocuments,
      brandImages: createdBrandImages,
      token: token
    };
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
      order: [['ratingAverage', 'DESC']]
    });

    return {
      providers: providers.rows,
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
        { locationCity: { [Op.iLike]: `%${location}%` } },
        { locationState: { [Op.iLike]: `%${location}%` } }
      ];
    }

    const providers = await ProviderProfile.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          where: searchTerm ? {
            [Op.or]: [
              { fullName: { [Op.iLike]: `%${searchTerm}%` } },
              { email: { [Op.iLike]: `%${searchTerm}%` } }
            ]
          } : {},
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
        }
      ],
      limit,
      offset,
      order: [['ratingAverage', 'DESC']]
    });

    return {
      providers: providers.rows,
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
}

export default new ProviderService();
