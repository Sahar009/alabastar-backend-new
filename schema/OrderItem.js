import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  lineTotal: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'order_items',
  indexes: [
    { fields: ['orderId'] },
    { fields: ['productId'] }
  ]
});

export default OrderItem;
























