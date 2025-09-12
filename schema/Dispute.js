import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Dispute = sequelize.define('Dispute', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  raisedById: {
    type: DataTypes.UUID,
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('open', 'under_review', 'resolved', 'rejected'),
    allowNull: false,
    defaultValue: 'open'
  },
  resolution: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'disputes',
  indexes: [
    { fields: ['bookingId'] },
    { fields: ['raisedById'] },
    { fields: ['status'] }
  ]
});

export default Dispute;


