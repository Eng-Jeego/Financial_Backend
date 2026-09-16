const { HTTP_STATUS } = require('../constants');

class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // Operational error: predictable, trusted error

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
