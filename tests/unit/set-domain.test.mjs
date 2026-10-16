import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'domain-'));
  await mkdir(path.join(root, 'scripts'));
  await copyFile('scripts/set-domain.sh', path.join(root, 'scripts/set-domain.sh'));
  await writeFile(path.join(root, 'CNAME'), 'sscgl.vglobal.site\n');
  await writeFile(path.join(root, 'index.html'), '<link rel="canonical" href="https://sscgl.vglobal.site/"><p>sscglXvglobal.site</p>');
  await writeFile(path.join(root, 'sitemap.xml'), '<loc>https://sscgl.vglobal.site/</loc>');
  await writeFile(path.join(root, 'robots.txt'), 'Sitemap: https://sscgl.vglobal.site/sitemap.xml\n');
  return root;
}
const run = (root, ...args) => spawnSync('bash', ['scripts/set-domain.sh', ...args], { cwd: root, encoding: 'utf8' });

test('replaces the host in every listed file and nothing else', async () => {
  const root = await fixture();
  const r = run(root, 'play.golden-hour.example');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(await readFile(path.join(root, 'CNAME'), 'utf8'), 'play.golden-hour.example\n');
  assert.equal(await readFile(path.join(root, 'index.html'), 'utf8'),
    '<link rel="canonical" href="https://play.golden-hour.example/"><p>sscglXvglobal.site</p>');
  assert.equal(await readFile(path.join(root, 'sitemap.xml'), 'utf8'), '<loc>https://play.golden-hour.example/</loc>');
  assert.match(await readFile(path.join(root, 'robots.txt'), 'utf8'), /https:\/\/play\.golden-hour\.example\/sitemap\.xml/);
  assert.match(r.stdout, /updated index\.html/);
});

test('rejects an invalid host without touching files', async () => {
  const root = await fixture();
  const r = run(root, 'bad host/');
  assert.equal(r.status, 2);
  assert.equal(await readFile(path.join(root, 'CNAME'), 'utf8'), 'sscgl.vglobal.site\n');
});

test('is a no-op when the host is unchanged', async () => {
  const r = run(await fixture(), 'sscgl.vglobal.site');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /already sscgl\.vglobal\.site/);
});
