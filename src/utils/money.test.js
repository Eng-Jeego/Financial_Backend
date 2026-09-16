const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { roundMoney, calculateUsagePercentage } = require('./money');

describe('roundMoney', () => {
  it('rounds to two decimal places', () => {
    assert.equal(roundMoney(10.126), 10.13);
    assert.equal(roundMoney(10.124), 10.12);
  });

  it('treats invalid values as zero', () => {
    assert.equal(roundMoney(null), 0);
    assert.equal(roundMoney(undefined), 0);
    assert.equal(roundMoney('abc'), 0);
  });

  it('parses numeric strings', () => {
    assert.equal(roundMoney('12.345'), 12.35);
  });
});

describe('calculateUsagePercentage', () => {
  it('returns 80 for 120 of 150', () => {
    assert.equal(calculateUsagePercentage(120, 150), 80);
  });

  it('returns 0 when budget is zero and nothing is spent', () => {
    assert.equal(calculateUsagePercentage(0, 0), 0);
  });

  it('returns 100 when budget is zero but spending exists', () => {
    assert.equal(calculateUsagePercentage(20, 0), 100);
  });
});
