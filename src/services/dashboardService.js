const mongoose = require('mongoose');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const { roundMoney, calculateUsagePercentage } = require('../utils/money');

class DashboardService {
  /**
   * Helper to get start and end dates of current and previous months
   */
  getMonthBounds() {
    const now = new Date();
    
    // Current month bounds (UTC)
    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
    const currentMonthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

    // Previous month bounds (UTC)
    const lastMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0));
    const lastMonthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999));

    return { currentMonthStart, currentMonthEnd, lastMonthStart, lastMonthEnd };
  }

  /**
   * Get lifetime and monthly financial KPI summary
   */
  async getSummary(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { currentMonthStart, currentMonthEnd, lastMonthStart, lastMonthEnd } = this.getMonthBounds();

    // Aggregate lifetime totals
    const [lifetimeIncomeAgg, lifetimeExpenseAgg] = await Promise.all([
      Income.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalIncome = lifetimeIncomeAgg.length > 0 ? roundMoney(lifetimeIncomeAgg[0].total) : 0;
    const totalExpenses = lifetimeExpenseAgg.length > 0 ? roundMoney(lifetimeExpenseAgg[0].total) : 0;
    const currentBalance = roundMoney(totalIncome - totalExpenses);
    const totalSavings = currentBalance; // Savings = Income - Expenses
    const savingsRate = totalIncome > 0 ? calculateUsagePercentage(totalSavings, totalIncome) : 0;

    // Aggregate current month metrics
    const [thisMonthIncomeAgg, thisMonthExpenseAgg] = await Promise.all([
      Income.aggregate([
        { $match: { userId: userObjectId, date: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { userId: userObjectId, date: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const thisMonthIncome = thisMonthIncomeAgg.length > 0 ? roundMoney(thisMonthIncomeAgg[0].total) : 0;
    const thisMonthExpenses = thisMonthExpenseAgg.length > 0 ? roundMoney(thisMonthExpenseAgg[0].total) : 0;
    const thisMonthSavings = roundMoney(thisMonthIncome - thisMonthExpenses);
    const thisMonthSavingsRate = thisMonthIncome > 0 ? calculateUsagePercentage(thisMonthSavings, thisMonthIncome) : 0;

    // Aggregate previous month metrics for trend comparison
    const [lastMonthIncomeAgg, lastMonthExpenseAgg] = await Promise.all([
      Income.aggregate([
        { $match: { userId: userObjectId, date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { userId: userObjectId, date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const lastMonthIncome = lastMonthIncomeAgg.length > 0 ? roundMoney(lastMonthIncomeAgg[0].total) : 0;
    const lastMonthExpenses = lastMonthExpenseAgg.length > 0 ? roundMoney(lastMonthExpenseAgg[0].total) : 0;

    return {
      lifetime: {
        totalIncome,
        totalExpenses,
        currentBalance,
        totalSavings,
        savingsRate,
        incomeTransactionCount: lifetimeIncomeAgg.length > 0 ? lifetimeIncomeAgg[0].count : 0,
        expenseTransactionCount: lifetimeExpenseAgg.length > 0 ? lifetimeExpenseAgg[0].count : 0,
      },
      currentMonth: {
        income: thisMonthIncome,
        expenses: thisMonthExpenses,
        savings: thisMonthSavings,
        savingsRate: thisMonthSavingsRate,
      },
      previousMonth: {
        income: lastMonthIncome,
        expenses: lastMonthExpenses,
      },
    };
  }

  /**
   * Get unified recent transaction activity feed (Income + Expenses merged and sorted)
   */
  async getRecentTransactions(userId, limit = 5) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const numLimit = Math.max(1, parseInt(limit, 10) || 5);

    const [recentIncomes, recentExpenses] = await Promise.all([
      Income.find({ userId: userObjectId })
        .populate('categoryId', 'name color icon')
        .sort({ date: -1 })
        .limit(numLimit)
        .lean(),
      Expense.find({ userId: userObjectId })
        .populate('categoryId', 'name color icon')
        .sort({ date: -1 })
        .limit(numLimit)
        .lean(),
    ]);

    // Tag records with transaction type and merge
    const taggedIncomes = recentIncomes.map((item) => ({
      ...item,
      type: 'income',
      category: item.categoryId,
    }));

    const taggedExpenses = recentExpenses.map((item) => ({
      ...item,
      type: 'expense',
      category: item.categoryId,
    }));

    const merged = [...taggedIncomes, ...taggedExpenses];
    merged.sort((a, b) => new Date(b.date) - new Date(a.date));

    return merged.slice(0, numLimit);
  }

  /**
   * Get multi-month trend chart data and current month category breakdown
   */
  async getDashboardCharts(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();

    // 1. Calculate past 6 months monthly trend
    const trendMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
      const start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999));
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

      trendMonths.push({
        label,
        monthNum: d.getMonth() + 1,
        year: d.getFullYear(),
        startDate: start,
        endDate: end,
      });
    }

    const trendData = await Promise.all(
      trendMonths.map(async (m) => {
        const [incAgg, expAgg] = await Promise.all([
          Income.aggregate([
            { $match: { userId: userObjectId, date: { $gte: m.startDate, $lte: m.endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
          Expense.aggregate([
            { $match: { userId: userObjectId, date: { $gte: m.startDate, $lte: m.endDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
        ]);

        const income = incAgg.length > 0 ? roundMoney(incAgg[0].total) : 0;
        const expenses = expAgg.length > 0 ? roundMoney(expAgg[0].total) : 0;
        const savings = roundMoney(income - expenses);

        return {
          month: m.label,
          income,
          expenses,
          savings,
        };
      })
    );

    // 2. Current Month Expense Category Breakdown for Pie/Donut charts
    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
    const currentMonthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

    const categoryAgg = await Expense.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: currentMonthStart, $lte: currentMonthEnd },
        },
      },
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
          as: 'categoryDetails',
        },
      },
      { $unwind: '$categoryDetails' },
      { $sort: { totalAmount: -1 } },
    ]);

    const totalCurrentMonthExpenses = categoryAgg.reduce((sum, item) => sum + item.totalAmount, 0);

    const expenseCategories = categoryAgg.map((item) => {
      const amount = roundMoney(item.totalAmount);
      return {
        categoryId: item._id,
        name: item.categoryDetails.name,
        color: item.categoryDetails.color || '#64748b',
        icon: item.categoryDetails.icon || 'Tag',
        amount,
        count: item.count,
        percentage: calculateUsagePercentage(amount, totalCurrentMonthExpenses),
      };
    });

    return {
      trends: trendData,
      expenseCategories,
      totalCurrentMonthExpenses: roundMoney(totalCurrentMonthExpenses),
    };
  }
}

module.exports = new DashboardService();
