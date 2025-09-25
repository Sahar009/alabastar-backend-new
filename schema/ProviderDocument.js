import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const ProviderDocument = sequelize.define('ProviderDocument', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('id_card', 'certificate', 'license', 'other'),
    allowNull: false
  },
  url: {
    type: DataTypes.STRING(2048),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'provider_documents',
  indexes: [
    { fields: ['providerId'] },
    { fields: ['status'] },
    { fields: ['type'] }
  ]
});

export default ProviderDocument;










