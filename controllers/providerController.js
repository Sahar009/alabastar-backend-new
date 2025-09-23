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
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(providerData.phone.replace(/\s/g, ''))) {
          return messageHandler(res, BAD_REQUEST, 'Invalid phone number format');
        }
      }

      // Validate alternative phone format if provided
      if (providerData.alternativePhone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(providerData.alternativePhone.replace(/\s/g, ''))) {
          return messageHandler(res, BAD_REQUEST, 'Invalid alternative phone number format');
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

      // Validate hourly rate and starting price
      if (providerData.hourlyRate && (providerData.hourlyRate < 0 || providerData.hourlyRate > 10000)) {
        return messageHandler(res, BAD_REQUEST, 'Hourly rate must be between 0 and 10000');
      }

      if (providerData.startingPrice && (providerData.startingPrice < 0 || providerData.startingPrice > 10000)) {
        return messageHandler(res, BAD_REQUEST, 'Starting price must be between 0 and 10000');
      }

      // Validate years of experience
      if (providerData.yearsOfExperience && (providerData.yearsOfExperience < 0 || providerData.yearsOfExperience > 50)) {
        return messageHandler(res, BAD_REQUEST, 'Years of experience must be between 0 and 50');
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
}

export default new ProviderController();
