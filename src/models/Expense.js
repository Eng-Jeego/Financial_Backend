const mongoose = require('mongoose');
const { RECURRING_FREQUENCIES, PAYMENT_METHODS } = require('../constants');

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
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
    paymentMethod: {
      type: String,
      enum: {
        values: PAYMENT_METHODS,
        message: 'Invalid payment method',
      },
      default: 'Card',
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
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, categoryId: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
