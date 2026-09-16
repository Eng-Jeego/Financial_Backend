const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// All dashboard endpoints require authentication
router.use(protect);

router.get('/summary', dashboardController.getSummary);
router.get('/monthly-summary', dashboardController.getSummary);
router.get('/recent', dashboardController.getRecentTransactions);
router.get('/recent-transactions', dashboardController.getRecentTransactions);
router.get('/charts', dashboardController.getCharts);

module.exports = router;
