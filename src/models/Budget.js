const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0.01, 'Budget amount must be greater than zero'],
    },
    month: {
      type: Number,
      required: [true, 'Budget month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: [true, 'Budget year is required'],
      min: [2000, 'Year must be 2000 or greater'],
      max: [2100, 'Year must be 2100 or less'],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: A user can only set ONE budget per category per month/year
budgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
