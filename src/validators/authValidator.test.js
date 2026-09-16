const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateRegister, validateLogin } = require('./authValidator');

function run(middleware, body) {
  return new Promise((resolve) => {
    const req = { body };
    const next = (err) => resolve(err || null);
    middleware(req, {}, next);
  });
}

describe('authValidator', () => {
  it('rejects short passwords on register', async () => {
    const err = await run(validateRegister, {
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      password: '123',
      confirmPassword: '123',
    });
    assert.ok(err);
    assert.equal(err.statusCode, 400);
  });

  it('rejects mismatched passwords', async () => {
    const err = await run(validateRegister, {
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      password: 'password123',
      confirmPassword: 'other123',
    });
    assert.ok(err);
  });

  it('accepts a valid registration payload', async () => {
    const err = await run(validateRegister, {
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    assert.equal(err, null);
  });

  it('requires email and password on login', async () => {
    const err = await run(validateLogin, { email: '', password: '' });
    assert.ok(err);
    assert.equal(err.statusCode, 400);
  });
});
