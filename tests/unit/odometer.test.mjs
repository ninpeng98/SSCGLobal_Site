import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatChips, toGlyphs, digitOffsetPercent, nextJackpot } from '../../assets/js/lib/odometer.js';

test('formatChips floors, clamps at zero and adds thousands separators', () => {
  assert.equal(formatChips(2847300150.9), '2,847,300,150');
  assert.equal(formatChips(-5), '0');
});

test('toGlyphs splits digits and separators', () => {
  assert.deepEqual(toGlyphs(12345), ['1', '2', ',', '3', '4', '5']);
});

test('digitOffsetPercent moves the 0–9 column so the digit shows', () => {
  assert.equal(digitOffsetPercent('0'), 0);
  assert.equal(digitOffsetPercent('7'), -70);
});

test('nextJackpot always grows by 1,200–9,799 chips', () => {
  assert.equal(nextJackpot(1000, () => 0), 2200);
  assert.equal(nextJackpot(1000, () => 0.999999), 10799);
});
