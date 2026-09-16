const Category = require('../models/Category');
const { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, HTTP_STATUS } = require('../constants');
const AppError = require('../utils/appError');

class CategoryService {
  /**
   * Seed default system categories if they don't exist yet
   */
  async seedDefaultCategories() {
    const existingCount = await Category.countDocuments({ isDefault: true });
    if (existingCount === 0) {
      const defaults = [
        ...DEFAULT_INCOME_CATEGORIES.map((cat) => ({ ...cat, userId: null, isDefault: true })),
        ...DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({ ...cat, userId: null, isDefault: true })),
      ];
      await Category.insertMany(defaults);
      console.log('[Database] System default categories seeded successfully.');
    }
  }

  /**
   * Get all available categories for a user (system defaults + user custom categories)
   */
  async getCategories(userId, type) {
    const query = {
      $or: [{ userId: null }, { userId }],
    };

    if (type) {
      query.type = type;
    }

    return await Category.find(query).sort({ isDefault: -1, name: 1 });
  }

  /**
   * Create a new custom category for a user
   */
  async createCategory(userId, { name, type, color, icon }) {
    const trimmedName = name.trim();

    // Check if category already exists for this user or in system defaults
    const existing = await Category.findOne({
      $or: [
        { userId, name: trimmedName, type },
        { userId: null, name: trimmedName, type },
      ],
    });

    if (existing) {
      throw new AppError(
        `A category named "${trimmedName}" for ${type} already exists`,
        HTTP_STATUS.CONFLICT,
        [{ field: 'name', message: 'Category name already exists' }]
      );
    }

    return await Category.create({
      userId,
      name: trimmedName,
      type,
      color: color || '#64748b',
      icon: icon || 'Tag',
      isDefault: false,
    });
  }

  /**
   * Update a user's custom category
   */
  async updateCategory(userId, categoryId, { name, color, icon }) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError('Category not found', HTTP_STATUS.NOT_FOUND);
    }

    if (category.isDefault || !category.userId) {
      throw new AppError('System default categories cannot be modified', HTTP_STATUS.FORBIDDEN);
    }

    if (!category.userId.equals(userId)) {
      throw new AppError('You do not have permission to modify this category', HTTP_STATUS.FORBIDDEN);
    }

    if (name) category.name = name.trim();
    if (color) category.color = color;
    if (icon) category.icon = icon;

    await category.save();
    return category;
  }

  /**
   * Delete a user's custom category
   */
  async deleteCategory(userId, categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError('Category not found', HTTP_STATUS.NOT_FOUND);
    }

    if (category.isDefault || !category.userId) {
      throw new AppError('System default categories cannot be deleted', HTTP_STATUS.FORBIDDEN);
    }

    if (!category.userId.equals(userId)) {
      throw new AppError('You do not have permission to delete this category', HTTP_STATUS.FORBIDDEN);
    }

    await Category.findByIdAndDelete(categoryId);
    return { success: true };
  }
}

module.exports = new CategoryService();
