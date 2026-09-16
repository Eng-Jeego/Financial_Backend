const { HTTP_STATUS } = require('../constants');

/**
 * Standard Success Response Helper
 */
const sendSuccess = (res, data = {}, message = 'Operation successful', statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard Paginated Response Helper
 */
const sendPaginated = (res, { data, page, limit, totalItems, message = 'Data retrieved successfully' }) => {
  const currentPage = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 10;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  });
};

/**
 * Standard Error Response Helper
 */
const sendError = (res, message = 'Internal server error', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors],
  });
};

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError,
};
