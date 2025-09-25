import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Address = sequelize.define('Address', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  label: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  addressLine: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Nigeria'
  },
  latitude: {
    type: DataTypes.DECIMAL(10,8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11,8),
    allowNull: true
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'addresses',
  indexes: [
    { fields: ['userId'] },
    { fields: ['city', 'state'] }
  ]
});

export default Address;










