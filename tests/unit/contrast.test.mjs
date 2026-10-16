import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contrastRatio, readTokens } from './helpers/contrast.mjs';

test('contrastRatio matches WCAG reference values', () => {
  assert.equal(Math.round(contrastRatio('#000', '#fff') * 100) / 100, 21);
  assert.equal(contrastRatio('#777', '#777'), 1);
});

test('text tokens pass WCAG AA (4.5:1) on every background token', () => {
  const t = readTokens(readFileSync('assets/css/tokens.css', 'utf8'));
  const pairs = [
    ['c-text', 'c-bg'], ['c-text', 'c-bg-2'], ['c-text', 'c-bg-deep'], ['c-text', 'c-panel-1'],
    ['c-text-dim', 'c-bg'], ['c-text-dim', 'c-bg-2'], ['c-text-dim', 'c-bg-deep'], ['c-text-dim', 'c-panel-1'],
  ];
  for (const [fg, bg] of pairs) {
    assert.ok(t[fg] && t[bg], `missing token ${fg} or ${bg}`);
    const ratio = contrastRatio(t[fg], t[bg]);
    assert.ok(ratio >= 4.5, `${fg} on ${bg} = ${ratio.toFixed(2)}`);
  }
});
