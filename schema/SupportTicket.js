import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  subject: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    allowNull: false,
    defaultValue: 'open'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true
  },
  resolutionNote: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'support_tickets',
  indexes: [
    { fields: ['userId'] },
    { fields: ['bookingId'] },
    { fields: ['status'] },
    { fields: ['priority'] }
  ]
});

export default SupportTicket;










