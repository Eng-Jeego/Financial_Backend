const { HTTP_STATUS } = require('../constants');
const AppError = require('../utils/appError');

/**
 * Validates admin user listing query parameters
 */
const validateUserQuery = (req, res, next) => {
  const { page, limit, status, role, sortBy, sortOrder } = req.query;
  const errors = [];

  if (page && (isNaN(page) || parseInt(page, 10) < 1)) {
    errors.push({ field: 'page', message: 'Page must be a positive integer' });
  }

  if (limit && (isNaN(limit) || parseInt(limit, 10) < 1 || parseInt(limit, 10) > 100)) {
    errors.push({ field: 'limit', message: 'Limit must be an integer between 1 and 100' });
  }

  if (status && !['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
    errors.push({ field: 'status', message: 'Status must be ACTIVE or INACTIVE' });
  }

  if (role && !['USER', 'ADMIN'].includes(role.toUpperCase())) {
    errors.push({ field: 'role', message: 'Role must be USER or ADMIN' });
  }

  if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
    errors.push({ field: 'sortOrder', message: 'Sort order must be asc or desc' });
  }

  if (errors.length > 0) {
    return next(new AppError('Invalid query parameters', HTTP_STATUS.BAD_REQUEST, errors));
  }

  next();
};

/**
 * Validates admin user profile update payload
 */
const validateUpdateUser = (req, res, next) => {
  const { fullName, email, role, currency } = req.body;
  const errors = [];

  if (fullName !== undefined && (typeof fullName !== 'string' || fullName.trim().length < 2)) {
    errors.push({ field: 'fullName', message: 'Full name must be at least 2 characters long' });
  }

  if (email !== undefined) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
      errors.push({ field: 'email', message: 'Please provide a valid email address' });
    }
  }

  if (role !== undefined && !['USER', 'ADMIN'].includes(role.toUpperCase())) {
    errors.push({ field: 'role', message: 'Role must be either USER or ADMIN' });
  }

  if (currency !== undefined && (typeof currency !== 'string' || currency.trim().length < 2)) {
    errors.push({ field: 'currency', message: 'Invalid currency code' });
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, errors));
  }

  next();
};

/**
 * Validates status toggle payload
 */
const validateUpdateStatus = (req, res, next) => {
  const { status } = req.body;

  if (!status || !['ACTIVE', 'INACTIVE'].includes(String(status).toUpperCase())) {
    return next(
      new AppError(
        'Validation failed',
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'status', message: 'Status is required and must be ACTIVE or INACTIVE' }]
      )
    );
  }

  next();
};

/**
 * Validates admin password reset payload
 */
const validateResetPassword = (req, res, next) => {
  const { newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return next(
      new AppError(
        'Validation failed',
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'newPassword', message: 'New password must be at least 6 characters long' }]
      )
    );
  }

  next();
};

module.exports = {
  validateUserQuery,
  validateUpdateUser,
  validateUpdateStatus,
  validateResetPassword,
};
