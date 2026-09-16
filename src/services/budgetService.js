const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const AppError = require('../utils/appError');
const { HTTP_STATUS } = require('../constants');
const { roundMoney, calculateUsagePercentage } = require('../utils/money');

class BudgetService {
  /**
   * Helper to get start and end dates of a specific month and year
   */
  getMonthDateRange(month, year) {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    // Day 0 of next month is the last day of the current month
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { startDate, endDate };
  }

  /**
   * Create or set a budget for a category and month
   */
  async createBudget(userId, { categoryId, amount, month, year }) {
    const category = await Category.findOne({
      _id: categoryId,
      $or: [{ userId: null }, { userId }],
      type: 'expense',
    });

    if (!category) {
      throw new AppError('Invalid expense category for budget', HTTP_STATUS.BAD_REQUEST);
    }

    const { startDate, endDate } = this.getMonthDateRange(month, year);

    // Check if budget already exists for this category/month/year
    const existing = await Budget.findOne({ userId, categoryId, month, year });
    if (existing) {
      throw new AppError(
        'A budget for this category and month already exists. Please update the existing budget instead.',
        HTTP_STATUS.CONFLICT
      );
    }

    const budget = await Budget.create({
      userId,
      categoryId,
      amount: roundMoney(amount),
      month,
      year,
      startDate,
      endDate,
    });

    return await budget.populate('categoryId', 'name color icon');
  }

  /**
   * Get all budgets for a given month & year with live computed spending metrics
   */
  async getBudgets(userId, query) {
    const now = new Date();
    const month = parseInt(query.month, 10) || now.getMonth() + 1;
    const year = parseInt(query.year, 10) || now.getFullYear();

    const { startDate, endDate } = this.getMonthDateRange(month, year);

    // Fetch all budgets for this user in this month/year
    const budgets = await Budget.find({ userId, month, year })
      .populate('categoryId', 'name color icon')
      .sort({ amount: -1 });

    // Aggregate expenses for this user in this date range grouped by categoryId
    const expensesByCategory = await Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    // Build lookup map for fast O(1) matching
    const expenseMap = new Map();
    expensesByCategory.forEach((item) => {
      expenseMap.set(item._id.toString(), {
        totalSpent: roundMoney(item.totalSpent),
        count: item.transactionCount,
      });
    });

    // Compute progress and over-budget status for each budget
    let totalBudgeted = 0;
    let totalSpentInBudgets = 0;

    const computedBudgets = budgets.map((b) => {
      const catId = b.categoryId?._id ? b.categoryId._id.toString() : b.categoryId.toString();
      const expenseData = expenseMap.get(catId) || { totalSpent: 0, count: 0 };
      const spent = expenseData.totalSpent;
      const budgetAmount = roundMoney(b.amount);
      const remaining = roundMoney(budgetAmount - spent);
      const usagePercentage = calculateUsagePercentage(spent, budgetAmount);

      totalBudgeted = roundMoney(totalBudgeted + budgetAmount);
      totalSpentInBudgets = roundMoney(totalSpentInBudgets + spent);

      return {
        _id: b._id,
        category: b.categoryId,
        amount: budgetAmount,
        spentAmount: spent,
        remainingAmount: remaining,
        usagePercentage,
        isOverBudget: spent > budgetAmount,
        isNearLimit: usagePercentage >= 80 && spent <= budgetAmount,
        month: b.month,
        year: b.year,
        startDate: b.startDate,
        endDate: b.endDate,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      };
    });

    return {
      month,
      year,
      summary: {
        totalBudgeted,
        totalSpentInBudgets,
        totalRemaining: roundMoney(totalBudgeted - totalSpentInBudgets),
        overallUsagePercentage: calculateUsagePercentage(totalSpentInBudgets, totalBudgeted),
      },
      budgets: computedBudgets,
    };
  }

  /**
   * Get single budget by ID with computed metrics
   */
  async getBudgetById(userId, budgetId) {
    const budget = await Budget.findOne({ _id: budgetId, userId }).populate('categoryId', 'name color icon');
    if (!budget) {
      throw new AppError('Budget not found', HTTP_STATUS.NOT_FOUND);
    }

    const expenseAgg = await Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          categoryId: budget.categoryId._id,
          date: { $gte: budget.startDate, $lte: budget.endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const spent = expenseAgg.length > 0 ? roundMoney(expenseAgg[0].totalSpent) : 0;
    const budgetAmount = roundMoney(budget.amount);
    const remaining = roundMoney(budgetAmount - spent);
    const usagePercentage = calculateUsagePercentage(spent, budgetAmount);

    return {
      ...budget.toObject(),
      spentAmount: spent,
      remainingAmount: remaining,
      usagePercentage,
      isOverBudget: spent > budgetAmount,
      isNearLimit: usagePercentage >= 80 && spent <= budgetAmount,
    };
  }

  /**
   * Update budget amount
   */
  async updateBudget(userId, budgetId, { amount }) {
    const budget = await Budget.findOne({ _id: budgetId, userId });
    if (!budget) {
      throw new AppError('Budget not found or access denied', HTTP_STATUS.NOT_FOUND);
    }

    if (amount !== undefined) {
      budget.amount = roundMoney(amount);
    }

    await budget.save();
    return await this.getBudgetById(userId, budget._id);
  }

  /**
   * Delete budget
   */
  async deleteBudget(userId, budgetId) {
    const budget = await Budget.findOneAndDelete({ _id: budgetId, userId });
    if (!budget) {
      throw new AppError('Budget not found or access denied', HTTP_STATUS.NOT_FOUND);
    }
    return { success: true };
  }
}

module.exports = new BudgetService();
