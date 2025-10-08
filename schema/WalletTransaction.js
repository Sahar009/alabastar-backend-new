import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const WalletTransaction = sequelize.define('WalletTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  walletId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('credit', 'debit'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: false
  },
  reference: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  balanceAfter: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'wallet_transactions',
  indexes: [
    { fields: ['walletId'] },
    { fields: ['type'] },
    { fields: ['reference'] }
  ]
});

export default WalletTransaction;
































