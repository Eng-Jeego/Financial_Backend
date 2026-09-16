const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get comprehensive financial KPI summary
 * @route   GET /api/dashboard/summary
 * @access  Private
 */
const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary(req.user.id);
  return sendSuccess(res, summary, 'Dashboard summary retrieved successfully');
});

/**
 * @desc    Get merged recent transaction feed
 * @route   GET /api/dashboard/recent
 * @access  Private
 */
const getRecentTransactions = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  const transactions = await dashboardService.getRecentTransactions(req.user.id, limit);
  return sendSuccess(res, { transactions }, 'Recent transactions retrieved successfully');
});

/**
 * @desc    Get dashboard charts data (monthly trend & expense breakdown)
 * @route   GET /api/dashboard/charts
 * @access  Private
 */
const getCharts = asyncHandler(async (req, res) => {
  const charts = await dashboardService.getDashboardCharts(req.user.id);
  return sendSuccess(res, charts, 'Dashboard charts data retrieved successfully');
});

module.exports = {
  getSummary,
  getRecentTransactions,
  getCharts,
};
