const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

// All report endpoints require authentication
router.use(protect);

router.get('/overview', reportController.getOverviewReport);
router.get('/category-breakdown', reportController.getCategoryBreakdown);
router.get('/trends', reportController.getMonthlyTrends);
router.get('/income-sources', reportController.getIncomeBySource);
router.get('/payment-methods', reportController.getPaymentMethodBreakdown);
router.get('/budgets', reportController.getBudgetPerformance);

module.exports = router;
