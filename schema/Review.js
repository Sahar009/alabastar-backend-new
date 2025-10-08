import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  reviewerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'reviews',
  indexes: [
    { fields: ['bookingId'] },
    { fields: ['reviewerId'] },
    { fields: ['providerId'] },
    { fields: ['rating'] }
  ]
});

export default Review;
































