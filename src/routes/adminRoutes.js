const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const {
  validateUserQuery,
  validateUpdateUser,
  validateUpdateStatus,
  validateResetPassword,
} = require('../validators/adminValidator');

// Protect all admin routes: Requires authentication AND ADMIN role
router.use(protect, authorize('ADMIN'));

// Admin Dashboard Analytics
router.get('/dashboard', adminController.getDashboard);

// User Management Routes
router.get('/users', validateUserQuery, adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id', validateUpdateUser, adminController.updateUser);
router.patch('/users/:id/status', validateUpdateStatus, adminController.updateUserStatus);
router.post('/users/:id/reset-password', validateResetPassword, adminController.resetUserPassword);
router.delete('/users/:id', adminController.deleteUser);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

// System Reports
router.get('/reports', adminController.getReports);

module.exports = router;
