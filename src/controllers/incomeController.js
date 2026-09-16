const incomeService = require('../services/incomeService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../constants');

/**
 * @desc    Create income record
 * @route   POST /api/incomes
 * @access  Private
 */
const createIncome = asyncHandler(async (req, res) => {
  const income = await incomeService.createIncome(req.user.id, req.body);
  return sendSuccess(res, { income }, 'Income recorded successfully', HTTP_STATUS.CREATED);
});

/**
 * @desc    Get paginated and filtered income records
 * @route   GET /api/incomes
 * @access  Private
 */
const getIncomes = asyncHandler(async (req, res) => {
  const result = await incomeService.getIncomes(req.user.id, req.query);
  return sendPaginated(res, {
    data: result.incomes,
    page: result.page,
    limit: result.limit,
    totalItems: result.totalItems,
    message: 'Income records retrieved successfully',
  });
});

/**
 * @desc    Get single income record
 * @route   GET /api/incomes/:id
 * @access  Private
 */
const getIncomeById = asyncHandler(async (req, res) => {
  const income = await incomeService.getIncomeById(req.user.id, req.params.id);
  return sendSuccess(res, { income }, 'Income record retrieved successfully');
});

/**
 * @desc    Update income record
 * @route   PUT /api/incomes/:id
 * @access  Private
 */
const updateIncome = asyncHandler(async (req, res) => {
  const income = await incomeService.updateIncome(req.user.id, req.params.id, req.body);
  return sendSuccess(res, { income }, 'Income record updated successfully');
});

/**
 * @desc    Delete income record
 * @route   DELETE /api/incomes/:id
 * @access  Private
 */
const deleteIncome = asyncHandler(async (req, res) => {
  await incomeService.deleteIncome(req.user.id, req.params.id);
  return sendSuccess(res, {}, 'Income record deleted successfully');
});

module.exports = {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
};
