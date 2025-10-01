import providerService from '../services/providerService.js';
import { messageHandler } from '../utils/index.js';
import { BAD_REQUEST, SUCCESS, CREATED, NOT_FOUND } from '../constants/statusCode.js';

class ProviderController {
  async registerProvider(req, res) {
    try {
      const providerData = req.body;
      
      // Validate required fields
      const requiredFields = ['fullName', 'email', 'password', 'category', 'locationCity', 'locationState'];
      const missingFields = requiredFields.filter(field => !providerData[field]);
      
      if (missingFields.length > 0) {
        return messageHandler(res, BAD_REQUEST, `Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(providerData.email)) {
        return messageHandler(res, BAD_REQUEST, 'Invalid email format');
      }

      // Validate password strength
      if (providerData.password.length < 8) {
        return messageHandler(res, BAD_REQUEST, 'Password must be at least 8 characters long');
      }

      // Validate phone format if provided
      if (providerData.phone) {
        const cleanPhone = providerData.phone.replace(/\s/g, '');
        const phoneRegex = /^(\+?234|0)?[789][01]\d{8}$/;
        if (!phoneRegex.test(cleanPhone)) {
          return messageHandler(res, BAD_REQUEST, 'Invalid phone number format. Please use Nigerian format: 08101126131 or +2348101126131');
        }
      }

      // Validate alternative phone format if provided
      if (providerData.alternativePhone) {
        const cleanPhone = providerData.alternativePhone.replace(/\s/g, '');
        const phoneRegex = /^(\+?234|0)?[789][01]\d{8}$/;
        if (!phoneRegex.test(cleanPhone)) {
          return messageHandler(res, BAD_REQUEST, 'Invalid alternative phone number format. Please use Nigerian format: 08101126131 or +2348101126131');
        }
      }

      // Validate category
      const validCategories = [
        'plumbing', 'electrical', 'cleaning', 'moving', 'ac_repair', 
        'carpentry', 'painting', 'pest_control', 'laundry', 'tiling', 
        'cctv', 'gardening', 'appliance_repair', 'locksmith', 'carpet_cleaning'
      ];
      
      if (!validCategories.includes(providerData.category)) {
        return messageHandler(res, BAD_REQUEST, 'Invalid service category');
      }


      const result = await providerService.registerProvider(providerData);
      
      return messageHandler(res, CREATED, 'Provider registered successfully', result);
    } catch (error) {
      console.error('Provider registration error:', error);
      return messageHandler(res, BAD_REQUEST, error.message);
    }
  }

  async getProviderProfile(req, res) {
    try {
      const { providerId } = req.params;
      
      if (!providerId) {
        return messageHandler(res, BAD_REQUEST, 'Provider ID is required');
      }

      const provider = await providerService.getProviderProfile(providerId);
      
      return messageHandler(res, SUCCESS, 'Provider profile retrieved successfully', provider);
    } catch (error) {
      console.error('Get provider profile error:', error);
      if (error.message === 'Provider not found') {
        return messageHandler(res, NOT_FOUND, error.message);
      }
      return messageHandler(res, BAD_REQUEST, error.message);
    }
  }

  async updateProviderProfile(req, res) {
    try {
      const { providerId } = req.params;
      const updateData = req.body;
      
      if (!providerId) {
        return messageHandler(res, BAD_REQUEST, 'Provider ID is required');
      }

      const updatedProvider = await providerService.updateProviderProfile(providerId, updateData);
      
      return messageHandler(res, SUCCESS, 'Provider profile updated successfully', updatedProvider);
    } catch (error) {
      console.error('Update provider profile error:', error);
      if (error.message === 'Provider not found') {
        return messageHandler(res, NOT_FOUND, error.message);
      }
      return messageHandler(res, BAD_REQUEST, error.message);
    }
  }

  async getProvidersByCategory(req, res) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      if (!category) {
        return messageHandler(res, BAD_REQUEST, 'Category is required');
      }

      const result = await providerService.getProvidersByCategory(
        category, 
        parseInt(page), 
        parseInt(limit)
      );
      
      return messageHandler(res, SUCCESS, 'Providers retrieved successfully', result);
    } catch (error) {
      console.error('Get providers by category error:', error);
      return messageHandler(res, BAD_REQUEST, error.message);
    }
  }

  async searchProviders(req, res) {
    try {
      const { search, category, location, page = 1, limit = 20 } = req.query;
      
      const result = await providerService.searchProviders(
        search || '',
        category || null,
        location || null,
        parseInt(page),
        parseInt(limit)
      );
      
      return messageHandler(res, SUCCESS, 'Providers retrieved successfully', result);
    } catch (error) {
      console.error('Search providers error:', error);
      return messageHandler(res, BAD_REQUEST, error.message);
    }
  }

  async getProviderServices(req, res) {
    try {
      const { providerId } = req.params;
      if (!providerId) {
        return messageHandler(res, BAD_REQUEST, 'Provider ID is required');
      }
      const services = await providerService.getProviderServices(providerId);
      return messageHandler(res, SUCCESS, 'Provider services retrieved successfully', { services });
    } catch (error) {
      console.error('Get provider services error:', error);
      return messageHandler(res, BAD_REQUEST, error.message);
    }
  }

  async getPopularSubcategories(req, res) {
    try {
      const { category } = req.params;
      const { limit = 10 } = req.query;
      
      if (!category) {
        return messageHandler(res, BAD_REQUEST, 'Category is required');
      }

      const subcategories = await providerService.getPopularSubcategories(category, parseInt(limit));
      
      return messageHandler(res, SUCCESS, 'Popular subcategories retrieved successfully', { subcategories });
    } catch (error) {
      console.error('Get popular subcategories error:', error);
      return messageHandler(res, BAD_REQUEST, error.message);
    }
  }

  async getProviderDocuments(req, res) {
    try {
      const { providerId } = req.params;
      const { type } = req.query; // Optional filter by document type
      
      if (!providerId) {
        return messageHandler(res, BAD_REQUEST, 'Provider ID is required');
      }

      const documents = await providerService.getProviderDocuments(providerId, type);
      
      return messageHandler(res, SUCCESS, 'Documents retrieved successfully', { documents });
    } catch (error) {
      console.error('Error fetching provider documents:', error);
      return messageHandler(res, 500, 'Failed to fetch provider documents');
    }
  }

  async initializeProviderPayment(req, res) {
    try {
      const { providerId } = req.params;
      
      if (!providerId) {
        return messageHandler(res, BAD_REQUEST, 'Provider ID is required');
      }

      const paymentData = await providerService.initializeProviderRegistrationPayment(providerId);
      
      return messageHandler(res, SUCCESS, 'Payment initialized successfully', paymentData);
    } catch (error) {
      console.error('Error initializing provider payment:', error);
      return messageHandler(res, BAD_REQUEST, error.message);
    }
  }

  async initializePaymentForRegistration(req, res) {
    try {
      const providerData = req.body;
      
      // Validate required fields for payment initialization
      const requiredFields = ['fullName', 'email', 'businessName', 'category'];
      const missingFields = requiredFields.filter(field => !providerData[field]);
      
      if (missingFields.length > 0) {
        return messageHandler(res, BAD_REQUEST, `Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(providerData.email)) {
        return messageHandler(res, BAD_REQUEST, `Invalid email format. Please use a valid email address like "user@example.com". You provided: "${providerData.email}"`);
      }

      const paymentData = await providerService.initializeProviderPayment(providerData);
      
      return messageHandler(res, SUCCESS, 'Payment initialized successfully', paymentData);
    } catch (error) {
      console.error('Error initializing payment for registration:', error);
      return messageHandler(res, BAD_REQUEST, error.message);
    }
  }
}

export default new ProviderController();
