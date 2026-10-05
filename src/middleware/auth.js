const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const AppError = require('../utils/appError');
const { HTTP_STATUS } = require('../constants');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protects private API routes by verifying JWT token from the Authorization header.
 * Attaches the authenticated user document to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError(
        'Access denied. No authentication token provided.',
        HTTP_STATUS.UNAUTHORIZED
      )
    );
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Find user in database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(
        new AppError(
          'The user belonging to this token no longer exists.',
          HTTP_STATUS.UNAUTHORIZED
        )
      );
    }

    // Check if user account is deactivated
    if (user.status === 'INACTIVE') {
      return next(
        new AppError(
          'Your account has been deactivated. Please contact an administrator.',
          HTTP_STATUS.FORBIDDEN
        )
      );
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(
        new AppError('Your session has expired. Please log in again.', HTTP_STATUS.UNAUTHORIZED)
      );
    }
    return next(
      new AppError('Invalid authentication token. Please log in again.', HTTP_STATUS.UNAUTHORIZED)
    );
  }
});

module.exports = {
  protect,
};
