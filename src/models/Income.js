const mongoose = require('mongoose');
const { RECURRING_FREQUENCIES } = require('../constants');

const incomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Income amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    source: {
      type: String,
      required: [true, 'Income source is required'],
      trim: true,
      maxlength: [100, 'Source cannot exceed 100 characters'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: {
        values: RECURRING_FREQUENCIES,
        message: 'Invalid recurring frequency',
      },
      default: 'none',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant querying, date filtering, and category lookups
incomeSchema.index({ userId: 1, date: -1 });
incomeSchema.index({ userId: 1, categoryId: 1 });

const Income = mongoose.model('Income', incomeSchema);

module.exports = Income;
