import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Wallet = sequelize.define('Wallet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  balance: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'NGN'
  }
}, {
  timestamps: true,
  tableName: 'wallets',
  indexes: [
    { unique: true, fields: ['userId'] }
  ]
});

export default Wallet;
































