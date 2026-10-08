import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const FONTS = [
  ['assets/fonts/gh-display-900.woff2', 80 * 1024],
  ['assets/fonts/source-sans-3-400.woff2', 40 * 1024],
  ['assets/fonts/source-sans-3-600.woff2', 40 * 1024],
];

for (const [file, max] of FONTS) {
  test(`${file} is a woff2 under ${max / 1024}KB`, () => {
    assert.equal(readFileSync(file).subarray(0, 4).toString('ascii'), 'wOF2');
    assert.ok(statSync(file).size <= max, `${statSync(file).size} bytes`);
  });
}

test('OFL license files ship with the fonts', () => {
  for (const f of ['assets/fonts/OFL-NotoSansKR.txt', 'assets/fonts/OFL-SourceSans3.txt']) {
    assert.match(readFileSync(f, 'utf8'), /SIL Open Font License/);
  }
});
