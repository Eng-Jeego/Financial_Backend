const adminService = require('../services/adminService');
const auditLogService = require('../services/auditLogService');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../constants');

/**
 * @desc    Get system-wide admin dashboard statistics & charts
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
const getDashboard = asyncHandler(async (req, res) => {
  const data = await adminService.getDashboard();
  return sendSuccess(res, data, 'Admin dashboard statistics retrieved successfully', HTTP_STATUS.OK);
});

/**
 * @desc    Get paginated, searchable, and filterable list of users
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, search, status, role, sortBy, sortOrder } = req.query;
  const result = await adminService.getUsers({
    page,
    limit,
    search,
    status,
    role,
    sortBy,
    sortOrder,
  });
  return sendSuccess(res, result, 'Users retrieved successfully', HTTP_STATUS.OK);
});

/**
 * @desc    Admin explicitly creates a new user account
 * @route   POST /api/admin/users
 * @access  Private (Admin only)
 */
const createUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, status, currency } = req.body;
  const user = await adminService.createUser(req.user, {
    fullName,
    email,
    password,
    role,
    status,
    currency,
  });
  return sendSuccess(res, { user }, 'User account created successfully', HTTP_STATUS.CREATED);
});

/**
 * @desc    Get user details with financial overview and transaction history
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;
  const result = await adminService.getUserById(req.user, id, { startDate, endDate });
  return sendSuccess(res, result, 'User details retrieved successfully', HTTP_STATUS.OK);
});

/**
 * @desc    Edit user profile details and role
 * @route   PATCH /api/admin/users/:id
 * @access  Private (Admin only)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, email, role, currency } = req.body;
  const updatedUser = await adminService.updateUser(req.user, id, {
    fullName,
    email,
    role,
    currency,
  });
  return sendSuccess(res, { user: updatedUser }, 'User updated successfully', HTTP_STATUS.OK);
});

/**
 * @desc    Update user status (ACTIVE / INACTIVE)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (Admin only)
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updatedUser = await adminService.updateUserStatus(req.user, id, status);
  return sendSuccess(
    res,
    { user: updatedUser },
    `User account status updated to ${status.toUpperCase()} successfully`,
    HTTP_STATUS.OK
  );
});

/**
 * @desc    Admin reset of a user's password
 * @route   POST /api/admin/users/:id/reset-password
 * @access  Private (Admin only)
 */
const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const result = await adminService.resetUserPassword(req.user, id, newPassword);
  return sendSuccess(res, result, 'User password reset successfully', HTTP_STATUS.OK);
});

/**
 * @desc    Delete a user account and associated data
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin only)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await adminService.deleteUser(req.user, id);
  return sendSuccess(res, result, 'User deleted successfully', HTTP_STATUS.OK);
});

/**
 * @desc    Get admin audit logs with filtering and pagination
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin only)
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, action, adminId, targetUserId, search } = req.query;
  const result = await auditLogService.getAuditLogs({
    page,
    limit,
    action,
    adminId,
    targetUserId,
    search,
  });
  return sendSuccess(res, result, 'Audit logs retrieved successfully', HTTP_STATUS.OK);
});

/**
 * @desc    Get system-wide financial and user reports
 * @route   GET /api/admin/reports
 * @access  Private (Admin only)
 */
const getReports = asyncHandler(async (req, res) => {
  const result = await adminService.getReports();
  return sendSuccess(res, result, 'System reports retrieved successfully', HTTP_STATUS.OK);
});

module.exports = {
  getDashboard,
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus,
  resetUserPassword,
  deleteUser,
  getAuditLogs,
  getReports,
};
