import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const NewsletterSubscription = sequelize.define('NewsletterSubscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  status: {
    type: DataTypes.ENUM('subscribed', 'unsubscribed'),
    defaultValue: 'subscribed',
    allowNull: false
  },
  unsubscribeToken: {
    type: DataTypes.STRING(32),
    allowNull: true,
    unique: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'newsletter_subscriptions',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['status']
    }
  ]
});

export default NewsletterSubscription;