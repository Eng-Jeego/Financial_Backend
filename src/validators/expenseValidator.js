const { HTTP_STATUS, RECURRING_FREQUENCIES, PAYMENT_METHODS } = require('../constants');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');

const validateExpense = (req, res, next) => {
  const { amount, categoryId, date, paymentMethod, recurringFrequency, isRecurring } = req.body;
  const errors = [];

  const parsedAmount = parseFloat(amount);
  if (amount === undefined || isNaN(parsedAmount) || parsedAmount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be a positive number greater than 0' });
  }

  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    errors.push({ field: 'categoryId', message: 'Valid category ID is required' });
  }

  if (!date || isNaN(new Date(date).getTime())) {
    errors.push({ field: 'date', message: 'A valid transaction date is required' });
  }

  if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
    errors.push({ field: 'paymentMethod', message: 'Invalid payment method selected' });
  }

  if (isRecurring && recurringFrequency && !RECURRING_FREQUENCIES.includes(recurringFrequency)) {
    errors.push({ field: 'recurringFrequency', message: 'Invalid recurring frequency specified' });
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, errors));
  }

  next();
};

module.exports = {
  validateExpense,
};
