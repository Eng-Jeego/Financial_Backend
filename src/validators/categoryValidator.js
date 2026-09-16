const { HTTP_STATUS, CATEGORY_TYPES } = require('../constants');
const AppError = require('../utils/appError');

const validateCategory = (req, res, next) => {
  const { name, type, color } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push({ field: 'name', message: 'Category name is required' });
  }

  if (!type || ![CATEGORY_TYPES.INCOME, CATEGORY_TYPES.EXPENSE].includes(type)) {
    errors.push({ field: 'type', message: 'Category type must be either income or expense' });
  }

  if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    errors.push({ field: 'color', message: 'Please provide a valid hex color (e.g. #3b82f6)' });
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, errors));
  }

  next();
};

module.exports = {
  validateCategory,
};
