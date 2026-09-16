const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
} = require('../validators/authValidator');

// Public routes
router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);

// Protected routes (Requires valid JWT Bearer token)
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, validateUpdateProfile, authController.updateProfile);
router.put('/change-password', protect, validateChangePassword, authController.changePassword);

module.exports = router;
