const { HTTP_STATUS } = require('../constants');
const { sendError } = require('../utils/apiResponse');

/**
 * Centralized error handler middleware.
 * Handles AppErrors, Mongoose validation errors, CastErrors (invalid ObjectIds), and duplicate key errors.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Mongoose Validation Error (e.g. required fields, enum mismatch, min/max limits)
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message,
    }));
  }

  // Mongoose CastError (e.g. invalid MongoDB ObjectId format)
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Invalid format for field: ${err.path}`;
    errors = [{ field: err.path, message: `Value '${err.value}' is not a valid identifier.` }];
  }

  // MongoDB Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const duplicatedFields = Object.keys(err.keyValue || {});
    const fieldName = duplicatedFields.join(', ');
    message = `Duplicate record found for ${fieldName}. Please use a unique value.`;
    errors = duplicatedFields.map((field) => ({
      field,
      message: `${field} must be unique.`,
    }));
  }

  // JWT Token Invalid / Expired Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid authentication token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Your session has expired. Please log in again.';
  }

  // Log non-operational / unexpected 500 errors for internal server debugging
  if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    console.error('[Unhandled Server Error]', err);
  }

  return sendError(res, message, statusCode, errors);
};

module.exports = errorHandler;
