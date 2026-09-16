const Expense = require('../models/Expense');
const Category = require('../models/Category');
const AppError = require('../utils/appError');
const { HTTP_STATUS } = require('../constants');
const { roundMoney } = require('../utils/money');
const { applyAmountRange, applyRecurringFilter } = require('../utils/queryFilters');

class ExpenseService {
  /**
   * Create a new expense record
   */
  async createExpense(userId, data) {
    const { amount, categoryId, date, description, paymentMethod, isRecurring, recurringFrequency } = data;

    // Verify category exists and is valid for this user
    const category = await Category.findOne({
      _id: categoryId,
      $or: [{ userId: null }, { userId }],
      type: 'expense',
    });

    if (!category) {
      throw new AppError('Invalid expense category selected', HTTP_STATUS.BAD_REQUEST, [
        { field: 'categoryId', message: 'Category not found or does not belong to expense type' },
      ]);
    }

    const expense = await Expense.create({
      userId,
      amount: roundMoney(amount),
      categoryId,
      date: new Date(date),
      description: description ? description.trim() : '',
      paymentMethod: paymentMethod || 'Card',
      isRecurring: Boolean(isRecurring),
      recurringFrequency: isRecurring ? recurringFrequency || 'monthly' : 'none',
    });

    return await expense.populate('categoryId', 'name color icon');
  }

  /**
   * Get paginated and filtered expense records for a user
   */
  async getExpenses(userId, query) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      paymentMethod,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      isRecurring,
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;

    const filter = { userId };

    if (search) {
      const matchingCats = await Category.find({
        $or: [{ userId: null }, { userId }],
        type: 'expense',
        name: { $regex: search, $options: 'i' },
      }).select('_id');
      const categoryIds = matchingCats.map((cat) => cat._id);
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        ...(categoryIds.length ? [{ categoryId: { $in: categoryIds } }] : []),
      ];
    }

    // Category filter
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Payment method filter
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    applyAmountRange(filter, minAmount, maxAmount);
    applyRecurringFilter(filter, isRecurring);

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (currentPage - 1) * pageSize;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [expenses, totalItems] = await Promise.all([
      Expense.find(filter)
        .populate('categoryId', 'name color icon')
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize),
      Expense.countDocuments(filter),
    ]);

    return {
      expenses,
      totalItems,
      page: currentPage,
      limit: pageSize,
    };
  }

  /**
   * Get single expense record by ID
   */
  async getExpenseById(userId, expenseId) {
    const expense = await Expense.findOne({ _id: expenseId, userId }).populate('categoryId', 'name color icon');
    if (!expense) {
      throw new AppError('Expense record not found', HTTP_STATUS.NOT_FOUND);
    }
    return expense;
  }

  /**
   * Update expense record
   */
  async updateExpense(userId, expenseId, data) {
    const expense = await Expense.findOne({ _id: expenseId, userId });
    if (!expense) {
      throw new AppError('Expense record not found or access denied', HTTP_STATUS.NOT_FOUND);
    }

    if (data.categoryId) {
      const category = await Category.findOne({
        _id: data.categoryId,
        $or: [{ userId: null }, { userId }],
        type: 'expense',
      });
      if (!category) {
        throw new AppError('Invalid expense category selected', HTTP_STATUS.BAD_REQUEST);
      }
      expense.categoryId = data.categoryId;
    }

    if (data.amount !== undefined) expense.amount = roundMoney(data.amount);
    if (data.paymentMethod) expense.paymentMethod = data.paymentMethod;
    if (data.date) expense.date = new Date(data.date);
    if (data.description !== undefined) expense.description = data.description.trim();
    if (data.isRecurring !== undefined) {
      expense.isRecurring = Boolean(data.isRecurring);
      expense.recurringFrequency = data.isRecurring ? data.recurringFrequency || 'monthly' : 'none';
    }

    await expense.save();
    return await expense.populate('categoryId', 'name color icon');
  }

  /**
   * Delete expense record
   */
  async deleteExpense(userId, expenseId) {
    const expense = await Expense.findOneAndDelete({ _id: expenseId, userId });
    if (!expense) {
      throw new AppError('Expense record not found or access denied', HTTP_STATUS.NOT_FOUND);
    }
    return { success: true };
  }
}

module.exports = new ExpenseService();
