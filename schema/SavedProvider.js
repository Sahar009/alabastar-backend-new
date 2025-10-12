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
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'provider_profiles',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  timestamps: true,
  tableName: 'saved_providers',
  indexes: [
    { unique: true, fields: ['userId', 'providerId'] },
    { fields: ['providerId'] }
  ]
});

// Define associations (to be set up in schema/index.js)
SavedProvider.associate = (models) => {
  SavedProvider.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  SavedProvider.belongsTo(models.ProviderProfile, {
    foreignKey: 'providerId',
    as: 'provider'
  });
};

export default SavedProvider;
































