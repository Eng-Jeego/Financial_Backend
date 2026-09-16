const reportService = require('../services/reportService');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get overall financial report for selected period
 * @route   GET /api/reports/overview
 * @access  Private
 */
const getOverviewReport = asyncHandler(async (req, res) => {
  const data = await reportService.getOverviewReport(req.user.id, req.query);
  return sendSuccess(res, data, 'Overview report generated successfully');
});

/**
 * @desc    Get category distribution breakdown (income or expense)
 * @route   GET /api/reports/category-breakdown
 * @access  Private
 */
const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const data = await reportService.getCategoryBreakdown(req.user.id, req.query);
  return sendSuccess(res, data, 'Category breakdown report generated successfully');
});

/**
 * @desc    Get 12-month annual trends for a specific year
 * @route   GET /api/reports/trends
 * @access  Private
 */
const getMonthlyTrends = asyncHandler(async (req, res) => {
  const data = await reportService.getMonthlyTrends(req.user.id, req.query);
  return sendSuccess(res, data, 'Monthly trends report generated successfully');
});

/**
 * @desc    Get income by source breakdown
 * @route   GET /api/reports/income-sources
 * @access  Private
 */
const getIncomeBySource = asyncHandler(async (req, res) => {
  const data = await reportService.getIncomeBySource(req.user.id, req.query);
  return sendSuccess(res, data, 'Income sources report generated successfully');
});

/**
 * @desc    Get expense by payment method breakdown
 * @route   GET /api/reports/payment-methods
 * @access  Private
 */
const getPaymentMethodBreakdown = asyncHandler(async (req, res) => {
  const data = await reportService.getPaymentMethodBreakdown(req.user.id, req.query);
  return sendSuccess(res, data, 'Payment methods report generated successfully');
});

/**
 * @desc    Budget vs spent for the month covering the selected report period
 * @route   GET /api/reports/budgets
 * @access  Private
 */
const getBudgetPerformance = asyncHandler(async (req, res) => {
  const data = await reportService.getBudgetPerformance(req.user.id, req.query);
  return sendSuccess(res, data, 'Budget performance report generated successfully');
});

module.exports = {
  getOverviewReport,
  getCategoryBreakdown,
  getMonthlyTrends,
  getIncomeBySource,
  getPaymentMethodBreakdown,
  getBudgetPerformance,
};
