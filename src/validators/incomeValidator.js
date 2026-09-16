const { HTTP_STATUS, RECURRING_FREQUENCIES } = require('../constants');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');

const validateIncome = (req, res, next) => {
  const { amount, source, categoryId, date, recurringFrequency, isRecurring } = req.body;
  const errors = [];

  const parsedAmount = parseFloat(amount);
  if (amount === undefined || isNaN(parsedAmount) || parsedAmount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be a positive number greater than 0' });
  }

  if (!source || typeof source !== 'string' || !source.trim()) {
    errors.push({ field: 'source', message: 'Income source is required' });
  }

  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    errors.push({ field: 'categoryId', message: 'Valid category ID is required' });
  }

  if (!date || isNaN(new Date(date).getTime())) {
    errors.push({ field: 'date', message: 'A valid transaction date is required' });
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
  validateIncome,
};
