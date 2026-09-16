const mongoose = require('mongoose');
const { CATEGORY_TYPES } = require('../constants');

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means system-wide default category
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    type: {
      type: String,
      enum: {
        values: [CATEGORY_TYPES.INCOME, CATEGORY_TYPES.EXPENSE],
        message: 'Category type must be either income or expense',
      },
      required: [true, 'Category type is required'],
    },
    color: {
      type: String,
      default: '#64748b',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color code'],
    },
    icon: {
      type: String,
      default: 'Tag',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate category names per user per type
categorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
