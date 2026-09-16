const { HTTP_STATUS } = require('../constants');
const { sendError } = require('../utils/apiResponse');

/**
 * 404 Handler for undefined API routes
 */
const notFound = (req, res, next) => {
  return sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    HTTP_STATUS.NOT_FOUND
  );
};

module.exports = notFound;
