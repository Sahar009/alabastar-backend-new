import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const SavedProvider = sequelize.define('SavedProvider', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'saved_providers',
  indexes: [
    { unique: true, fields: ['userId', 'providerId'] },
    { fields: ['providerId'] }
  ]
});

export default SavedProvider;



















