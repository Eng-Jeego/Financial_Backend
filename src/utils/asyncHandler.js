/**
 * Wraps asynchronous route handlers to catch exceptions and forward them to next() error middleware.
 * Eliminates verbose try/catch blocks across controllers.
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
