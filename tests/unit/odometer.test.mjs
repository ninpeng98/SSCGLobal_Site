import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatChips, toGlyphs, digitOffsetPercent, forwardRow, nextJackpot } from '../../assets/js/lib/odometer.js';

test('formatChips floors, clamps at zero and adds thousands separators', () => {
  assert.equal(formatChips(2847300150.9), '2,847,300,150');
  assert.equal(formatChips(-5), '0');
});

test('toGlyphs splits digits and separators', () => {
  assert.deepEqual(toGlyphs(12345), ['1', '2', ',', '3', '4', '5']);
});

test('digitOffsetPercent moves the 0–9,0–9 column (20 rows) so the given row shows', () => {
  assert.equal(digitOffsetPercent(0), 0);
  assert.equal(digitOffsetPercent(7), -35);
  assert.equal(digitOffsetPercent(12), -60);
});

test('forwardRow always rolls a digit forward, through 9 -> 0, never backward', () => {
  assert.equal(forwardRow(3, 7), 7);   // 3 -> 7: 위로
  assert.equal(forwardRow(7, 2), 12);  // 7 -> 2: 8, 9, 0, 1, 2 로 지나간다(두 번째 0–9 의 2)
  assert.equal(forwardRow(5, 5), 5);   // 그대로
});

test('nextJackpot always grows by 1,200–9,799 chips', () => {
  assert.equal(nextJackpot(1000, () => 0), 2200);
  assert.equal(nextJackpot(1000, () => 0.999999), 10799);
});
