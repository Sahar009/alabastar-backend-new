import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const ProviderRegistrationProgress = sequelize.define('ProviderRegistrationProgress', {
  id: {
    type: DataTypes.CHAR(36),
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    unique: true
  },
  currentStep: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 5
    }
  },
  stepData: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'provider_registration_progress',
  indexes: [
    { unique: true, fields: ['userId'] },
    { fields: ['currentStep'] },
    { fields: ['lastUpdated'] }
  ]
});

// Define associations (to be set up in schema/index.js)
ProviderRegistrationProgress.associate = (models) => {
  ProviderRegistrationProgress.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
};

export default ProviderRegistrationProgress;
