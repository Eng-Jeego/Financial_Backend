const { HTTP_STATUS } = require('../constants');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');

const validateBudget = (req, res, next) => {
  const { categoryId, amount, month, year } = req.body;
  const errors = [];

  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    errors.push({ field: 'categoryId', message: 'Valid category ID is required' });
  }

  const parsedAmount = parseFloat(amount);
  if (amount === undefined || isNaN(parsedAmount) || parsedAmount <= 0) {
    errors.push({ field: 'amount', message: 'Budget amount must be a positive number greater than 0' });
  }

  const parsedMonth = parseInt(month, 10);
  if (month === undefined || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    errors.push({ field: 'month', message: 'Month must be an integer between 1 and 12' });
  }

  const parsedYear = parseInt(year, 10);
  if (year === undefined || isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
    errors.push({ field: 'year', message: 'Year must be a valid 4-digit year' });
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, errors));
  }

  next();
};

module.exports = {
  validateBudget,
};
