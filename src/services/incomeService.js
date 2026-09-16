const Income = require('../models/Income');
const Category = require('../models/Category');
const AppError = require('../utils/appError');
const { HTTP_STATUS } = require('../constants');
const { roundMoney } = require('../utils/money');
const { applyAmountRange, applyRecurringFilter } = require('../utils/queryFilters');

class IncomeService {
  /**
   * Create a new income record
   */
  async createIncome(userId, data) {
    const { amount, source, categoryId, date, description, isRecurring, recurringFrequency } = data;

    // Verify category exists and is valid for this user
    const category = await Category.findOne({
      _id: categoryId,
      $or: [{ userId: null }, { userId }],
      type: 'income',
    });

    if (!category) {
      throw new AppError('Invalid income category selected', HTTP_STATUS.BAD_REQUEST, [
        { field: 'categoryId', message: 'Category not found or does not belong to income type' },
      ]);
    }

    const income = await Income.create({
      userId,
      amount: roundMoney(amount),
      source: source.trim(),
      categoryId,
      date: new Date(date),
      description: description ? description.trim() : '',
      isRecurring: Boolean(isRecurring),
      recurringFrequency: isRecurring ? recurringFrequency || 'monthly' : 'none',
    });

    return await income.populate('categoryId', 'name color icon');
  }

  /**
   * Get paginated and filtered income records for a user
   */
  async getIncomes(userId, query) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      source,
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
        type: 'income',
        name: { $regex: search, $options: 'i' },
      }).select('_id');
      const categoryIds = matchingCats.map((cat) => cat._id);
      filter.$or = [
        { source: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        ...(categoryIds.length ? [{ categoryId: { $in: categoryIds } }] : []),
      ];
    }

    // Category filter
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Source filter
    if (source) {
      filter.source = { $regex: source, $options: 'i' };
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

    const [incomes, totalItems] = await Promise.all([
      Income.find(filter)
        .populate('categoryId', 'name color icon')
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize),
      Income.countDocuments(filter),
    ]);

    return {
      incomes,
      totalItems,
      page: currentPage,
      limit: pageSize,
    };
  }

  /**
   * Get single income record by ID
   */
  async getIncomeById(userId, incomeId) {
    const income = await Income.findOne({ _id: incomeId, userId }).populate('categoryId', 'name color icon');
    if (!income) {
      throw new AppError('Income record not found', HTTP_STATUS.NOT_FOUND);
    }
    return income;
  }

  /**
   * Update income record
   */
  async updateIncome(userId, incomeId, data) {
    const income = await Income.findOne({ _id: incomeId, userId });
    if (!income) {
      throw new AppError('Income record not found or access denied', HTTP_STATUS.NOT_FOUND);
    }

    if (data.categoryId) {
      const category = await Category.findOne({
        _id: data.categoryId,
        $or: [{ userId: null }, { userId }],
        type: 'income',
      });
      if (!category) {
        throw new AppError('Invalid income category selected', HTTP_STATUS.BAD_REQUEST);
      }
      income.categoryId = data.categoryId;
    }

    if (data.amount !== undefined) income.amount = roundMoney(data.amount);
    if (data.source) income.source = data.source.trim();
    if (data.date) income.date = new Date(data.date);
    if (data.description !== undefined) income.description = data.description.trim();
    if (data.isRecurring !== undefined) {
      income.isRecurring = Boolean(data.isRecurring);
      income.recurringFrequency = data.isRecurring ? data.recurringFrequency || 'monthly' : 'none';
    }

    await income.save();
    return await income.populate('categoryId', 'name color icon');
  }

  /**
   * Delete income record
   */
  async deleteIncome(userId, incomeId) {
    const income = await Income.findOneAndDelete({ _id: incomeId, userId });
    if (!income) {
      throw new AppError('Income record not found or access denied', HTTP_STATUS.NOT_FOUND);
    }
    return { success: true };
  }
}

module.exports = new IncomeService();
