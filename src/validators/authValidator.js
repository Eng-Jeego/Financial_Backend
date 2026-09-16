const { HTTP_STATUS } = require('../constants');
const AppError = require('../utils/appError');

/**
 * Validates registration input payload
 */
const validateRegister = (req, res, next) => {
  const { fullName, email, password, confirmPassword } = req.body;
  const errors = [];

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push({ field: 'fullName', message: 'Full name must be at least 2 characters long' });
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }

  if (password && confirmPassword && password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, errors));
  }

  next();
};

/**
 * Validates login input payload
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  }

  if (!password || typeof password !== 'string' || !password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return next(new AppError('Please provide both email and password', HTTP_STATUS.BAD_REQUEST, errors));
  }

  next();
};

/**
 * Validates profile update payload
 */
const validateUpdateProfile = (req, res, next) => {
  const { fullName, currency } = req.body;
  const errors = [];

  if (fullName !== undefined && (typeof fullName !== 'string' || fullName.trim().length < 2)) {
    errors.push({ field: 'fullName', message: 'Full name must be at least 2 characters long' });
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
 * Validates password change payload
 */
const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const errors = [];

  if (!currentPassword) {
    errors.push({ field: 'currentPassword', message: 'Current password is required' });
  }

  if (!newPassword || newPassword.length < 6) {
    errors.push({ field: 'newPassword', message: 'New password must be at least 6 characters long' });
  }

  if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
    errors.push({ field: 'confirmNewPassword', message: 'New passwords do not match' });
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, errors));
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
};
