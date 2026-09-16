const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const reportService = require('./reportService');

describe('reportService.resolveDateRange', () => {
  it('resolves this_month to the first and last day of the current month', () => {
    const { start, end, period } = reportService.resolveDateRange({ period: 'this_month' });
    const now = new Date();
    assert.equal(period, 'this_month');
    assert.equal(start.getUTCDate(), 1);
    assert.equal(start.getUTCMonth(), now.getMonth());
    assert.ok(end.getTime() >= start.getTime());
  });

  it('resolves custom ranges', () => {
    const { start, end, period } = reportService.resolveDateRange({
      period: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    assert.equal(period, 'custom');
    assert.equal(start.getUTCFullYear(), 2026);
    assert.equal(end.getUTCMonth(), 0);
  });
});
