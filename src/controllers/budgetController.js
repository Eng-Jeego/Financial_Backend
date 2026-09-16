const budgetService = require('../services/budgetService');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../constants');

/**
 * @desc    Create a category budget
 * @route   POST /api/budgets
 * @access  Private
 */
const createBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.createBudget(req.user.id, req.body);
  return sendSuccess(res, { budget }, 'Budget created successfully', HTTP_STATUS.CREATED);
});

/**
 * @desc    Get all budgets for a month/year with computed spending metrics
 * @route   GET /api/budgets
 * @access  Private
 */
const getBudgets = asyncHandler(async (req, res) => {
  const data = await budgetService.getBudgets(req.user.id, req.query);
  return sendSuccess(res, data, 'Budgets retrieved successfully');
});

/**
 * @desc    Get single budget with computed metrics
 * @route   GET /api/budgets/:id
 * @access  Private
 */
const getBudgetById = asyncHandler(async (req, res) => {
  const budget = await budgetService.getBudgetById(req.user.id, req.params.id);
  return sendSuccess(res, { budget }, 'Budget retrieved successfully');
});

/**
 * @desc    Update budget amount
 * @route   PUT /api/budgets/:id
 * @access  Private
 */
const updateBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.updateBudget(req.user.id, req.params.id, req.body);
  return sendSuccess(res, { budget }, 'Budget updated successfully');
});

/**
 * @desc    Delete budget
 * @route   DELETE /api/budgets/:id
 * @access  Private
 */
const deleteBudget = asyncHandler(async (req, res) => {
  await budgetService.deleteBudget(req.user.id, req.params.id);
  return sendSuccess(res, {}, 'Budget deleted successfully');
});

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
};
