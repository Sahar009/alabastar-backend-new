import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const ProviderSubscription = sequelize.define('ProviderSubscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  planId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'past_due', 'cancelled', 'expired'),
    allowNull: false,
    defaultValue: 'active'
  },
  currentPeriodStart: {
    type: DataTypes.DATE,
    allowNull: false
  },
  currentPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: false
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'provider_subscriptions',
  indexes: [
    { fields: ['providerId'] },
    { fields: ['planId'] },
    { fields: ['status'] }
  ]
});

export default ProviderSubscription;










