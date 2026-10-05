const AppError = require('../utils/appError');
const { HTTP_STATUS } = require('../constants');

/**
 * Role-based access control for future ADMIN features.
 * Usage after `protect`: router.get('/admin', protect, authorize('admin'), handler)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    const currentRole = (req.user?.role || 'USER').toUpperCase();
    const normalizedAllowedRoles = roles.map((r) => String(r).toUpperCase());
    if (!normalizedAllowedRoles.includes(currentRole)) {
      return next(
        new AppError('You do not have permission to perform this action', HTTP_STATUS.FORBIDDEN)
      );
    }
    next();
  };
};

module.exports = { authorize };
