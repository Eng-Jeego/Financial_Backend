/**
 * Safely rounds a number to 2 decimal places to prevent IEEE 754 floating-point inaccuracies.
 * Uses Number.EPSILON to handle floating point edge cases correctly.
 */
const roundMoney = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates budget usage percentage safely, avoiding division by zero.
 */
const calculateUsagePercentage = (spent, budget) => {
  const safeSpent = roundMoney(spent);
  const safeBudget = roundMoney(budget);
  if (safeBudget <= 0) {
    return safeSpent > 0 ? 100 : 0;
  }
  return roundMoney((safeSpent / safeBudget) * 100);
};

module.exports = {
  roundMoney,
  calculateUsagePercentage,
};
