import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const BlogPost = sequelize.define('BlogPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(220),
    allowNull: false,
    unique: true
  },
  excerpt: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  coverImageUrl: {
    type: DataTypes.STRING(2048),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft',
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'blog_posts',
  indexes: [
    { unique: true, fields: ['slug'] },
    { fields: ['authorId'] },
    { fields: ['status'] }
  ]
});

export default BlogPost;



















