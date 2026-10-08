import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  findLocalRefs, findCssRefs, findInlineViolations, parseVendorManifest, sha384, verifySite,
} from '../../scripts/verify.mjs';

test('findLocalRefs keeps local paths and drops external, anchor, mailto and data URLs', () => {
  const html = `<a href="privacy-policy.html#top"></a><a href="https://x.com/a.png"></a><a href="#faq"></a>
    <a href="mailto:a@b.c"></a><img src="data:image/png;base64,AAA">
    <img src="assets/img/a.webp?v=2" srcset="assets/img/a-480.webp 480w, assets/img/a-960.webp 960w">
    <link rel="icon" href="/favicon.ico">`;
  assert.deepEqual(findLocalRefs(html).sort(), [
    '/favicon.ico', 'assets/img/a-480.webp', 'assets/img/a-960.webp', 'assets/img/a.webp', 'privacy-policy.html',
  ]);
});

test('findCssRefs reads url() with and without quotes and skips data URLs', () => {
  const css = `a{background:url("../img/a.webp")} b{src:url(../fonts/b.woff2) format("woff2")} c{background:url(data:image/png;base64,AA)}`;
  assert.deepEqual(findCssRefs(css).sort(), ['../fonts/b.woff2', '../img/a.webp']);
});

test('findInlineViolations flags handlers, inline scripts and javascript: URLs but allows JSON-LD and src scripts', () => {
  const bad = `<div onclick="x()"></div><script>alert(1)</script><a href="javascript:void 0">x</a>`;
  assert.deepEqual(findInlineViolations(bad), ['inline event handler: onclick', 'javascript: URL', 'inline <script>']);
  const good = `<script type="application/ld+json">{"a":1}</script><script src="a.js"></script><p>Click on the badge</p>`;
  assert.deepEqual(findInlineViolations(good), []);
});

test('parseVendorManifest reads the file and hash columns', () => {
  const md = '| File | SHA-384 |\n|---|---|\n| `assets/vendor/x-1.0.0/x.min.js` | `sha384-AAAA+/==` |\n| not a row |';
  assert.deepEqual(parseVendorManifest(md), [{ file: 'assets/vendor/x-1.0.0/x.min.js', sha384: 'sha384-AAAA+/==' }]);
});

async function makeSite(files) {
  const root = await mkdtemp(path.join(tmpdir(), 'verify-'));
  for (const [rel, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, rel)), { recursive: true });
    await writeFile(path.join(root, rel), content);
  }
  return root;
}

test('verifySite passes a clean site', async () => {
  const js = 'console.log(1)';
  const root = await makeSite({
    'index.html': '<link rel="stylesheet" href="assets/css/a.css"><script src="assets/vendor/x-1.0.0/x.js"></script>',
    'assets/css/a.css': 'a{background:url("../img/a.webp")}',
    'assets/img/a.webp': 'x',
    'assets/vendor/x-1.0.0/x.js': js,
    'assets/vendor/VENDOR.md': `| \`assets/vendor/x-1.0.0/x.js\` | \`${sha384(Buffer.from(js))}\` |`,
    '404.html': '<a href="/">home</a><img src="/assets/img/a.webp">',
  });
  assert.deepEqual(await verifySite(root), []);
});

test('verifySite reports missing refs, inline code, hash mismatch, unlisted vendor files and relative refs in 404', async () => {
  const root = await makeSite({
    'index.html': '<img src="assets/img/missing.webp"><button onclick="x()">x</button>',
    'assets/vendor/x-1.0.0/x.js': 'changed',
    'assets/vendor/x-1.0.0/extra.js': 'extra',
    'assets/vendor/VENDOR.md': '| `assets/vendor/x-1.0.0/x.js` | `sha384-wrong` |',
    '404.html': '<img src="assets/img/a.webp">',
    'assets/img/a.webp': 'x',
  });
  const errors = await verifySite(root);
  assert.ok(errors.includes('index.html: missing assets/img/missing.webp'), errors.join('\n'));
  assert.ok(errors.includes('index.html: inline event handler: onclick'));
  assert.ok(errors.includes('vendor: hash mismatch assets/vendor/x-1.0.0/x.js'));
  assert.ok(errors.includes('vendor: unlisted assets/vendor/x-1.0.0/extra.js'));
  assert.ok(errors.includes('404.html: relative ref assets/img/a.webp (use /…)'));
});

test('verifySite enforces the JS gzip budget', async () => {
  const { randomBytes } = await import('node:crypto');
  const big = randomBytes(140 * 1024).toString('base64');
  const root = await makeSite({ 'assets/js/big.js': big });
  const errors = await verifySite(root, ['budget']);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /^budget: JS \d+KB gzip > 130KB$/);
});
