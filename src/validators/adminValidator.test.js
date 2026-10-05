const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateUserQuery,
  validateUpdateUser,
  validateUpdateStatus,
  validateResetPassword,
} = require('./adminValidator');

function run(middleware, { body = {}, query = {} } = {}) {
  return new Promise((resolve) => {
    const req = { body, query };
    const next = (err) => resolve(err || null);
    middleware(req, {}, next);
  });
}

describe('adminValidator', () => {
  it('validates user status payload must be ACTIVE or INACTIVE', async () => {
    const invalidErr = await run(validateUpdateStatus, { body: { status: 'PENDING' } });
    assert.ok(invalidErr);
    assert.equal(invalidErr.statusCode, 400);

    const validActive = await run(validateUpdateStatus, { body: { status: 'ACTIVE' } });
    assert.equal(validActive, null);

    const validInactive = await run(validateUpdateStatus, { body: { status: 'INACTIVE' } });
    assert.equal(validInactive, null);
  });

  it('validates admin password reset payload', async () => {
    const shortErr = await run(validateResetPassword, { body: { newPassword: '123' } });
    assert.ok(shortErr);
    assert.equal(shortErr.statusCode, 400);

    const validErr = await run(validateResetPassword, { body: { newPassword: 'ValidAdminPass123' } });
    assert.equal(validErr, null);
  });

  it('validates query parameters for user list', async () => {
    const invalidStatusErr = await run(validateUserQuery, { query: { status: 'UNKNOWN' } });
    assert.ok(invalidStatusErr);
    assert.equal(invalidStatusErr.statusCode, 400);

    const invalidRoleErr = await run(validateUserQuery, { query: { role: 'SUPERUSER' } });
    assert.ok(invalidRoleErr);
    assert.equal(invalidRoleErr.statusCode, 400);

    const validQuery = await run(validateUserQuery, {
      query: { page: '1', limit: '20', status: 'ACTIVE', role: 'ADMIN', sortOrder: 'asc' },
    });
    assert.equal(validQuery, null);
  });

  it('validates user update payload', async () => {
    const invalidEmail = await run(validateUpdateUser, { body: { email: 'not-an-email' } });
    assert.ok(invalidEmail);
    assert.equal(invalidEmail.statusCode, 400);

    const invalidRole = await run(validateUpdateUser, { body: { role: 'GUEST' } });
    assert.ok(invalidRole);

    const validUpdate = await run(validateUpdateUser, {
      body: { fullName: 'Jane Doe', email: 'jane@example.com', role: 'ADMIN', currency: 'EUR' },
    });
    assert.equal(validUpdate, null);
  });
});
