import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const ProviderProfile = sequelize.define('ProviderProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  subcategories: {
    type: DataTypes.JSON,
    allowNull: true
  },
  yearsOfExperience: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: true
  },
  startingPrice: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: true
  },
  verificationStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ratingAverage: {
    type: DataTypes.DECIMAL(3,2),
    defaultValue: 0,
    allowNull: false
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  locationCity: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  locationState: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10,8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11,8),
    allowNull: true
  },
  portfolio: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'provider_profiles',
  indexes: [
    { fields: ['userId'] },
    { fields: ['category'] },
    { fields: ['verificationStatus'] },
    { fields: ['locationCity', 'locationState'] }
  ]
});

export default ProviderProfile;



