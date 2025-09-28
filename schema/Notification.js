import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  meta: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'notifications',
  indexes: [
    { fields: ['userId'] },
    { fields: ['isRead'] }
  ]
});

export default Notification;














