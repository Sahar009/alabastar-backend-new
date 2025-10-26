import express from 'express';
import SubscriptionPlan from '../schema/SubscriptionPlan.js';
import { SUCCESS, BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR } from '../constants/statusCode.js';
import { messageHandler } from '../utils/index.js';

const router = express.Router();

class SubscriptionPlanController {
  /**
   * Get all active subscription plans
   */
  static async getActivePlans(req, res) {
    try {
      const plans = await SubscriptionPlan.findAll({
        where: { isActive: true },
        order: [['price', 'ASC']], // Cheapest first
        attributes: ['id', 'name', 'slug', 'price', 'interval', 'benefits', 'features']
      });

      return messageHandler(res, SUCCESS, 'Subscription plans retrieved successfully', plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error fetching subscription plans');
    }
  }

  /**
   * Get a specific subscription plan by ID
   */
  static async getPlanById(req, res) {
    try {
      const { planId } = req.params;
      
      const plan = await SubscriptionPlan.findByPk(planId, {
        attributes: ['id', 'name', 'slug', 'price', 'interval', 'benefits']
      });

      if (!plan) {
        return messageHandler(res, NOT_FOUND, 'Subscription plan not found');
      }

      return messageHandler(res, SUCCESS, 'Subscription plan retrieved successfully', plan);
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error fetching subscription plan');
    }
  }

  /**
   * Create a new subscription plan (Admin only)
   */
  static async createPlan(req, res) {
    try {
      const { name, slug, price, interval, benefits } = req.body;

      // Validate required fields
      if (!name || !slug || !price || !interval) {
        return messageHandler(res, BAD_REQUEST, 'Missing required fields: name, slug, price, interval');
      }

      // Validate interval
      if (!['monthly', 'yearly'].includes(interval)) {
        return messageHandler(res, BAD_REQUEST, 'Interval must be either "monthly" or "yearly"');
      }

      // Validate price
      if (price <= 0) {
        return messageHandler(res, BAD_REQUEST, 'Price must be greater than 0');
      }

      const plan = await SubscriptionPlan.create({
        name,
        slug,
        price,
        interval,
        benefits: benefits || [],
        isActive: true
      });

      return messageHandler(res, SUCCESS, 'Subscription plan created successfully', plan);
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return messageHandler(res, BAD_REQUEST, 'A subscription plan with this slug already exists');
      }
      return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error creating subscription plan');
    }
  }

  /**
   * Update a subscription plan (Admin only)
   */
  static async updatePlan(req, res) {
    try {
      const { planId } = req.params;
      const { name, slug, price, interval, benefits, isActive } = req.body;

      const plan = await SubscriptionPlan.findByPk(planId);
      if (!plan) {
        return messageHandler(res, NOT_FOUND, 'Subscription plan not found');
      }

      // Update only provided fields
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug;
      if (price !== undefined) updateData.price = price;
      if (interval !== undefined) updateData.interval = interval;
      if (benefits !== undefined) updateData.benefits = benefits;
      if (isActive !== undefined) updateData.isActive = isActive;

      await plan.update(updateData);

      return messageHandler(res, SUCCESS, 'Subscription plan updated successfully', plan);
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return messageHandler(res, BAD_REQUEST, 'A subscription plan with this slug already exists');
      }
      return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error updating subscription plan');
    }
  }

  /**
   * Delete a subscription plan (Admin only)
   */
  static async deletePlan(req, res) {
    try {
      const { planId } = req.params;

      const plan = await SubscriptionPlan.findByPk(planId);
      if (!plan) {
        return messageHandler(res, NOT_FOUND, 'Subscription plan not found');
      }

      await plan.destroy();

      return messageHandler(res, SUCCESS, 'Subscription plan deleted successfully');
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      return messageHandler(res, INTERNAL_SERVER_ERROR, 'Error deleting subscription plan');
    }
  }
}

// Public routes
router.get('/plans', SubscriptionPlanController.getActivePlans);
router.get('/plans/:planId', SubscriptionPlanController.getPlanById);

// Admin routes (you can add authentication middleware later)
router.post('/plans', SubscriptionPlanController.createPlan);
router.put('/plans/:planId', SubscriptionPlanController.updatePlan);
router.delete('/plans/:planId', SubscriptionPlanController.deletePlan);

export default router;


