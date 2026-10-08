#!/usr/bin/env node
// 사이트 정적 점검.
// - refs: HTML·CSS 가 가리키는 로컬 파일이 있는지
// - inline: 인라인 <script>(JSON-LD 제외), on*= 속성, javascript: URL 이 없는지(CSP 때문)
// - vendor: assets/vendor 파일이 VENDOR.md 의 sha384 와 같은지, 목록에 없는 파일이 없는지
// - budget: assets/js + assets/vendor 의 .js 압축 합계가 예산 이하인지
// - abs404: 404.html 은 모든 로컬 경로가 / 로 시작하는지(GitHub Pages 는 아무 깊이의 경로에서 404.html 을 보여 준다)
// - stamps: CSS·JS 주소의 내용 버전(?v=)이 최신인지(stamp-assets.mjs)
// 사용: node scripts/verify.mjs [--check refs,inline,vendor,budget,abs404,stamps]
import { readFile, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stampSite } from './stamp-assets.mjs';

export const PAGES = ['index.html', 'privacy-policy.html', 'terms-of-service.html', '404.html'];
export const JS_BUDGET_GZIP = 130 * 1024;
const ALL_CHECKS = ['refs', 'inline', 'vendor', 'budget', 'abs404', 'stamps'];
const SKIP = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i; // http:, https:, mailto:, data:, //host, #anchor

export function findLocalRefs(html) {
  const refs = new Set();
  for (const [, attr, value] of html.matchAll(/\b(src|href|srcset)\s*=\s*"([^"]*)"/gi)) {
    const urls = attr.toLowerCase() === 'srcset'
      ? value.split(',').map((s) => s.trim().split(/\s+/)[0])
      : [value.trim()];
    for (const url of urls) {
      if (!url || SKIP.test(url)) continue;
      refs.add(url.split(/[?#]/)[0]);
    }
  }
  return [...refs];
}

export function findCssRefs(css) {
  const refs = new Set();
  for (const m of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
    const url = m[2].trim();
    if (!SKIP.test(url)) refs.add(url.split(/[?#]/)[0]);
  }
  return [...refs];
}

export function findInlineViolations(html) {
  const problems = [];
  for (const m of html.matchAll(/<[a-z][^>]*?\s(on[a-z]+)\s*=/gi)) problems.push(`inline event handler: ${m[1]}`);
  if (/\bjavascript:/i.test(html)) problems.push('javascript: URL');
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(attrs)) continue;
    if (/type\s*=\s*"application\/ld\+json"/i.test(attrs)) continue;
    if (body.trim()) problems.push('inline <script>');
  }
  return problems;
}

export function parseVendorManifest(md) {
  const rows = [];
  for (const line of md.split('\n')) {
    const m = line.match(/^\|\s*`?(assets\/vendor\/[^|`]+?)`?\s*\|\s*`?(sha384-[A-Za-z0-9+/=]+)`?\s*\|/);
    if (m) rows.push({ file: m[1], sha384: m[2] });
  }
  return rows;
}

export function sha384(buf) {
  return `sha384-${createHash('sha384').update(buf).digest('base64')}`;
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}

const toPosix = (p) => p.split(path.sep).join('/');

export async function verifySite(root, checks = ALL_CHECKS) {
  const errors = [];
  const pages = [];
  for (const name of PAGES) if (await exists(path.join(root, name))) pages.push(name);
  const html = Object.fromEntries(await Promise.all(pages.map(async (n) => [n, await readFile(path.join(root, n), 'utf8')])));

  if (checks.includes('refs')) {
    for (const name of pages) {
      for (const ref of findLocalRefs(html[name])) {
        const target = ref.startsWith('/') ? path.join(root, ref) : path.join(root, path.dirname(name), ref);
        if (!await exists(target)) errors.push(`${name}: missing ${ref}`);
      }
    }
    const cssDir = path.join(root, 'assets/css');
    if (await exists(cssDir)) {
      for (const file of (await walk(cssDir)).filter((f) => f.endsWith('.css'))) {
        for (const ref of findCssRefs(await readFile(file, 'utf8'))) {
          if (!await exists(path.join(path.dirname(file), ref))) errors.push(`${toPosix(path.relative(root, file))}: missing ${ref}`);
        }
      }
    }
  }

  if (checks.includes('inline')) {
    for (const name of pages) for (const p of findInlineViolations(html[name])) errors.push(`${name}: ${p}`);
  }

  if (checks.includes('abs404') && html['404.html']) {
    for (const ref of findLocalRefs(html['404.html'])) {
      if (!ref.startsWith('/')) errors.push(`404.html: relative ref ${ref} (use /…)`);
    }
  }

  const vendorDir = path.join(root, 'assets/vendor');
  if (checks.includes('vendor') && await exists(vendorDir)) {
    const manifestPath = path.join(vendorDir, 'VENDOR.md');
    const rows = await exists(manifestPath) ? parseVendorManifest(await readFile(manifestPath, 'utf8')) : [];
    if (!rows.length) errors.push('assets/vendor/VENDOR.md: no file rows');
    const listed = new Set(rows.map((r) => r.file));
    for (const { file, sha384: want } of rows) {
      const p = path.join(root, file);
      if (!await exists(p)) { errors.push(`vendor: missing ${file}`); continue; }
      if (sha384(await readFile(p)) !== want) errors.push(`vendor: hash mismatch ${file}`);
    }
    for (const f of await walk(vendorDir)) {
      const rel = toPosix(path.relative(root, f));
      if (rel !== 'assets/vendor/VENDOR.md' && !listed.has(rel)) errors.push(`vendor: unlisted ${rel}`);
    }
  }

  if (checks.includes('budget')) {
    let total = 0;
    for (const dir of ['assets/js', 'assets/vendor']) {
      const d = path.join(root, dir);
      if (!await exists(d)) continue;
      for (const f of (await walk(d)).filter((x) => x.endsWith('.js'))) total += gzipSync(await readFile(f)).length;
    }
    if (total > JS_BUDGET_GZIP) errors.push(`budget: JS ${Math.round(total / 1024)}KB gzip > ${JS_BUDGET_GZIP / 1024}KB`);
  }

  if (checks.includes('stamps')) {
    for (const file of (await stampSite(root)).sort()) errors.push(`stamps: ${file} out of date (run node scripts/stamp-assets.mjs)`);
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--check');
  const checks = i > 0 ? process.argv[i + 1].split(',') : ALL_CHECKS;
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const errors = await verifySite(root, checks);
  for (const e of errors) console.error(`✗ ${e}`);
  console.log(errors.length ? `${errors.length} problem(s)` : `verify (${checks.join(',')}): OK`);
  process.exit(errors.length ? 1 : 0);
}
