const User = require('../models/User');
const AppError = require('../utils/appError');
const { HTTP_STATUS } = require('../constants');
const auditLogService = require('./auditLogService');

class AuthService {
  /**
   * Register a new user - public registration ALWAYS creates role: 'USER' and status: 'ACTIVE'
   */
  async register({ fullName, email, password, currency }) {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      throw new AppError(
        'An account with this email address already exists',
        HTTP_STATUS.CONFLICT,
        [{ field: 'email', message: 'Email address is already in use' }]
      );
    }

    // Create user (Strictly force USER role and ACTIVE status)
    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      currency: currency || 'USD',
      role: 'USER',
      status: 'ACTIVE',
    });

    // Generate JWT Token
    const token = user.generateAuthToken();

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        currency: user.currency,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Authenticate user with email and password
   */
  async login({ email, password }) {
    // Find user by email and explicitly include password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      throw new AppError(
        'Invalid email or password',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new AppError(
        'Invalid email or password',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Enforce account status: deactivated accounts cannot access the system
    if (user.status === 'INACTIVE') {
      throw new AppError(
        'Your account has been deactivated. Please contact an administrator.',
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Generate JWT Token
    const token = user.generateAuthToken();

    // Log admin login to audit log
    if (user.role && user.role.toUpperCase() === 'ADMIN') {
      await auditLogService.logAction({
        adminId: user._id,
        adminEmail: user.email,
        action: 'LOGIN',
        description: `Admin ${user.email} logged into the system`,
        metadata: { loginTime: new Date().toISOString() },
      });
    }

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        currency: user.currency,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Fetch current authenticated user profile
   */
  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (user.status === 'INACTIVE') {
      throw new AppError(
        'Your account has been deactivated. Please contact an administrator.',
        HTTP_STATUS.FORBIDDEN
      );
    }

    return user;
  }

  /**
   * Update user profile details
   */
  async updateProfile(userId, { fullName, currency }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (fullName) user.fullName = fullName.trim();
    if (currency) user.currency = currency.toUpperCase().trim();

    await user.save();
    return user;
  }

  /**
   * Change user password securely
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      throw new AppError(
        'Current password does not match',
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'currentPassword', message: 'Incorrect current password' }]
      );
    }

    user.password = newPassword;
    await user.save();

    return { success: true };
  }
}

module.exports = new AuthService();
