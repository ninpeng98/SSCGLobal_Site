import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REEL_SYMBOLS, buildStrip, shuffle, spinDurations, finalYPercent, pickResult } from '../../assets/js/lib/reels.js';

// 같은 결과를 다시 만들 수 있는 난수(mulberry32)
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('the first symbol is seven (the key art shows 777)', () => {
  assert.equal(REEL_SYMBOLS[0], 'seven');
});

test('buildStrip starts on `from`, ends on the target, and never shows the target in between', () => {
  const strip = buildStrip(REEL_SYMBOLS, 3, 'crown', { from: 'seven', rng: seeded(1) });
  assert.equal(strip.length, 2 + 3 * (REEL_SYMBOLS.length - 1));
  assert.equal(strip[0], 'seven');
  assert.equal(strip.at(-1), 'crown');
  assert.ok(strip.slice(1, -1).every((s) => s !== 'crown'));
});

test('buildStrip puts every other symbol once in each loop', () => {
  const middle = buildStrip(REEL_SYMBOLS, 2, 'gift', { rng: seeded(7) }).slice(1, -1);
  const others = REEL_SYMBOLS.filter((s) => s !== 'gift').sort();
  assert.deepEqual(middle.slice(0, others.length).sort(), others);
  assert.deepEqual(middle.slice(others.length).sort(), others);
});

test('shuffle keeps the same items and leaves the input alone', () => {
  const input = ['a', 'b', 'c', 'd'];
  const out = shuffle(input, seeded(3));
  assert.deepEqual([...out].sort(), input);
  assert.deepEqual(input, ['a', 'b', 'c', 'd']);
});

test('spinDurations follows the 1.4 / 1.85 / 2.3 second plan', () => {
  assert.deepEqual(spinDurations(3), [1.4, 1.85, 2.3]);
});

test('finalYPercent moves the last cell into the window', () => {
  assert.equal(finalYPercent(10), -90);
  assert.equal(finalYPercent(4), -75);
});

test('pickResult covers both ends of the list', () => {
  assert.equal(pickResult(REEL_SYMBOLS, () => 0), REEL_SYMBOLS[0]);
  assert.equal(pickResult(REEL_SYMBOLS, () => 0.9999), REEL_SYMBOLS.at(-1));
});
