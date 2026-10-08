import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { stampSite } from '../../scripts/stamp-assets.mjs';

async function makeSite(files) {
  const root = await mkdtemp(path.join(tmpdir(), 'stamp-'));
  for (const [rel, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, rel)), { recursive: true });
    await writeFile(path.join(root, rel), content);
  }
  return root;
}
const read = (root, rel) => readFile(path.join(root, rel), 'utf8');
const site = () => makeSite({
  'index.html': '<link rel="stylesheet" href="assets/css/a.css"><script src="assets/vendor/x-1.0.0/x.js"></script>'
    + '<script type="module" src="assets/js/main.js"></script><a href="privacy-policy.html">p</a>',
  '404.html': '<link rel="stylesheet" href="/assets/css/a.css"><script type="module" src="/assets/js/main.js"></script>',
  'assets/css/a.css': 'a{color:red}',
  'assets/vendor/x-1.0.0/x.js': 'x',
  'assets/js/main.js': "import { b } from './b.js';\nimport './lib/c.js';\nb();",
  'assets/js/b.js': "import { c } from './lib/c.js';\nexport const b = () => c;",
  'assets/js/lib/c.js': 'export const c = 1;',
});
const v = (s, name) => s.match(new RegExp(`${name.replace('.', '\\.')}\\?v=([0-9a-f]{8})`))?.[1];

test('stampSite adds a content version to local CSS/JS in pages and to relative module imports, not to vendor files', async () => {
  const root = await site();
  const changed = await stampSite(root, { write: true });
  assert.deepEqual(changed.sort(), ['404.html', 'assets/js/b.js', 'assets/js/main.js', 'index.html']);
  const index = await read(root, 'index.html');
  assert.ok(v(index, 'a.css') && v(index, 'main.js'));
  assert.match(index, /x\.js"/); // vendor 는 폴더 이름에 버전이 있다
  assert.match(index, /privacy-policy\.html"/);
  assert.equal(v(await read(root, '404.html'), 'main.js'), v(index, 'main.js'));
  const main = await read(root, 'assets/js/main.js');
  assert.ok(v(main, 'b.js'));
  assert.equal(v(main, 'c.js'), v(await read(root, 'assets/js/b.js'), 'c.js'));
});

test('stampSite is idempotent: a second run changes nothing', async () => {
  const root = await site();
  await stampSite(root, { write: true });
  assert.deepEqual(await stampSite(root, { write: true }), []);
});

test('changing a deep module changes the version of every module that imports it, up to the page', async () => {
  const root = await site();
  await stampSite(root, { write: true });
  const before = await read(root, 'index.html');
  await writeFile(path.join(root, 'assets/js/lib/c.js'), 'export const c = 2;');
  const changed = await stampSite(root, { write: true });
  assert.deepEqual(changed.sort(), ['404.html', 'assets/js/b.js', 'assets/js/main.js', 'index.html']);
  const after = await read(root, 'index.html');
  assert.notEqual(v(after, 'main.js'), v(before, 'main.js'));
  assert.equal(v(after, 'a.css'), v(before, 'a.css'));
});

test('without write, stampSite only reports stale files', async () => {
  const root = await site();
  assert.equal((await stampSite(root)).length, 4);
  assert.doesNotMatch(await read(root, 'index.html'), /\?v=/);
});
