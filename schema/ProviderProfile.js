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
  businessName: {
    type: DataTypes.STRING(200),
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
  bio: {
    type: DataTypes.TEXT,
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
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Payment status for provider subscription'
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
  },
  referralCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    comment: 'Unique referral code for this provider'
  },
  referredBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Provider who referred this provider'
  },
  totalReferrals: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Total number of successful referrals'
  },
  totalCommissionsEarned: {
    type: DataTypes.DECIMAL(10,2),
    defaultValue: 0.00,
    allowNull: false,
    comment: 'Total commissions earned from referrals'
  },
  referralSettings: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Referral preferences and settings'
  },
  videoUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Business promotional video URL (Premium feature)'
  },
  videoThumbnail: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Video thumbnail image URL'
  },
  videoDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Video duration in seconds (max 90 for Premium)'
  },
  videoUploadedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the video was uploaded'
  },
  topListingStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When top listing started'
  },
  topListingEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When top listing expires'
  },
  listingPriority: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    comment: 'Listing priority (1=Basic, 2=Premium)'
  }
}, {
  timestamps: true,
  tableName: 'provider_profiles',
  indexes: [
    { fields: ['userId'] },
    { fields: ['category'] },
    { fields: ['verificationStatus'] },
    { fields: ['locationCity', 'locationState'] },
    { fields: ['referralCode'] },
    { fields: ['referredBy'] },
    { fields: ['totalReferrals'] },
    { fields: ['topListingEndDate'] },
    { fields: ['listingPriority'] }
  ]
});

export default ProviderProfile;











