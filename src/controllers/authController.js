const authService = require('../services/authService');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../constants');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, currency } = req.body;
  const result = await authService.register({ fullName, email, password, currency });
  return sendSuccess(res, result, 'Account registered successfully', HTTP_STATUS.CREATED);
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  return sendSuccess(res, result, 'Logged in successfully', HTTP_STATUS.OK);
});

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return sendSuccess(res, { user }, 'User profile retrieved successfully', HTTP_STATUS.OK);
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, currency } = req.body;
  const updatedUser = await authService.updateProfile(req.user.id, { fullName, currency });
  return sendSuccess(res, { user: updatedUser }, 'Profile updated successfully', HTTP_STATUS.OK);
});

/**
 * @desc    Change current user password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, { currentPassword, newPassword });
  return sendSuccess(res, {}, 'Password changed successfully', HTTP_STATUS.OK);
});

/**
 * @desc    Logout (stateless JWT — client must discard the token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  return sendSuccess(res, {}, 'Logged out successfully', HTTP_STATUS.OK);
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
