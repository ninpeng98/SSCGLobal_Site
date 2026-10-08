import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JACKPOT_SYMBOLS, TIERS, VISIBLE_ROWS, buildStrip, shuffle, spinDurations, stripYPercent, pickTier } from '../../assets/js/lib/reels.js';

// 같은 결과를 다시 만들 수 있는 난수(mulberry32)
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('each Daily Jackpot tier lines up its own symbol (spade, heart, diamond, clover; cherries pay small prizes)', () => {
  assert.deepEqual(TIERS, { grand: 'spade', major: 'heart', minor: 'diamond', mini: 'clover', cherry: 'cherry' });
  for (const s of Object.values(TIERS)) assert.ok(JACKPOT_SYMBOLS.includes(s), s);
});

test('the reel window shows a little under three rows (262px window, 90px rows in the web prototype)', () => {
  assert.equal(VISIBLE_ROWS, 262 / 90);
});

test('buildStrip starts with the three rows on show and ends with the result in the middle row', () => {
  const from = ['heart', 'cherry', 'clover'];
  const strip = buildStrip(JACKPOT_SYMBOLS, 2, 'spade', { from, rng: seeded(1) });
  assert.deepEqual(strip.slice(0, 3), from);
  assert.equal(strip.at(-2), 'spade');
  assert.notEqual(strip.at(-3), 'spade');
  assert.notEqual(strip.at(-1), 'spade');
  assert.equal(strip.length, 3 + 2 * JACKPOT_SYMBOLS.length + 3);
});

test('buildStrip spins every symbol once per loop', () => {
  const middle = buildStrip(JACKPOT_SYMBOLS, 2, 'heart', { from: ['spade', 'spade', 'spade'], rng: seeded(7) }).slice(3, -3);
  const all = [...JACKPOT_SYMBOLS].sort();
  assert.deepEqual(middle.slice(0, all.length).sort(), all);
  assert.deepEqual(middle.slice(all.length).sort(), all);
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

test('stripYPercent centres the given cell in the window', () => {
  // 4칸 띠, 창에 3칸: 0번 칸을 가운데 두려면 띠를 한 칸(25%) 내린다
  assert.equal(stripYPercent(0, 4, 3), 25);
  assert.equal(stripYPercent(1, 4, 3), 0);
  assert.equal(stripYPercent(3, 4, 3), -50);
});

test('pickTier covers both ends and gives every tier a fair share (each 10% or more, cherries under a third)', () => {
  assert.equal(pickTier(() => 0), 'grand');
  assert.equal(pickTier(() => 0.9999), 'cherry');
  const rng = seeded(11);
  const counts = { grand: 0, major: 0, minor: 0, mini: 0, cherry: 0 };
  const N = 4000;
  for (let i = 0; i < N; i += 1) counts[pickTier(rng)] += 1;
  for (const [tier, n] of Object.entries(counts)) assert.ok(n / N >= 0.1, `${tier} ${n / N}`);
  assert.ok(counts.cherry / N < 1 / 3, JSON.stringify(counts));
  assert.ok(counts.grand + counts.major >= N * 0.3, JSON.stringify(counts));
});
