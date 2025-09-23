import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const ServiceCategory = sequelize.define('ServiceCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING(140),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'service_categories'
});

export default ServiceCategory;









