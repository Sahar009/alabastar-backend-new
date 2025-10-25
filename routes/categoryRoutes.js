import express from 'express';
import { ServiceCategory, Service } from '../schema/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get all active categories (public route)
router.get('/categories', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      search = '', 
      sortBy = 'name', 
      sortOrder = 'ASC' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {
      isActive: true // Only fetch active categories
    };

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: categories } = await ServiceCategory.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Service,
          as: 'Services',
          attributes: ['id'],
          where: { isActive: true },
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: [
        'id', 'name', 'slug', 'description', 'icon', 'isActive', 'createdAt', 'updatedAt'
      ]
    });

    // Add service count to each category
    const categoriesWithCounts = categories.map(category => ({
      ...category.toJSON(),
      serviceCount: category.Services ? category.Services.length : 0
    }));

    res.json({
      success: true,
      data: {
        categories: categoriesWithCounts,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// Get a single category by slug (public route)
router.get('/categories/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await ServiceCategory.findOne({
      where: { 
        slug: slug,
        isActive: true 
      },
      include: [
        {
          model: Service,
          as: 'Services',
          attributes: ['id', 'name', 'description', 'price', 'duration'],
          where: { isActive: true },
          required: false
        }
      ],
      attributes: [
        'id', 'name', 'slug', 'description', 'icon', 'isActive', 'createdAt', 'updatedAt'
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const categoryWithCount = {
      ...category.toJSON(),
      serviceCount: category.Services ? category.Services.length : 0
    };

    res.json({
      success: true,
      data: categoryWithCount
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
});

export default router;
