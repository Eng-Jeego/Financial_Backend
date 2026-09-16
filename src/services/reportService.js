const mongoose = require('mongoose');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const budgetService = require('./budgetService');
const { roundMoney, calculateUsagePercentage } = require('../utils/money');

class ReportService {
  /**
   * Resolve date filter parameters (today, this_week, this_month, last_month, this_year, custom)
   */
  resolveDateRange({ period = 'this_month', startDate, endDate }) {
    const now = new Date();
    let start, end;

    switch (period) {
      case 'today':
        start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
        end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
        break;

      case 'this_week': {
        const dayOfWeek = now.getDay(); // 0 is Sunday
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0));
        end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + 6, 23, 59, 59, 999));
        break;
      }

      case 'this_month':
        start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
        end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
        break;

      case 'last_month':
        start = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0));
        end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999));
        break;

      case 'this_year':
        start = new Date(Date.UTC(now.getFullYear(), 0, 1, 0, 0, 0, 0));
        end = new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59, 999));
        break;

      case 'custom':
        start = startDate ? new Date(startDate) : new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        end = endDate ? new Date(endDate) : new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
        if (endDate && !endDate.includes('T')) {
          end.setHours(23, 59, 59, 999);
        }
        break;

      case 'all':
      default:
        start = new Date(0); // Beginning of epoch
        end = new Date(8640000000000000); // End of time
        break;
    }

    return { start, end, period };
  }

  /**
   * Get financial summary report for a selected period
   */
  async getOverviewReport(userId, query) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { start, end, period } = this.resolveDateRange(query);

    const matchQuery = {
      userId: userObjectId,
      date: { $gte: start, $lte: end },
    };

    const [incomeAgg, expenseAgg] = await Promise.all([
      Income.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' },
            maxAmount: { $max: '$amount' },
          },
        },
      ]),
      Expense.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' },
            maxAmount: { $max: '$amount' },
          },
        },
      ]),
    ]);

    const totalIncome = incomeAgg.length > 0 ? roundMoney(incomeAgg[0].totalAmount) : 0;
    const totalExpenses = expenseAgg.length > 0 ? roundMoney(expenseAgg[0].totalAmount) : 0;
    const netSavings = roundMoney(totalIncome - totalExpenses);
    const savingsRate = totalIncome > 0 ? calculateUsagePercentage(netSavings, totalIncome) : 0;

    return {
      period,
      startDate: start,
      endDate: end,
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      incomeStats: {
        count: incomeAgg.length > 0 ? incomeAgg[0].count : 0,
        average: incomeAgg.length > 0 ? roundMoney(incomeAgg[0].avgAmount) : 0,
        largest: incomeAgg.length > 0 ? roundMoney(incomeAgg[0].maxAmount) : 0,
      },
      expenseStats: {
        count: expenseAgg.length > 0 ? expenseAgg[0].count : 0,
        average: expenseAgg.length > 0 ? roundMoney(expenseAgg[0].avgAmount) : 0,
        largest: expenseAgg.length > 0 ? roundMoney(expenseAgg[0].maxAmount) : 0,
      },
    };
  }

  /**
   * Get category breakdown for either expense or income in a given period
   */
  async getCategoryBreakdown(userId, query) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const type = query.type === 'income' ? 'income' : 'expense';
    const { start, end, period } = this.resolveDateRange(query);

    const Model = type === 'income' ? Income : Expense;

    const breakdown = await Model.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: start, $lte: end },
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
          as: 'category',
        },
      },
      { $unwind: '$category' },
      { $sort: { totalAmount: -1 } },
    ]);

    const totalPeriodAmount = breakdown.reduce((sum, item) => sum + item.totalAmount, 0);

    const categories = breakdown.map((item) => {
      const amount = roundMoney(item.totalAmount);
      return {
        categoryId: item._id,
        name: item.category.name,
        color: item.category.color || '#64748b',
        icon: item.category.icon || 'Tag',
        amount,
        count: item.count,
        percentage: calculateUsagePercentage(amount, totalPeriodAmount),
      };
    });

    return {
      type,
      period,
      startDate: start,
      endDate: end,
      totalAmount: roundMoney(totalPeriodAmount),
      categories,
    };
  }

  /**
   * Get 12-month monthly trends for a specific year
   */
  async getMonthlyTrends(userId, query) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const year = parseInt(query.year, 10) || new Date().getFullYear();

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthlyData = await Promise.all(
      months.map(async (monthName, index) => {
        const start = new Date(Date.UTC(year, index, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year, index + 1, 0, 23, 59, 59, 999));

        const [incAgg, expAgg] = await Promise.all([
          Income.aggregate([
            { $match: { userId: userObjectId, date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
          Expense.aggregate([
            { $match: { userId: userObjectId, date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
        ]);

        const income = incAgg.length > 0 ? roundMoney(incAgg[0].total) : 0;
        const expenses = expAgg.length > 0 ? roundMoney(expAgg[0].total) : 0;
        const savings = roundMoney(income - expenses);

        return {
          month: monthName,
          monthIndex: index + 1,
          income,
          expenses,
          savings,
          savingsRate: income > 0 ? calculateUsagePercentage(savings, income) : 0,
        };
      })
    );

    const totalAnnualIncome = roundMoney(monthlyData.reduce((sum, m) => sum + m.income, 0));
    const totalAnnualExpenses = roundMoney(monthlyData.reduce((sum, m) => sum + m.expenses, 0));
    const totalAnnualSavings = roundMoney(totalAnnualIncome - totalAnnualExpenses);

    return {
      year,
      summary: {
        totalAnnualIncome,
        totalAnnualExpenses,
        totalAnnualSavings,
        annualSavingsRate: totalAnnualIncome > 0 ? calculateUsagePercentage(totalAnnualSavings, totalAnnualIncome) : 0,
      },
      months: monthlyData,
    };
  }

  /**
   * Get Income breakdown by source
   */
  async getIncomeBySource(userId, query) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { start, end, period } = this.resolveDateRange(query);

    const sources = await Income.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$source',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const totalIncome = sources.reduce((sum, item) => sum + item.totalAmount, 0);

    const formattedSources = sources.map((item) => {
      const amount = roundMoney(item.totalAmount);
      return {
        source: item._id,
        amount,
        count: item.count,
        percentage: calculateUsagePercentage(amount, totalIncome),
      };
    });

    return {
      period,
      totalIncome: roundMoney(totalIncome),
      sources: formattedSources,
    };
  }

  /**
   * Get Expense breakdown by payment method
   */
  async getPaymentMethodBreakdown(userId, query) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { start, end, period } = this.resolveDateRange(query);

    const methods = await Expense.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const totalExpenses = methods.reduce((sum, item) => sum + item.totalAmount, 0);

    const formattedMethods = methods.map((item) => {
      const amount = roundMoney(item.totalAmount);
      return {
        paymentMethod: item._id,
        amount,
        count: item.count,
        percentage: calculateUsagePercentage(amount, totalExpenses),
      };
    });

    return {
      period,
      totalExpenses: roundMoney(totalExpenses),
      paymentMethods: formattedMethods,
    };
  }

  /**
   * Budget performance for the month that contains the report period start.
   * Spending is still live-aggregated from expenses (not stored on the budget).
   */
  async getBudgetPerformance(userId, query) {
    const { start, period } = this.resolveDateRange(query);
    const month = start.getUTCMonth() + 1;
    const year = start.getUTCFullYear();
    const data = await budgetService.getBudgets(userId, { month, year });
    return { period, ...data };
  }
}

module.exports = new ReportService();
