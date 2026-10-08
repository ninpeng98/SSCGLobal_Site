#!/usr/bin/env node
// assets/vendor 아래 파일의 sha384 로 VENDOR.md 를 다시 쓴다. 라이브러리 표는 SOURCES 에서 온다.
// 라이브러리 파일을 바꾸거나 버전을 올린 뒤에 실행한다: node scripts/vendor-manifest.mjs
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha384 } from './verify.mjs';

export const SOURCES = [
  { dir: 'gsap-3.15.0', name: 'GSAP (core, ScrollTrigger, SplitText)', npm: 'gsap@3.15.0', license: 'GSAP Standard "No Charge" License — https://gsap.com/standard-license' },
  { dir: 'lenis-1.3.26', name: 'Lenis', npm: 'lenis@1.3.26', license: 'MIT' },
  { dir: 'canvas-confetti-1.9.4', name: 'canvas-confetti', npm: 'canvas-confetti@1.9.4', license: 'ISC' },
];

export function renderManifest(sources, files) {
  return [
    '# Vendored libraries',
    '',
    '이 폴더의 파일은 npm 레지스트리 원본을 그대로 복사한 것이다. 고치지 않는다.',
    '받는 법과 무결성 확인: `docs/superpowers/plans/2026-10-08-golden-hour-site-redesign.md` Task 2.',
    '파일을 바꾼 뒤에는 `node scripts/vendor-manifest.mjs` 로 이 표를 다시 쓴다.',
    '',
    '| Library | npm | License |',
    '|---|---|---|',
    ...sources.map((s) => `| ${s.name} | \`${s.npm}\` | ${s.license} |`),
    '',
    '| File | SHA-384 |',
    '|---|---|',
    ...files.map((f) => `| \`${f.file}\` | \`${f.sha384}\` |`),
    '',
  ].join('\n');
}

async function listFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await listFiles(p)); else out.push(p);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const vendor = path.join(root, 'assets/vendor');
  const files = [];
  for (const p of (await listFiles(vendor)).sort()) {
    const rel = path.relative(root, p).split(path.sep).join('/');
    if (rel === 'assets/vendor/VENDOR.md') continue;
    files.push({ file: rel, sha384: sha384(await readFile(p)) });
  }
  await writeFile(path.join(vendor, 'VENDOR.md'), renderManifest(SOURCES, files));
  console.log(`VENDOR.md: ${files.length} files`);
}
