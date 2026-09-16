const { roundMoney } = require('./money');

const optionalNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const applyAmountRange = (filter, minAmount, maxAmount) => {
  const min = optionalNumber(minAmount);
  const max = optionalNumber(maxAmount);
  if (min === undefined && max === undefined) return;
  filter.amount = {};
  if (min !== undefined) filter.amount.$gte = roundMoney(min);
  if (max !== undefined) filter.amount.$lte = roundMoney(max);
};

const applyRecurringFilter = (filter, isRecurring) => {
  if (isRecurring === undefined || isRecurring === null || isRecurring === '') return;
  if (isRecurring === true || isRecurring === 'true' || isRecurring === '1') {
    filter.isRecurring = true;
  } else if (isRecurring === false || isRecurring === 'false' || isRecurring === '0') {
    filter.isRecurring = false;
  }
};

module.exports = {
  optionalNumber,
  applyAmountRange,
  applyRecurringFilter,
};
