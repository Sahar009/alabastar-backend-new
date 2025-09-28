import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const CorporateRequest = sequelize.define('CorporateRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  companyName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  contactName: {
    type: DataTypes.STRING(160),
    allowNull: false
  },
  contactEmail: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  contactPhone: {
    type: DataTypes.STRING(40),
    allowNull: true
  },
  servicesInterested: {
    type: DataTypes.JSON,
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'proposal_sent', 'won', 'lost'),
    allowNull: false,
    defaultValue: 'new'
  }
}, {
  timestamps: true,
  tableName: 'corporate_requests',
  indexes: [
    { fields: ['contactEmail'] },
    { fields: ['status'] }
  ]
});

export default CorporateRequest;














