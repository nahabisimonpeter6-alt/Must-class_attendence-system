const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';
const { authenticate } = require('../src/middleware/auth');

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('authenticate rejects a request with no token', () => {
  const req = { headers: {} };
  const res = mockResponse();
  let nextCalled = false;

  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test('authenticate attaches the user for a valid token', () => {
  const token = jwt.sign({ id: 'abc123', role: 'lecturer', name: 'Dr. A' }, 'test-secret');
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let nextCalled = false;

  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.role, 'lecturer');
  assert.equal(req.user.id, 'abc123');
});

test('authenticate rejects an invalid token', () => {
  const req = { headers: { authorization: 'Bearer not-a-real-token' } };
  const res = mockResponse();
  let nextCalled = false;

  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});
