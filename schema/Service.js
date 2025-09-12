import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pricingType: {
    type: DataTypes.ENUM('fixed', 'hourly', 'negotiable'),
    defaultValue: 'fixed',
    allowNull: false
  },
  basePrice: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  photos: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'services',
  indexes: [
    { fields: ['providerId'] },
    { fields: ['categoryId'] },
    { fields: ['pricingType'] },
    { fields: ['isActive'] }
  ]
});

export default Service;


