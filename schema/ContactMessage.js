import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const ContactMessage = sequelize.define('ContactMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(160),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(40),
    allowNull: true
  },
  subject: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('new', 'read', 'replied', 'closed'),
    allowNull: false,
    defaultValue: 'new'
  }
}, {
  timestamps: true,
  tableName: 'contact_messages',
  indexes: [
    { fields: ['email'] },
    { fields: ['status'] }
  ]
});

export default ContactMessage;









