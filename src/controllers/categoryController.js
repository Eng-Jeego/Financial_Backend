const categoryService = require('../services/categoryService');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { HTTP_STATUS } = require('../constants');

/**
 * @desc    Get all categories for current user (defaults + custom)
 * @route   GET /api/categories
 * @access  Private
 */
const getCategories = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const categories = await categoryService.getCategories(req.user.id, type);
  return sendSuccess(res, { categories }, 'Categories retrieved successfully');
});

/**
 * @desc    Create a custom category
 * @route   POST /api/categories
 * @access  Private
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, type, color, icon } = req.body;
  const category = await categoryService.createCategory(req.user.id, { name, type, color, icon });
  return sendSuccess(res, { category }, 'Category created successfully', HTTP_STATUS.CREATED);
});

/**
 * @desc    Update a custom category
 * @route   PUT /api/categories/:id
 * @access  Private
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { name, color, icon } = req.body;
  const category = await categoryService.updateCategory(req.user.id, req.params.id, { name, color, icon });
  return sendSuccess(res, { category }, 'Category updated successfully');
});

/**
 * @desc    Delete a custom category
 * @route   DELETE /api/categories/:id
 * @access  Private
 */
const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.user.id, req.params.id);
  return sendSuccess(res, {}, 'Category deleted successfully');
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
