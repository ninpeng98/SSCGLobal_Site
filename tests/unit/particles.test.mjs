import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeSparkle, stepSparkle, sparkleAlpha, makeCoin, stepCoin, coinFrame, isCoinGone } from '../../assets/js/lib/particles.js';

test('a sparkle that floats above the top respawns below the canvas', () => {
  const rng = () => 0.5;
  const p = makeSparkle(rng, 400, 300);
  p.y = -11;
  stepSparkle(p, 0.016, 400, 300, rng);
  assert.ok(p.y > 300, `y=${p.y}`);
});

test('sparkleAlpha stays between 0.25 and 1', () => {
  for (let phase = 0; phase < 7; phase += 0.1) {
    const a = sparkleAlpha({ phase });
    assert.ok(a >= 0.25 - 1e-9 && a <= 1 + 1e-9, `${a}`);
  }
});

test('a coin flies up first and then falls back under gravity', () => {
  const c = makeCoin(() => 0.5, 100, 100);
  assert.ok(c.vy < 0);
  for (let i = 0; i < 120; i += 1) stepCoin(c, 1 / 60);
  assert.ok(c.vy > 0);
});

test('coinFrame walks the 10 sheet frames at 14 fps and wraps', () => {
  assert.equal(coinFrame({ t: 0 }), 0);
  assert.equal(coinFrame({ t: 0.08 }), 1);
  assert.equal(coinFrame({ t: 0.75 }), 0);
});

test('isCoinGone only once the coin has fallen below the canvas', () => {
  assert.equal(isCoinGone({ y: 500, size: 20, vy: 100 }, 400), true);
  assert.equal(isCoinGone({ y: 500, size: 20, vy: -100 }, 400), false);
  assert.equal(isCoinGone({ y: 300, size: 20, vy: 100 }, 400), false);
});
