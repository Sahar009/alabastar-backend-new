import { User, ProviderProfile, ProviderDocument } from '../schema/index.js';
import { sendEmail } from '../modules/notifications/email.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

class ProviderService {
  async registerProvider(providerData) {
    const {
      // User data
      fullName,
      email,
      phone,
      alternativePhone,
      password,
      
      // Provider profile data
      category,
      subcategories,
      yearsOfExperience,
      bio,
      hourlyRate,
      startingPrice,
      locationCity,
      locationState,
      latitude,
      longitude,
      portfolio,
      
      // Document data
      documents
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
      phone,
      alternativePhone,
      passwordHash,
      role: 'provider',
      status: 'active'
    });

    // Create provider profile
    const providerProfile = await ProviderProfile.create({
      userId: user.id,
      category,
      subcategories: subcategories || [],
      yearsOfExperience,
      bio,
      hourlyRate,
      startingPrice,
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

    // Send welcome email
    try {
      await this.sendWelcomeEmail(user.email, user.fullName);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }

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
        category: providerProfile.category,
        subcategories: providerProfile.subcategories,
        yearsOfExperience: providerProfile.yearsOfExperience,
        bio: providerProfile.bio,
        hourlyRate: providerProfile.hourlyRate,
        startingPrice: providerProfile.startingPrice,
        locationCity: providerProfile.locationCity,
        locationState: providerProfile.locationState,
        verificationStatus: providerProfile.verificationStatus
      },
      documents: createdDocuments
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
