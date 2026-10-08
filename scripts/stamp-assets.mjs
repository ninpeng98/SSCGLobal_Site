#!/usr/bin/env node
// CSS·JS 주소에 내용 버전(?v=내용 해시 8자리)을 붙인다. 브라우저가 옛 JS 를 캐시에서 꺼내 새 HTML 과 섞는 일을 막는다
// (GitHub Pages 는 10분, 로컬 파이썬 서버는 브라우저 추측만큼 캐시한다).
// - 페이지(HTML)의 로컬 .css/.js 주소. assets/vendor 는 폴더 이름에 버전이 있어 건드리지 않는다
// - JS 모듈의 상대 import('./x.js'). 모듈의 버전은 꼬리표를 붙인 뒤의 내용으로 정하므로,
//   깊은 모듈 하나가 바뀌면 그것을 부르는 모듈과 페이지의 주소까지 줄줄이 바뀐다
// 사용: node scripts/stamp-assets.mjs (파일을 고친다). verify.mjs 의 stamps 점검은 고칠 것이 남았는지만 본다
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from './verify.mjs';

const SKIP = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;
const PAGE_REF = /\b(src|href)="([^"?#]+\.(?:css|js))(?:\?v=[0-9a-f]*)?"/g;
const IMPORT = /\b(from\s*|import\s*\(?\s*)(['"])(\.{1,2}\/[^'"?]+\.js)(?:\?v=[0-9a-f]*)?\2/g;
const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 8);
const toPosix = (p) => p.split(path.sep).join('/');

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

/** @returns {Promise<string[]>} 꼬리표가 맞지 않는(write 면 고친) 파일의 상대 경로 */
export async function stampSite(root, { write = false } = {}) {
  const changed = [];
  const save = async (file, before, after) => {
    if (before === after) return;
    changed.push(toPosix(path.relative(root, file)));
    if (write) await writeFile(file, after);
  };

  const modules = new Map(); // 절대 경로 → 꼬리표를 붙인 내용의 해시
  const visiting = new Set();
  async function moduleVersion(file) {
    if (modules.has(file)) return modules.get(file);
    if (visiting.has(file)) throw new Error(`import cycle at ${file}`);
    visiting.add(file);
    const source = await readFile(file, 'utf8');
    const deps = new Map();
    for (const [, , , spec] of source.matchAll(IMPORT)) {
      deps.set(spec, await moduleVersion(path.resolve(path.dirname(file), spec)));
    }
    const stamped = source.replace(IMPORT, (_, lead, q, spec) => `${lead}${q}${spec}?v=${deps.get(spec)}${q}`);
    await save(file, source, stamped);
    visiting.delete(file);
    const version = hash(stamped);
    modules.set(file, version);
    return version;
  }
  const fileVersion = async (file) => (file.endsWith('.js') ? moduleVersion(file) : hash(await readFile(file)));

  for (const name of PAGES) {
    const page = path.join(root, name);
    if (!await exists(page)) continue;
    const html = await readFile(page, 'utf8');
    const versions = new Map();
    for (const [, , url] of html.matchAll(PAGE_REF)) {
      if (SKIP.test(url) || /(^|\/)assets\/vendor\//.test(url)) continue;
      const target = url.startsWith('/') ? path.join(root, url) : path.join(path.dirname(page), url);
      if (await exists(target)) versions.set(url, await fileVersion(target));
    }
    const stamped = html.replace(PAGE_REF, (whole, attr, url) => (versions.has(url) ? `${attr}="${url}?v=${versions.get(url)}"` : whole));
    await save(page, html, stamped);
  }
  return changed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const changed = await stampSite(root, { write: true });
  console.log(changed.length ? `stamped: ${changed.join(', ')}` : 'stamps: up to date');
}
