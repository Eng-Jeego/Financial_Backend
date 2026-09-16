const expenseService = require('../services/expenseService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../constants');

/**
 * @desc    Create expense record
 * @route   POST /api/expenses
 * @access  Private
 */
const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.user.id, req.body);
  return sendSuccess(res, { expense }, 'Expense recorded successfully', HTTP_STATUS.CREATED);
});

/**
 * @desc    Get paginated and filtered expense records
 * @route   GET /api/expenses
 * @access  Private
 */
const getExpenses = asyncHandler(async (req, res) => {
  const result = await expenseService.getExpenses(req.user.id, req.query);
  return sendPaginated(res, {
    data: result.expenses,
    page: result.page,
    limit: result.limit,
    totalItems: result.totalItems,
    message: 'Expense records retrieved successfully',
  });
});

/**
 * @desc    Get single expense record
 * @route   GET /api/expenses/:id
 * @access  Private
 */
const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await expenseService.getExpenseById(req.user.id, req.params.id);
  return sendSuccess(res, { expense }, 'Expense record retrieved successfully');
});

/**
 * @desc    Update expense record
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.updateExpense(req.user.id, req.params.id, req.body);
  return sendSuccess(res, { expense }, 'Expense record updated successfully');
});

/**
 * @desc    Delete expense record
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
const deleteExpense = asyncHandler(async (req, res) => {
  await expenseService.deleteExpense(req.user.id, req.params.id);
  return sendSuccess(res, {}, 'Expense record deleted successfully');
});

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
