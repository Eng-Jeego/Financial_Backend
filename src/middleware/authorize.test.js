const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { authorize } = require('./authorize');

function runAuthorize(roles, user) {
  return new Promise((resolve) => {
    const middleware = authorize(...roles);
    const req = { user };
    const res = {};
    const next = (err) => resolve(err || null);
    middleware(req, res, next);
  });
}

describe('authorize middleware', () => {
  it('rejects normal USER trying to access ADMIN endpoint with 403 Forbidden', async () => {
    const err = await runAuthorize(['ADMIN'], { role: 'USER' });
    assert.ok(err, 'Expected error to be thrown');
    assert.equal(err.statusCode, 403);
    assert.match(err.message, /permission/i);
  });

  it('rejects user with lowercase "user" trying to access ADMIN route', async () => {
    const err = await runAuthorize(['ADMIN'], { role: 'user' });
    assert.ok(err, 'Expected error to be thrown');
    assert.equal(err.statusCode, 403);
  });

  it('allows user with ADMIN role', async () => {
    const err = await runAuthorize(['ADMIN'], { role: 'ADMIN' });
    assert.equal(err, null);
  });

  it('allows user with lowercase "admin" role due to case-normalization', async () => {
    const err = await runAuthorize(['ADMIN'], { role: 'admin' });
    assert.equal(err, null);
  });

  it('rejects unauthenticated or role-less user with 403 Forbidden', async () => {
    const err = await runAuthorize(['ADMIN'], null);
    assert.ok(err);
    assert.equal(err.statusCode, 403);
  });
});
