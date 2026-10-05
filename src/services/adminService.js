const mongoose = require('mongoose');
const User = require('../models/User');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const AdminAuditLog = require('../models/AdminAuditLog');
const AppError = require('../utils/appError');
const { HTTP_STATUS } = require('../constants');
const { roundMoney, calculateUsagePercentage } = require('../utils/money');
const auditLogService = require('./auditLogService');

class AdminService {
  /**
   * Helper to get UTC month start and end dates
   */
  getMonthBounds(date = new Date()) {
    const start = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999));
    return { start, end };
  }

  /**
   * System-wide dashboard statistics & charts
   */
  async getDashboard() {
    const now = new Date();
    const currentMonthBounds = this.getMonthBounds(now);

    // 1. High-level metric counts
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsersThisMonth,
      incomeAgg,
      expenseAgg,
      totalIncomeTxCount,
      totalExpenseTxCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'ACTIVE' }),
      User.countDocuments({ status: 'INACTIVE' }),
      User.countDocuments({ createdAt: { $gte: currentMonthBounds.start, $lte: currentMonthBounds.end } }),
      Income.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Income.countDocuments(),
      Expense.countDocuments(),
    ]);

    const totalIncome = incomeAgg.length > 0 ? roundMoney(incomeAgg[0].total) : 0;
    const totalExpenses = expenseAgg.length > 0 ? roundMoney(expenseAgg[0].total) : 0;
    const totalTransactions = totalIncomeTxCount + totalExpenseTxCount;

    // 2. Multi-month trends (last 6 months) for User Growth, Income vs Expenses, and Tx Volume
    const trendMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
      const { start, end } = this.getMonthBounds(d);
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
      trendMonths.push({ label, start, end });
    }

    const [userGrowth, incomeVsExpenses, monthlyTransactionVolume] = await Promise.all([
      // User Growth
      Promise.all(
        trendMonths.map(async (m) => {
          const count = await User.countDocuments({
            createdAt: { $gte: m.start, $lte: m.end },
          });
          return { month: m.label, newUsers: count };
        })
      ),
      // System Income vs Expenses
      Promise.all(
        trendMonths.map(async (m) => {
          const [inc, exp] = await Promise.all([
            Income.aggregate([
              { $match: { date: { $gte: m.start, $lte: m.end } } },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Expense.aggregate([
              { $match: { date: { $gte: m.start, $lte: m.end } } },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
          ]);
          return {
            month: m.label,
            income: inc.length > 0 ? roundMoney(inc[0].total) : 0,
            expenses: exp.length > 0 ? roundMoney(exp[0].total) : 0,
          };
        })
      ),
      // Monthly Transaction Volume
      Promise.all(
        trendMonths.map(async (m) => {
          const [incCount, expCount] = await Promise.all([
            Income.countDocuments({ date: { $gte: m.start, $lte: m.end } }),
            Expense.countDocuments({ date: { $gte: m.start, $lte: m.end } }),
          ]);
          return {
            month: m.label,
            incomeCount: incCount,
            expenseCount: expCount,
            totalVolume: incCount + expCount,
          };
        })
      ),
    ]);

    // 3. Most used expense categories across the whole system
    const categoryAgg = await Expense.aggregate([
      {
        $group: {
          _id: '$categoryId',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $sort: { totalAmount: -1 } },
      { $limit: 6 },
    ]);

    const mostUsedExpenseCategories = categoryAgg.map((item) => ({
      categoryId: item._id,
      name: item.category ? item.category.name : 'Uncategorized',
      color: item.category?.color || '#64748b',
      icon: item.category?.icon || 'Tag',
      totalAmount: roundMoney(item.totalAmount),
      count: item.count,
    }));

    // 4. Most active users (top 5 by combined transaction count)
    const activeUsersAgg = await User.aggregate([
      {
        $lookup: {
          from: 'incomes',
          localField: '_id',
          foreignField: 'userId',
          as: 'incomes',
        },
      },
      {
        $lookup: {
          from: 'expenses',
          localField: '_id',
          foreignField: 'userId',
          as: 'expenses',
        },
      },
      {
        $project: {
          fullName: 1,
          email: 1,
          role: 1,
          status: 1,
          createdAt: 1,
          incomeCount: { $size: '$incomes' },
          expenseCount: { $size: '$expenses' },
          transactionCount: { $add: [{ $size: '$incomes' }, { $size: '$expenses' }] },
          totalIncome: { $sum: '$incomes.amount' },
          totalExpenses: { $sum: '$expenses.amount' },
        },
      },
      { $sort: { transactionCount: -1, totalIncome: -1 } },
      { $limit: 5 },
    ]);

    const mostActiveUsers = activeUsersAgg.map((u) => ({
      ...u,
      totalIncome: roundMoney(u.totalIncome || 0),
      totalExpenses: roundMoney(u.totalExpenses || 0),
    }));

    // 5. Recent Audit Logs (latest 5)
    const recentAuditLogs = await AdminAuditLog.find()
      .populate('adminId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      metrics: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsersThisMonth,
        totalIncome,
        totalExpenses,
        totalTransactions,
      },
      analytics: {
        userGrowth,
        incomeVsExpenses,
        mostUsedExpenseCategories,
        mostActiveUsers,
        monthlyTransactionVolume,
      },
      recentAuditLogs,
    };
  }

  /**
   * Paginated user list with search, status/role filter, and sorting
   */
  async getUsers({
    page = 1,
    limit = 10,
    search = '',
    status = '',
    role = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const matchConditions = {};

    if (status && ['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      matchConditions.status = status.toUpperCase();
    }

    if (role && ['USER', 'ADMIN'].includes(role.toUpperCase())) {
      matchConditions.role = role.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchConditions.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
      ];
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const allowedSortFields = [
      'createdAt',
      'fullName',
      'email',
      'role',
      'status',
      'totalIncome',
      'totalExpenses',
      'transactionCount',
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'incomes',
          localField: '_id',
          foreignField: 'userId',
          as: 'incomes',
        },
      },
      {
        $lookup: {
          from: 'expenses',
          localField: '_id',
          foreignField: 'userId',
          as: 'expenses',
        },
      },
      {
        $project: {
          fullName: 1,
          email: 1,
          role: 1,
          status: 1,
          currency: 1,
          createdAt: 1,
          updatedAt: 1,
          incomeCount: { $size: '$incomes' },
          expenseCount: { $size: '$expenses' },
          transactionCount: { $add: [{ $size: '$incomes' }, { $size: '$expenses' }] },
          totalIncome: { $sum: '$incomes.amount' },
          totalExpenses: { $sum: '$expenses.amount' },
        },
      },
      { $sort: { [sortField]: sortDirection } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          users: [{ $skip: skip }, { $limit: limitNum }],
        },
      },
    ];

    const result = await User.aggregate(pipeline);
    const total = result[0]?.metadata[0]?.total || 0;
    const rawUsers = result[0]?.users || [];

    const users = rawUsers.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      email: u.email,
      role: (u.role || 'USER').toUpperCase(),
      status: (u.status || 'ACTIVE').toUpperCase(),
      currency: u.currency || 'USD',
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      totalIncome: roundMoney(u.totalIncome || 0),
      totalExpenses: roundMoney(u.totalExpenses || 0),
      transactionCount: u.transactionCount || 0,
      incomeCount: u.incomeCount || 0,
      expenseCount: u.expenseCount || 0,
    }));

    return {
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Get single user details with lifetime & date-filtered financial summary
   */
  async getUserById(adminUser, id, { startDate, endDate }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid user ID', HTTP_STATUS.BAD_REQUEST);
    }

    const targetUser = await User.findById(id).select('-password');
    if (!targetUser) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const userObjectId = new mongoose.Types.ObjectId(id);

    // Lifetime aggregation
    const [lifetimeIncomeAgg, lifetimeExpenseAgg, budgetCount] = await Promise.all([
      Income.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Budget.countDocuments({ userId: userObjectId }),
    ]);

    const totalIncome = lifetimeIncomeAgg.length > 0 ? roundMoney(lifetimeIncomeAgg[0].total) : 0;
    const totalExpenses = lifetimeExpenseAgg.length > 0 ? roundMoney(lifetimeExpenseAgg[0].total) : 0;
    const currentBalance = roundMoney(totalIncome - totalExpenses);
    const savings = currentBalance;
    const incomeCount = lifetimeIncomeAgg.length > 0 ? lifetimeIncomeAgg[0].count : 0;
    const expenseCount = lifetimeExpenseAgg.length > 0 ? lifetimeExpenseAgg[0].count : 0;
    const transactionCount = incomeCount + expenseCount;

    // Optional date range filtering for financial activity
    const dateMatch = { userId: userObjectId };
    if (startDate || endDate) {
      dateMatch.date = {};
      if (startDate) dateMatch.date.$gte = new Date(startDate);
      if (endDate) dateMatch.date.$lte = new Date(endDate);
    }

    const [filteredIncomeAgg, filteredExpenseAgg, recentIncomes, recentExpenses] = await Promise.all([
      Income.aggregate([
        { $match: dateMatch },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: dateMatch },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Income.find(dateMatch)
        .populate('categoryId', 'name color icon')
        .sort({ date: -1 })
        .limit(10)
        .lean(),
      Expense.find(dateMatch)
        .populate('categoryId', 'name color icon')
        .sort({ date: -1 })
        .limit(10)
        .lean(),
    ]);

    const filteredIncomeTotal = filteredIncomeAgg.length > 0 ? roundMoney(filteredIncomeAgg[0].total) : 0;
    const filteredExpenseTotal = filteredExpenseAgg.length > 0 ? roundMoney(filteredExpenseAgg[0].total) : 0;

    // Audit log: Admin viewed a user profile
    await auditLogService.logAction({
      adminId: adminUser._id,
      adminEmail: adminUser.email,
      action: 'VIEW_USER',
      targetUserId: targetUser._id,
      targetUserEmail: targetUser.email,
      description: `Admin ${adminUser.email} viewed details of user ${targetUser.email}`,
    });

    return {
      user: {
        _id: targetUser._id,
        fullName: targetUser.fullName,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
        currency: targetUser.currency,
        createdAt: targetUser.createdAt,
        updatedAt: targetUser.updatedAt,
      },
      summary: {
        totalIncome,
        totalExpenses,
        currentBalance,
        savings,
        incomeCount,
        expenseCount,
        transactionCount,
        budgetCount,
      },
      filteredSummary: {
        incomeTotal: filteredIncomeTotal,
        expenseTotal: filteredExpenseTotal,
        net: roundMoney(filteredIncomeTotal - filteredExpenseTotal),
        incomeCount: filteredIncomeAgg.length > 0 ? filteredIncomeAgg[0].count : 0,
        expenseCount: filteredExpenseAgg.length > 0 ? filteredExpenseAgg[0].count : 0,
      },
      recentIncomes,
      recentExpenses,
    };
  }

  /**
   * Edit basic user profile information and role
   */
  async updateUser(adminUser, id, { fullName, email, role, currency }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid user ID', HTTP_STATUS.BAD_REQUEST);
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if demoting the last admin
    if (role && role.toUpperCase() !== 'ADMIN' && targetUser.role.toUpperCase() === 'ADMIN') {
      const activeAdminCount = await User.countDocuments({
        role: 'ADMIN',
        status: 'ACTIVE',
      });
      if (activeAdminCount <= 1) {
        throw new AppError(
          'Cannot demote the last remaining active administrator account',
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    // Check if new email is already taken
    if (email && email.toLowerCase().trim() !== targetUser.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        throw new AppError('Email address is already in use by another user', HTTP_STATUS.CONFLICT);
      }
      targetUser.email = email.toLowerCase().trim();
    }

    if (fullName) targetUser.fullName = fullName.trim();
    if (currency) targetUser.currency = currency.toUpperCase().trim();
    if (role && ['USER', 'ADMIN'].includes(role.toUpperCase())) {
      targetUser.role = role.toUpperCase();
    }

    await targetUser.save();

    await auditLogService.logAction({
      adminId: adminUser._id,
      adminEmail: adminUser.email,
      action: 'UPDATE_USER',
      targetUserId: targetUser._id,
      targetUserEmail: targetUser.email,
      description: `Admin ${adminUser.email} updated profile for user ${targetUser.email}`,
      metadata: { updatedFields: { fullName, email, role, currency } },
    });

    return targetUser;
  }

  /**
   * Activate or deactivate/suspend a user
   */
  async updateUserStatus(adminUser, id, status) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid user ID', HTTP_STATUS.BAD_REQUEST);
    }

    const normalizedStatus = (status || '').toUpperCase();
    if (!['ACTIVE', 'INACTIVE'].includes(normalizedStatus)) {
      throw new AppError('Status must be either ACTIVE or INACTIVE', HTTP_STATUS.BAD_REQUEST);
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Safeguard: Cannot deactivate the last remaining active administrator
    if (normalizedStatus === 'INACTIVE' && targetUser.role.toUpperCase() === 'ADMIN') {
      const activeAdminCount = await User.countDocuments({
        role: 'ADMIN',
        status: 'ACTIVE',
      });
      if (activeAdminCount <= 1) {
        throw new AppError(
          'Cannot deactivate the last remaining active administrator',
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    // Safeguard: Cannot deactivate own account if you are the only admin
    if (normalizedStatus === 'INACTIVE' && adminUser._id.toString() === targetUser._id.toString()) {
      const otherActiveAdminCount = await User.countDocuments({
        _id: { $ne: adminUser._id },
        role: 'ADMIN',
        status: 'ACTIVE',
      });
      if (otherActiveAdminCount < 1) {
        throw new AppError(
          'You cannot deactivate your own account without another active administrator present',
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    targetUser.status = normalizedStatus;
    await targetUser.save();

    const action = normalizedStatus === 'ACTIVE' ? 'ACTIVATE_USER' : 'DEACTIVATE_USER';
    await auditLogService.logAction({
      adminId: adminUser._id,
      adminEmail: adminUser.email,
      action,
      targetUserId: targetUser._id,
      targetUserEmail: targetUser.email,
      description: `Admin ${adminUser.email} changed status of ${targetUser.email} to ${normalizedStatus}`,
      metadata: { newStatus: normalizedStatus },
    });

    return targetUser;
  }

  /**
   * Secure admin reset of a user's password
   */
  async resetUserPassword(adminUser, id, newPassword) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid user ID', HTTP_STATUS.BAD_REQUEST);
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', HTTP_STATUS.BAD_REQUEST);
    }

    const targetUser = await User.findById(id).select('+password');
    if (!targetUser) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Updating password triggers pre-save bcrypt hash
    targetUser.password = newPassword;
    await targetUser.save();

    await auditLogService.logAction({
      adminId: adminUser._id,
      adminEmail: adminUser.email,
      action: 'RESET_PASSWORD',
      targetUserId: targetUser._id,
      targetUserEmail: targetUser.email,
      description: `Admin ${adminUser.email} reset password for user ${targetUser.email}`,
    });

    return { success: true, message: 'Password has been reset successfully' };
  }

  /**
   * Delete a user account and cascade delete associated financial records
   */
  async deleteUser(adminUser, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid user ID', HTTP_STATUS.BAD_REQUEST);
    }

    // Safeguard: Prevent deleting own account
    if (adminUser._id.toString() === id) {
      throw new AppError('You cannot delete your own administrator account', HTTP_STATUS.BAD_REQUEST);
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Safeguard: Prevent deleting the last remaining admin
    if (targetUser.role.toUpperCase() === 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) {
        throw new AppError(
          'Cannot delete the only remaining administrator account',
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    const userObjectId = new mongoose.Types.ObjectId(id);

    // Delete financial data associated with user
    await Promise.all([
      Income.deleteMany({ userId: userObjectId }),
      Expense.deleteMany({ userId: userObjectId }),
      Budget.deleteMany({ userId: userObjectId }),
      Category.deleteMany({ userId: userObjectId }),
      User.findByIdAndDelete(id),
    ]);

    await auditLogService.logAction({
      adminId: adminUser._id,
      adminEmail: adminUser.email,
      action: 'DELETE_USER',
      targetUserId: targetUser._id,
      targetUserEmail: targetUser.email,
      description: `Admin ${adminUser.email} permanently deleted user ${targetUser.email} and associated data`,
    });

    return { success: true, message: 'User and all associated data deleted successfully' };
  }

  /**
   * System-wide Reports & Analytics
   */
  async getReports() {
    const [totalUsers, totalIncomes, totalExpenses, budgetsCount] = await Promise.all([
      User.countDocuments(),
      Income.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Budget.countDocuments(),
    ]);

    const incomeTotal = totalIncomes.length > 0 ? roundMoney(totalIncomes[0].total) : 0;
    const expenseTotal = totalExpenses.length > 0 ? roundMoney(totalExpenses[0].total) : 0;

    // Category breakdown across all expenses
    const categoryBreakdown = await Expense.aggregate([
      {
        $group: {
          _id: '$categoryId',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $sort: { totalAmount: -1 } },
    ]);

    const formattedCategories = categoryBreakdown.map((cat) => ({
      name: cat.category?.name || 'Uncategorized',
      color: cat.category?.color || '#64748b',
      amount: roundMoney(cat.totalAmount),
      count: cat.count,
      percentage: expenseTotal > 0 ? calculateUsagePercentage(cat.totalAmount, expenseTotal) : 0,
    }));

    return {
      overview: {
        totalUsers,
        incomeTotal,
        expenseTotal,
        netCashflow: roundMoney(incomeTotal - expenseTotal),
        incomeTransactions: totalIncomes.length > 0 ? totalIncomes[0].count : 0,
        expenseTransactions: totalExpenses.length > 0 ? totalExpenses[0].count : 0,
        totalBudgets: budgetsCount,
      },
      categoryBreakdown: formattedCategories,
    };
  }
}

module.exports = new AdminService();
