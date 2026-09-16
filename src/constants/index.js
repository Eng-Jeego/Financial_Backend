const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

const CATEGORY_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
};

const RECURRING_FREQUENCIES = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Card', 'Mobile Money', 'Other'];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', type: 'income', color: '#10b981', icon: 'Briefcase' },
  { name: 'Business', type: 'income', color: '#059669', icon: 'Building2' },
  { name: 'Freelance', type: 'income', color: '#3b82f6', icon: 'Laptop' },
  { name: 'Investments', type: 'income', color: '#8b5cf6', icon: 'TrendingUp' },
  { name: 'Commission', type: 'income', color: '#ec4899', icon: 'BadgePercent' },
  { name: 'Rental', type: 'income', color: '#f59e0b', icon: 'Home' },
  { name: 'Gifts', type: 'income', color: '#06b6d4', icon: 'Gift' },
  { name: 'Other Income', type: 'income', color: '#64748b', icon: 'Coins' },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: 'Utensils' },
  { name: 'Rent & Housing', type: 'expense', color: '#f97316', icon: 'Home' },
  { name: 'Transport', type: 'expense', color: '#f59e0b', icon: 'Car' },
  { name: 'Utilities', type: 'expense', color: '#eab308', icon: 'Zap' },
  { name: 'Internet & Phone', type: 'expense', color: '#84cc16', icon: 'Wifi' },
  { name: 'Education', type: 'expense', color: '#06b6d4', icon: 'GraduationCap' },
  { name: 'Health & Medical', type: 'expense', color: '#3b82f6', icon: 'HeartPulse' },
  { name: 'Shopping', type: 'expense', color: '#a855f7', icon: 'ShoppingBag' },
  { name: 'Entertainment', type: 'expense', color: '#ec4899', icon: 'Film' },
  { name: 'Family & Personal', type: 'expense', color: '#14b8a6', icon: 'Users' },
  { name: 'Other Expense', type: 'expense', color: '#64748b', icon: 'CircleEllipsis' },
];

module.exports = {
  HTTP_STATUS,
  CATEGORY_TYPES,
  RECURRING_FREQUENCIES,
  PAYMENT_METHODS,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
};
