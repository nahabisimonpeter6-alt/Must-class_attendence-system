const { test } = require('node:test');
const assert = require('node:assert/strict');
const { attendancePercentage, isBelowThreshold } = require('../src/utils/attendance');

test('attendancePercentage returns 0 when there are no sessions', () => {
  assert.equal(attendancePercentage(0, 0), 0);
});

test('attendancePercentage rounds to the nearest whole percent', () => {
  assert.equal(attendancePercentage(3, 4), 75);
  assert.equal(attendancePercentage(2, 3), 67);
  assert.equal(attendancePercentage(1, 3), 33);
});

test('attendancePercentage treats all sessions attended as 100%', () => {
  assert.equal(attendancePercentage(5, 5), 100);
});

test('isBelowThreshold is strictly below the threshold', () => {
  assert.equal(isBelowThreshold(74, 75), true);
  assert.equal(isBelowThreshold(75, 75), false);
  assert.equal(isBelowThreshold(76, 75), false);
});
