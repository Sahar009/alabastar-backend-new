import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Withdrawal = sequelize.define('Withdrawal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'NGN'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'paid', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  bankDetails: {
    type: DataTypes.JSON,
    allowNull: true
  },
  reference: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'withdrawals',
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['reference'] }
  ]
});

export default Withdrawal;
















