# Golden Hour 홍보 사이트 리뉴얼 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `sscgl.vglobal.site`를 "Golden Hour - Slots Casino" 브랜드의 홍보 사이트로 다시 만든다. 이 사이트는 리뉴얼된 게임 클라이언트 UI와 같은 디자인 언어를 쓰고, 첫 화면에서 슬롯 릴이 돈다.

**Architecture:** GitHub Pages가 그대로 서빙하는 정적 사이트이고 빌드 단계가 없다.
- HTML 4장, CSS 5개, ES 모듈 JS가 있다.
- 외부 라이브러리 4종(GSAP, Lenis, Swiper, canvas-confetti)은 저장소에 넣어 버전을 고정한다(vendoring).
- 계산 로직은 `assets/js/lib/`에 DOM 없이 두고 Node 내장 테스트로 검증한다.
- 화면 동작은 Playwright(설치된 Google Chrome 사용)로 검증한다.

**Tech Stack:** HTML, CSS(사용자 정의 속성·container query), ES 모듈, GSAP 3.15.0(ScrollTrigger·SplitText), Lenis 1.3.26, Swiper 14.3.0, canvas-confetti 1.9.4, Node 24(`node --test`), @playwright/test 1.64.0, cwebp·sips(macOS), fontTools(pyftsubset).

**Spec:** `docs/superpowers/specs/2026-10-08-golden-hour-site-redesign-design.md`

## Global Constraints

- 언어: 영어만 쓴다. 화면 테마는 어두운 화면 하나로 고정한다(`color-scheme: dark`).
- 앱 이름은 `Golden Hour - Slots Casino`다. 문장 안에서는 `Golden Hour – Slots Casino`(en dash)로 써도 된다. 회사명은 `Vglobal Co., Ltd.`다.
- Play 스토어 주소: `https://play.google.com/store/apps/details?id=site.vglobal.android.casinog`
- 도메인은 `sscgl.vglobal.site`다. 절대 주소는 HTML `<head>`, `sitemap.xml`, `robots.txt`, `CNAME`에만 둔다. 본문 링크는 상대 경로로 쓰고, `404.html`만 `/`로 시작하는 경로를 쓴다.
- GA 측정 ID `G-0JJDZ3R7EH`
- 인라인 `<script>`(JSON-LD 제외), `on*=` 속성, `javascript:` URL을 금지한다.
- CSP(모든 HTML에서 `<meta charset>` 바로 다음 줄에 같은 값을 둔다):
  `default-src 'self'; script-src 'self' https://www.googletagmanager.com; connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com; img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'`
- 외부 라이브러리 버전은 gsap 3.15.0, lenis 1.3.26, swiper 14.3.0, canvas-confetti 1.9.4로 고정한다. CDN에서 불러오지 않는다.
- JS 압축 후 합계(`assets/js` + `assets/vendor`의 `.js`)는 130KB 이하로 한다.
- 애니메이션은 `transform`·`opacity`만 바꾼다. `addEventListener('scroll')`을 직접 쓰지 않는다. `prefers-reduced-motion: reduce`이면 모든 연출을 끄고 최종 상태를 보여 준다.
- 모서리 둥글기: 큰 판 32px(767px 이하 24px), 안쪽 상자 16px, 목록 줄 18px, 버튼·배지·알약은 `999px`.
- 칩·잭팟 숫자에 통화 기호(`$`)를 쓰지 않는다. 실시간 값처럼 보이게 하는 "LIVE" 같은 표시도 쓰지 않는다.
- 설치 유도는 Google Play 공식 배지 하나로 통일한다. 배지 그림은 바꾸지 않는다. 장식은 배지 **뒤쪽**의 빛만 쓴다(테두리를 두르거나 배지 위로 빛을 지나가게 하지 않는다).
- 법률 문서 본문은 `Social Casino2` → `Golden Hour - Slots Casino`, `Vglobal Inc.` → `Vglobal Co., Ltd.` 외에는 바꾸지 않는다.
- 클라이언트 저장소 경로는 `CLIENT_REPO`이고 기본값은 `/Users/ultramaker/Projects/work/mazynga/mazynga_unity_global`이다. 받은 소재는 `assets/img/_incoming/`에 있다(git 제외).

## 설계 문서와 달라진 점(Task 10에서 설계 문서에 반영)

1. 릴 겹침 좌표는 `hero-reels.js` 상수가 아니라 `sections.css`의 `.hero__stage` CSS 변수에 둔다. 가로·세로 그림을 미디어 쿼리 하나로 바꾸기 위해서다.
2. 주황 사탕 버튼은 쓰지 않는다. 흰 글자와 `#f47a18`의 대비가 2.8:1로 기준에 못 미친다. 404의 "Back to home"도 보라 버튼을 쓴다.
3. 설치 배지 장식은 배지 뒤쪽의 빛만 쓴다. Google 배지 가이드라인 때문이다.
4. 4시간 보너스 섹션의 "Collect Bonus" 그림은 뺀다. 누를 수 없는 버튼처럼 보이기 때문이다.
5. 점검 스크립트는 `scripts/verify.sh` 대신 `scripts/verify.mjs`(Node)로 만든다.
6. CSP에서 `upgrade-insecure-requests`를 뺀다. 로컬 http 서버에서 자원 요청이 https로 바뀌어 깨지고, 외부 자원은 이미 모두 https라서 필요가 없다.
7. 소셜 섹션의 4칸은 랭킹 스크린샷 1칸과 아이콘 카드 3칸(친구, 선물, 메시지)으로 구성한다. 새 UI 촬영본이 오면 Task 11에서 바꾼다.
8. 본문 글꼴은 Noto Sans 대신 Source Sans 3를 쓴다(설계 5.2에 이미 반영).

## Review Focus

이 사이트를 쓰는 사람이 실제로 부딪힐 가능성이 큰 입력·조건 다섯 가지다. 각각 아래 과제에 테스트를 넣었다.

1. **짧거나 가로로 긴 화면**(1280×720 노트북, 812×375 가로 휴대폰): 첫 화면의 설치 배지가 화면 안에 보이거나, 한 번 스크롤하면 닿아야 한다. → Task 6 `layout.spec.mjs`의 "laptop 1280×720"
2. **외부 라이브러리 로드 실패**(vendor 파일 404, 확장 프로그램 차단): 연출만 빠지고 모든 내용이 보여야 한다. 숨겨진 채 남는 요소가 없고, 릴은 정지 상태여야 한다. → Task 8 `sections.spec.mjs`의 "vendor blocked"
3. **SPIN 연타·회전 중 클릭**: 회전이 겹치지 않고, 마지막에 `landed` 상태 하나로 끝나야 한다. → Task 7 `hero.spec.mjs`의 "rapid clicks"
4. **스크롤로 첫 화면을 벗어남·탭 숨김**: 입자 그리기가 멈춰야 한다(배터리, CPU). → Task 7 `hero.spec.mjs`의 "particles stop off-screen"
5. **창 크기·방향 변경**(가로 ↔ 세로): 키 아트가 세로 그림으로 바뀌고 릴 겹침 좌표도 함께 바뀌어야 한다. → Task 7 `hero.spec.mjs`의 "orientation switch"

## 파일 구조

| 파일 | 책임 |
|---|---|
| `index.html` | 메인 페이지(첫 화면, 슬롯, 럭키 타임, 층, 소셜, 보너스, 제작팀, FAQ, 설치, 하단) |
| `privacy-policy.html`, `terms-of-service.html` | 정책 페이지(본문 유지, 틀만 새로) |
| `404.html` | 404 페이지(모든 경로는 `/`로 시작) |
| `assets/css/tokens.css` | 색·그라데이션·둥글기·글꼴·간격 변수 |
| `assets/css/base.css` | `@font-face`, 초기화, 본문, 접근성 공용 클래스 |
| `assets/css/components.css` | 판, 금색 제목, 버튼, 알약, 태그, 배지, 스크린샷 틀, 상단 메뉴, 하단, FAQ |
| `assets/css/sections.css` | 메인 페이지 섹션 배치와 릴 겹침 좌표 |
| `assets/css/legal.css` | 정책·404 본문 |
| `assets/js/main.js` | 메인 페이지 시작점(메뉴, 부드러운 스크롤, 첫 화면 연출, 섹션 연출 연결) |
| `assets/js/page.js` | 정책·404 페이지 시작점(메뉴, 404 릴 흔들림) |
| `assets/js/motion.js` | 동작 줄이기 판단, 공용 시간·easing·색종이 색 |
| `assets/js/nav.js` | 상단 메뉴(배경 채움, 모바일 열고 닫기) |
| `assets/js/hero-reels.js` | 첫 화면 릴 DOM과 회전 |
| `assets/js/particles.js` | 첫 화면 코인·반짝이 canvas |
| `assets/js/sections.js` | 제목·카드 등장, 슬롯 넘김, 잭팟 숫자, 층, 4시간 원, 버튼 누름 |
| `assets/js/analytics.js` | gtag 초기화와 `data-track` 클릭 이벤트 |
| `assets/js/lib/reels.js` | 릴 띠·시간·결과 계산(DOM 없음) |
| `assets/js/lib/particles.js` | 입자 위치·프레임 계산(DOM 없음) |
| `assets/js/lib/odometer.js` | 잭팟 숫자 글자·오프셋 계산(DOM 없음) |
| `assets/vendor/…` + `VENDOR.md` | 고정 버전 라이브러리와 해시 |
| `assets/fonts/…` | `gh-display-900.woff2`, `source-sans-3-{400,600}.woff2`, OFL 라이선스 2개 |
| `assets/img/{hero,brand,slots,features,icons,reels,og,badges}/` | 변환된 이미지 |
| `assets/LICENSES.md` | Lucide 아이콘(ISC) 고지 |
| `scripts/verify.mjs` | 정적 점검(경로, 인라인, vendor 해시, JS 예산, 404 절대 경로) |
| `scripts/vendor-manifest.mjs` | `VENDOR.md` 생성 |
| `scripts/build-images.sh` | 원본 PNG → WebP·PNG·ICO·JPG |
| `scripts/set-domain.sh` | 도메인 일괄 교체 |
| `tests/unit/*.test.mjs` | Node 내장 테스트 |
| `tests/unit/helpers/*.mjs` | 테스트 전용 도우미(대비 계산, WebP 크기) |
| `tests/e2e/*.spec.mjs`, `tests/e2e/fixtures.mjs` | Playwright 테스트 |
| `package.json`, `playwright.config.mjs`, `_config.yml`, `.gitignore` | 도구 설정. `_config.yml`은 개발 파일이 사이트에 올라가지 않게 한다 |

**지울 것**(Task 10): `styles.css`, `carousel.js`, `images/`. `.htaccess`는 사용자 확인 후 지운다.

---

### Task 1: 테스트 도구와 정적 점검 스크립트

**Files:**
- Create: `package.json`, `playwright.config.mjs`, `_config.yml`, `tests/e2e/fixtures.mjs`, `scripts/verify.mjs`, `tests/unit/verify.test.mjs`, `.claude/launch.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces:
  - `scripts/verify.mjs`가 내보내는 함수:
    - `PAGES: string[]`
    - `findLocalRefs(html: string): string[]`
    - `findCssRefs(css: string): string[]`
    - `findInlineViolations(html: string): string[]`
    - `parseVendorManifest(md: string): {file: string, sha384: string}[]`
    - `sha384(buf: Buffer): string`
    - `verifySite(root: string, checks?: string[]): Promise<string[]>`
  - 명령줄: `node scripts/verify.mjs [--check refs,inline,vendor,budget,abs404]`
  - `tests/e2e/fixtures.mjs`가 내보내는 `test`와 `expect`. `test`는 자동 fixture `problems: string[]`을 가진다. 여기에 콘솔 오류, 페이지 오류, CSP 위반이 쌓인다.

- [ ] **Step 1: 도구 설정 파일을 만든다**

`package.json`:
```json
{
  "name": "golden-hour-site",
  "private": true,
  "type": "module",
  "scripts": {
    "serve": "python3 -m http.server 4173 --bind 127.0.0.1",
    "test:unit": "node --test \"tests/unit/**/*.test.mjs\"",
    "test:e2e": "playwright test",
    "verify": "node scripts/verify.mjs",
    "test": "npm run test:unit && npm run verify && npm run test:e2e"
  },
  "devDependencies": {
    "@playwright/test": "1.64.0"
  }
}
```

`playwright.config.mjs`:
```js
import { defineConfig } from '@playwright/test';

// 브라우저를 따로 받지 않고 설치된 Google Chrome(channel: 'chrome')으로 돌린다.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'mobile', use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
});
```

`_config.yml`(GitHub Pages의 Jekyll이 개발 파일을 사이트에 올리지 않게 한다. `_`나 `.`로 시작하는 경로는 Jekyll이 원래 뺀다):
```yaml
exclude:
  - docs
  - tests
  - scripts
  - node_modules
  - package.json
  - package-lock.json
  - playwright.config.mjs
  - test-results
  - playwright-report
```

`.gitignore` 맨 아래에 추가한다:
```
# site tooling
/test-results/
/playwright-report/
/assets/img/_incoming/
/.venv/
/.claude/
```

`.claude/launch.json`(브라우저 미리보기용, 커밋하지 않음):
```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "site", "runtimeExecutable": "python3", "runtimeArgs": ["-m", "http.server", "4173", "--bind", "127.0.0.1"], "port": 4173 }
  ]
}
```

`tests/e2e/fixtures.mjs`:
```js
import { test as base, expect } from '@playwright/test';

// 모든 e2e 테스트의 공용 준비.
// - GA 요청은 빈 응답으로 바꾼다(외부 네트워크 없이 돌게).
// - 콘솔 오류·페이지 오류·CSP 위반을 problems 에 모은다. 테스트가 expect(problems).toEqual([]) 로 확인한다.
export const test = base.extend({
  problems: [async ({ page }, use) => {
    const problems = [];
    await page.route(/googletagmanager\.com|google-analytics\.com/, (route) =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    page.on('console', (msg) => { if (msg.type() === 'error') problems.push(`console: ${msg.text()}`); });
    page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => {
        console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`);
      });
    });
    await use(problems);
  }, { auto: true }],
});

export { expect };
```

- [ ] **Step 2: 의존성을 설치한다**

Run: `npm install`
Expected: `package-lock.json`이 생기고 `node_modules/@playwright/test`가 생긴다. 브라우저는 받지 않는다(`channel: 'chrome'`을 쓰기 때문).

- [ ] **Step 3: verify 단위 테스트를 먼저 쓴다**

`tests/unit/verify.test.mjs`:
```js
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
```

- [ ] **Step 4: 테스트가 실패하는지 확인한다**

Run: `npm run test:unit`
Expected: FAIL. `Cannot find module '.../scripts/verify.mjs'`

- [ ] **Step 5: `scripts/verify.mjs`를 만든다**

```js
#!/usr/bin/env node
// 사이트 정적 점검.
// - refs: HTML·CSS 가 가리키는 로컬 파일이 있는지
// - inline: 인라인 <script>(JSON-LD 제외), on*= 속성, javascript: URL 이 없는지(CSP 때문)
// - vendor: assets/vendor 파일이 VENDOR.md 의 sha384 와 같은지, 목록에 없는 파일이 없는지
// - budget: assets/js + assets/vendor 의 .js 압축 합계가 예산 이하인지
// - abs404: 404.html 은 모든 로컬 경로가 / 로 시작하는지(GitHub Pages 는 아무 깊이의 경로에서 404.html 을 보여 준다)
// 사용: node scripts/verify.mjs [--check refs,inline,vendor,budget,abs404]
import { readFile, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PAGES = ['index.html', 'privacy-policy.html', 'terms-of-service.html', '404.html'];
export const JS_BUDGET_GZIP = 130 * 1024;
const ALL_CHECKS = ['refs', 'inline', 'vendor', 'budget', 'abs404'];
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
```

- [ ] **Step 6: 테스트가 통과하는지 확인한다**

Run: `npm run test:unit`
Expected: `verify.test.mjs`의 테스트 7개가 모두 PASS.

- [ ] **Step 7: 옛 사이트에서 점검이 실제로 문제를 잡는지 확인한다**

Run: `node scripts/verify.mjs --check inline`
Expected: FAIL. `index.html: inline event handler: onclick`, `index.html: inline <script>` 같은 줄이 나온다. 옛 페이지 때문에 생기는 문제이고, Task 5·9에서 사라진다.

- [ ] **Step 8: 커밋한다**

```bash
git add package.json package-lock.json playwright.config.mjs _config.yml .gitignore tests/e2e/fixtures.mjs scripts/verify.mjs tests/unit/verify.test.mjs
git commit -m "chore: add test tooling and static site verifier"
```

---

### Task 2: 외부 라이브러리 고정(vendoring)

**Files:**
- Create: `scripts/vendor-manifest.mjs`, `tests/unit/vendor-manifest.test.mjs`, `assets/vendor/gsap-3.15.0/{gsap,ScrollTrigger,SplitText}.min.js`, `assets/vendor/gsap-3.15.0/LICENSE-NOTE.txt`, `assets/vendor/lenis-1.3.26/{lenis.min.js,lenis.css,LICENSE}`, `assets/vendor/swiper-14.3.0/{swiper-bundle.min.js,swiper-bundle.min.css,LICENSE}`, `assets/vendor/canvas-confetti-1.9.4/{confetti.browser.js,LICENSE}`, `assets/vendor/VENDOR.md`

**Interfaces:**
- Consumes: `sha384`, `parseVendorManifest`(Task 1)
- Produces:
  - `renderManifest(sources: {dir,name,npm,license}[], files: {file,sha384}[]): string`
  - `SOURCES` 배열
  - 명령줄: `node scripts/vendor-manifest.mjs`(VENDOR.md 다시 쓰기)
  - 브라우저 전역 변수: `gsap`, `ScrollTrigger`, `SplitText`, `Lenis`, `Swiper`, `confetti`

- [ ] **Step 1: 매니페스트 테스트를 먼저 쓴다**

`tests/unit/vendor-manifest.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderManifest, SOURCES } from '../../scripts/vendor-manifest.mjs';
import { parseVendorManifest } from '../../scripts/verify.mjs';

test('renderManifest lists every library and round-trips through parseVendorManifest', () => {
  const files = [
    { file: 'assets/vendor/gsap-3.15.0/gsap.min.js', sha384: 'sha384-AAA=' },
    { file: 'assets/vendor/lenis-1.3.26/lenis.min.js', sha384: 'sha384-BBB=' },
  ];
  const md = renderManifest(SOURCES, files);
  for (const s of SOURCES) assert.ok(md.includes(`\`${s.npm}\``), `missing ${s.npm}`);
  assert.deepEqual(parseVendorManifest(md), files);
});

test('SOURCES pins the versions from the spec', () => {
  assert.deepEqual(SOURCES.map((s) => s.npm), ['gsap@3.15.0', 'lenis@1.3.26', 'swiper@14.3.0', 'canvas-confetti@1.9.4']);
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `node --test tests/unit/vendor-manifest.test.mjs`
Expected: FAIL. `Cannot find module '.../scripts/vendor-manifest.mjs'`

- [ ] **Step 3: `scripts/vendor-manifest.mjs`를 만든다**

```js
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
  { dir: 'swiper-14.3.0', name: 'Swiper', npm: 'swiper@14.3.0', license: 'MIT' },
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
```

- [ ] **Step 4: 테스트 통과를 확인한다**

Run: `node --test tests/unit/vendor-manifest.test.mjs`
Expected: PASS(2개)

- [ ] **Step 5: 패키지를 받고 무결성을 대조한다**

```bash
TMP="$(mktemp -d)"
npm pack gsap@3.15.0 lenis@1.3.26 swiper@14.3.0 canvas-confetti@1.9.4 --pack-destination "$TMP" --json > "$TMP/pack.json"
for spec in gsap@3.15.0 lenis@1.3.26 swiper@14.3.0 canvas-confetti@1.9.4; do
  echo "registry $spec $(npm view "$spec" dist.integrity)"
done
node -e "for (const p of JSON.parse(require('fs').readFileSync('$TMP/pack.json','utf8'))) console.log('packed  ', p.id, p.integrity)"
```
Expected: 패키지마다 `registry`와 `packed` 줄의 `sha512-…` 값이 같다. 하나라도 다르면 멈추고 사용자에게 알린다.

- [ ] **Step 6: 필요한 파일만 복사한다**

```bash
for t in "$TMP"/*.tgz; do mkdir -p "${t%.tgz}" && tar -xzf "$t" -C "${t%.tgz}"; done
mkdir -p assets/vendor/{gsap-3.15.0,lenis-1.3.26,swiper-14.3.0,canvas-confetti-1.9.4}
cp "$TMP"/gsap-3.15.0/package/dist/{gsap,ScrollTrigger,SplitText}.min.js assets/vendor/gsap-3.15.0/
cp "$TMP"/lenis-1.3.26/package/dist/{lenis.min.js,lenis.css} "$TMP"/lenis-1.3.26/package/LICENSE assets/vendor/lenis-1.3.26/
cp "$TMP"/swiper-14.3.0/package/{swiper-bundle.min.js,swiper-bundle.min.css,LICENSE} assets/vendor/swiper-14.3.0/
cp "$TMP"/canvas-confetti-1.9.4/package/dist/confetti.browser.js "$TMP"/canvas-confetti-1.9.4/package/LICENSE assets/vendor/canvas-confetti-1.9.4/
cat > assets/vendor/gsap-3.15.0/LICENSE-NOTE.txt <<'EOF'
GSAP 3.15.0 (gsap, ScrollTrigger, SplitText) — Copyright GreenSock / Webflow.
Used under the GSAP Standard "No Charge" License: https://gsap.com/standard-license
Each .min.js keeps its original license header.
EOF
rm -rf "$TMP"
```

- [ ] **Step 7: 위험한 코드가 없는지 확인한다**

Run: `grep -c "eval(" assets/vendor/*/*.js`
Expected: 파일마다 `0`.

Run: `grep -n "useWorker: true" assets/vendor/canvas-confetti-1.9.4/confetti.browser.js`
Expected: 기본 인스턴스 한 줄(725번 근처)만 나온다. 우리 코드는 `confetti.create(canvas, { useWorker: false })`만 쓰므로 Worker를 만들지 않는다. 그래서 CSP에 `blob:`이 필요 없다.

- [ ] **Step 8: VENDOR.md를 만들고 점검한다**

Run: `node scripts/vendor-manifest.mjs && node scripts/verify.mjs --check vendor,budget`
Expected: `VENDOR.md: 12 files`, `verify (vendor,budget): OK`

- [ ] **Step 9: 커밋한다**

```bash
git add scripts/vendor-manifest.mjs tests/unit/vendor-manifest.test.mjs assets/vendor
git commit -m "chore: vendor gsap 3.15.0, lenis 1.3.26, swiper 14.3.0, canvas-confetti 1.9.4"
```

---

### Task 3: 글꼴, 디자인 토큰, 기본 CSS

**Files:**
- Create: `assets/fonts/gh-display-900.woff2`, `assets/fonts/source-sans-3-400.woff2`, `assets/fonts/source-sans-3-600.woff2`, `assets/fonts/OFL-NotoSansKR.txt`, `assets/fonts/OFL-SourceSans3.txt`, `assets/css/tokens.css`, `assets/css/base.css`, `tests/unit/helpers/contrast.mjs`, `tests/unit/contrast.test.mjs`, `tests/unit/fonts.test.mjs`

**Interfaces:**
- Produces:
  - CSS 변수(이후 모든 CSS가 쓴다):
    - 색: `--c-bg`, `--c-bg-2`, `--c-bg-deep`, `--c-panel-1`, `--c-text`, `--c-text-dim`, `--c-gold`, `--c-stroke-brown`, `--c-line`, `--c-inset`, `--c-glow`, `--c-dot`
    - 그라데이션: `--g-gold-text`, `--g-gold-rim`, `--g-gold-short`, `--g-panel`, `--g-btn-purple`, `--g-btn-disabled`, `--g-badge-gold`, `--g-row`, `--g-row-vip`
    - 버튼 테두리·입술: `--c-lip-purple`, `--c-lip-disabled`, `--c-btn-stroke-purple`, `--c-btn-stroke-disabled`
    - 그림자: `--shadow-panel`, `--shadow-btn`, `--shadow-pill`
    - 둥글기: `--r-panel`, `--r-inset`, `--r-row`, `--r-pill`
    - 글꼴: `--font-display`, `--font-body`
    - 배치: `--nav-h`, `--container`, `--gutter`, `--space-section`, `--z-nav`
  - 클래스: `.container`, `.container--narrow`, `.sr-only`, `.skip-link`
  - 글꼴 이름: `'GH Display'`(900), `'Source Sans 3'`(400, 600)

- [ ] **Step 1: 대비·글꼴 테스트를 먼저 쓴다**

`tests/unit/helpers/contrast.mjs`:
```js
// WCAG 2.x 대비 계산(테스트 전용).
export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function readTokens(css) {
  const out = {};
  for (const m of css.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g)) out[m[1]] = m[2];
  return out;
}
```

`tests/unit/contrast.test.mjs`:
```js
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
```

`tests/unit/fonts.test.mjs`:
```js
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
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm run test:unit`
Expected: `contrast.test.mjs`와 `fonts.test.mjs`가 FAIL(ENOENT: `assets/css/tokens.css`, `assets/fonts/...`). `contrastRatio matches WCAG reference values`는 PASS.

- [ ] **Step 3: 제목 글꼴을 영문 범위로 잘라 만든다**

```bash
CLIENT_REPO="${CLIENT_REPO:-/Users/ultramaker/Projects/work/mazynga/mazynga_unity_global}"
python3 -m venv .venv
.venv/bin/pip install --quiet "fonttools[woff]>=4.55,<5"
mkdir -p assets/fonts
.venv/bin/pyftsubset "$CLIENT_REPO/Assets/font/NotoSansKR-Black.otf" \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+2122,U+2605" \
  --layout-features="kern,liga,tnum" --flavor=woff2 \
  --output-file=assets/fonts/gh-display-900.woff2
cp "$CLIENT_REPO/Assets/font/LICENSE_OFL.txt" assets/fonts/OFL-NotoSansKR.txt
ls -l assets/fonts/gh-display-900.woff2
```
Expected: 파일이 생기고 크기가 80KB 이하다.

- [ ] **Step 4: 본문 글꼴을 받는다**

```bash
TMP="$(mktemp -d)"
npm pack @fontsource/source-sans-3@5.3.0 --pack-destination "$TMP" --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log('packed', JSON.parse(s)[0].integrity))"
echo "registry $(npm view @fontsource/source-sans-3@5.3.0 dist.integrity)"
tar -xzf "$TMP"/fontsource-source-sans-3-5.3.0.tgz -C "$TMP"
cp "$TMP"/package/files/source-sans-3-latin-400-normal.woff2 assets/fonts/source-sans-3-400.woff2
cp "$TMP"/package/files/source-sans-3-latin-600-normal.woff2 assets/fonts/source-sans-3-600.woff2
cp "$TMP"/package/LICENSE assets/fonts/OFL-SourceSans3.txt
rm -rf "$TMP"
```
Expected: `packed`와 `registry`의 sha512 값이 같다.

- [ ] **Step 5: `assets/css/tokens.css`를 만든다**

```css
/* 디자인 값. 출처: mazynga_unity_global develop docs/tools/popup-lab/kit.js(웹 시안)와 확정 설계 문서.
   "웹 조정" 표시가 없는 값은 클라이언트와 같다. */
:root {
  /* 색 */
  --c-bg: #150830;
  --c-bg-2: #1d0c40;          /* 웹 조정: 섹션 구분용 한 단계 밝은 톤 */
  --c-bg-deep: #0f0524;       /* 웹 조정: 하단 */
  --c-panel-1: #45197d;
  --c-text: #f3ecff;
  --c-text-dim: #b9a8e8;
  --c-gold: #ffc53a;
  --c-gold-light: #ffd257;
  --c-stroke-brown: #3d1200;
  --c-line: rgba(190, 150, 255, .28);
  --c-inset: rgba(10, 3, 26, .62);
  --c-glow: rgba(200, 120, 255, .36);
  --c-dot: rgba(255, 255, 255, .035);

  /* 그라데이션 */
  --g-gold-text: linear-gradient(180deg, #ffffff 0%, #fff1a6 25%, #ffc53a 50%, #e27d00 75%, #ffd358 100%);
  --g-gold-rim: linear-gradient(180deg, #fff5c6 0%, #ffd257 5%, #c26d0e 45%, #a95a08 55%, #ffcf4a 95%, #8a4a06 100%);
  --g-gold-short: linear-gradient(180deg, #fff5c6 0%, #c26d0e 50%, #ffcf4a 100%);
  --g-panel: linear-gradient(180deg, #45197d 0%, #27104b 45%, #150830 100%);
  --g-btn-purple: linear-gradient(180deg, #b996ff 0%, #7c4ee6 48%, #6536d0 52%, #7a4ae6 100%);
  --g-btn-disabled: linear-gradient(180deg, #b3a7cc 0%, #857aa3 48%, #74698f 52%, #82779e 100%);
  --g-badge-gold: linear-gradient(180deg, #ffeb8a 0%, #ffa812 100%);
  --g-row: linear-gradient(180deg, #4b2787 0%, #2a1356 100%);
  --g-row-vip: linear-gradient(180deg, #5e2aa2 0%, #2a0c56 100%);

  /* 버튼 */
  --c-lip-purple: #36167e;
  --c-btn-stroke-purple: #5530b8;
  --c-lip-disabled: #3b3156;
  --c-btn-stroke-disabled: #5b5078;

  /* 그림자 */
  --shadow-panel: 0 16px 40px rgba(0, 0, 0, .75);
  --shadow-btn: 0 5px 10px rgba(0, 0, 0, .55);
  --shadow-pill: 0 3px 6px rgba(0, 0, 0, .5);

  /* 둥글기(설계 5.4) */
  --r-panel: 32px;            /* 웹 조정: 클라이언트 40 */
  --r-inset: 16px;
  --r-row: 18px;
  --r-pill: 999px;

  /* 글꼴 */
  --font-display: 'GH Display', 'Arial Black', system-ui, sans-serif;
  --font-body: 'Source Sans 3', system-ui, -apple-system, 'Segoe UI', sans-serif;

  /* 배치 */
  --nav-h: 68px;
  --container: 1200px;
  --gutter: clamp(16px, 4vw, 40px);
  --space-section: clamp(72px, 10vw, 140px);
  --z-nav: 100;
}

@media (max-width: 767px) {
  :root {
    --r-panel: 24px;
    --nav-h: 60px;
  }
}
```

- [ ] **Step 6: `assets/css/base.css`를 만든다**

```css
@font-face {
  font-family: 'GH Display';
  src: url('../fonts/gh-display-900.woff2') format('woff2');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Source Sans 3';
  src: url('../fonts/source-sans-3-400.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Source Sans 3';
  src: url('../fonts/source-sans-3-600.woff2') format('woff2');
  font-weight: 600;
  font-display: swap;
}

*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }

html {
  color-scheme: dark;
  -webkit-text-size-adjust: 100%;
  scroll-padding-top: calc(var(--nav-h) + 16px);
}
/* Lenis 가 켜지면(html.lenis) 브라우저 자체 부드러운 스크롤을 끈다 — 둘이 겹치면 튄다 */
html:not(.lenis) { scroll-behavior: smooth; }

body {
  min-height: 100dvh;
  background-color: var(--c-bg);
  background-image: radial-gradient(var(--c-dot) 1.5px, transparent 1.6px);
  background-size: 13px 13px;
  color: var(--c-text);
  font-family: var(--font-body);
  font-size: 1.0625rem;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow-x: clip;
}

img, picture, svg, canvas { display: block; max-width: 100%; }
img { height: auto; }
a { color: inherit; }
button { font: inherit; color: inherit; }
h1, h2, h3 { line-height: 1.1; text-wrap: balance; }
p { text-wrap: pretty; }

.container { width: min(100% - 2 * var(--gutter), var(--container)); margin-inline: auto; }
.container--narrow { --container: 820px; }

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

.skip-link {
  position: absolute; left: 16px; top: -100px; z-index: calc(var(--z-nav) + 10);
  padding: 10px 16px; border-radius: var(--r-pill);
  background: var(--c-text); color: var(--c-bg); font-weight: 600; text-decoration: none;
}
.skip-link:focus { top: 12px; }

:focus-visible { outline: 3px solid var(--c-gold-light); outline-offset: 3px; border-radius: 6px; }
::selection { background: #7c4ee6; color: #fff; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

- [ ] **Step 7: 테스트 통과를 확인한다**

Run: `npm run test:unit`
Expected: 모든 단위 테스트 PASS(`contrast` 2개, `fonts` 4개 포함).

Run: `node scripts/verify.mjs --check refs`
Expected: `assets/css/base.css`에 대한 오류는 없다. 옛 HTML 때문에 생기는 오류가 남아 있는 것은 괜찮다.

- [ ] **Step 8: 커밋한다**

```bash
git add assets/fonts assets/css/tokens.css assets/css/base.css tests/unit/helpers/contrast.mjs tests/unit/contrast.test.mjs tests/unit/fonts.test.mjs
git commit -m "feat(site): add design tokens, base styles and self-hosted fonts"
```

---
### Task 4: 이미지 변환

**Files:**
- Create: `scripts/build-images.sh`, `tests/unit/helpers/image-size.mjs`, `tests/unit/images.test.mjs`, `assets/img/**`(변환 결과), `assets/img/badges/google-play-en.png`, `favicon.ico`(덮어씀)

**Interfaces:**
- Consumes: 클라이언트 저장소 원본(`CLIENT_REPO`), `assets/img/_incoming/`(받은 소재)
- Produces(이후 HTML이 쓰는 경로):
  - 첫 화면 그림
    - `assets/img/hero/splash-wide-{960,1440,1914}.webp`
    - `assets/img/hero/keyart-square-{600,900,1254}.webp`
    - `assets/img/hero/keyart-16x9-{960,1920}.webp`
  - 릴: `assets/img/reels/seven.webp`(252×435)
  - 아이콘
    - `assets/img/icons/{chip,crown,trophy,gift,crown-chip,lock}.webp`
    - `assets/img/icons/coin-sheet.webp`(320×128, 5열×2행, 칸 64px, 10프레임)
  - 슬롯 타일: `assets/img/slots/<slug>.webp`(273×282, 12장)
  - 기능 화면: `assets/img/features/{jackpot,lucky-time,floors,ranking,lobby}-{960,1600}.webp`, `assets/img/features/lucky-time-badge.webp`
  - 브랜드
    - `assets/img/brand/app-icon-128.webp`, `assets/img/brand/vglobal-logo.webp`
    - `assets/img/brand/{favicon-32,icon-192,icon-512,apple-touch-icon}.png`
  - 공유 이미지: `assets/img/og/og-golden-hour.jpg`(1200×630)
  - `favicon.ico`(48)

- [ ] **Step 1: 이미지 크기 테스트를 먼저 쓴다**

`tests/unit/helpers/image-size.mjs`:
```js
// WebP·PNG 파일 머리에서 가로·세로를 읽는다(테스트 전용, 외부 도구 없이).
export function webpSize(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') throw new Error('not a webp');
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  throw new Error(`unknown webp chunk ${chunk}`);
}

export function pngSize(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a png');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
```

`tests/unit/images.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { webpSize, pngSize } from './helpers/image-size.mjs';

// [파일, 기대 폭, 기대 가로/세로 비율]. 높이는 반올림 차이가 있어 비율로 본다(1% 허용).
const WEBP = [
  ['assets/img/hero/splash-wide-960.webp', 960, 1914 / 822],
  ['assets/img/hero/splash-wide-1440.webp', 1440, 1914 / 822],
  ['assets/img/hero/splash-wide-1914.webp', 1914, 1914 / 822],
  ['assets/img/hero/keyart-square-600.webp', 600, 1],
  ['assets/img/hero/keyart-square-900.webp', 900, 1],
  ['assets/img/hero/keyart-square-1254.webp', 1254, 1],
  ['assets/img/hero/keyart-16x9-960.webp', 960, 16 / 9],
  ['assets/img/hero/keyart-16x9-1920.webp', 1920, 16 / 9],
  ['assets/img/reels/seven.webp', 252, 252 / 435],
  ['assets/img/icons/chip.webp', 152, 1],
  ['assets/img/icons/crown.webp', 216, 432 / 360],
  ['assets/img/icons/trophy.webp', 256, 1],
  ['assets/img/icons/gift.webp', 256, 1],
  ['assets/img/icons/crown-chip.webp', 256, 1],
  ['assets/img/icons/lock.webp', 64, 128 / 184],
  ['assets/img/icons/coin-sheet.webp', 320, 320 / 128],
  ['assets/img/features/lucky-time-badge.webp', 384, 384 / 98],
  ['assets/img/brand/app-icon-128.webp', 128, 1],
  ['assets/img/brand/vglobal-logo.webp', 480, 2048 / 1536],
  ...['jackpot', 'lucky-time', 'floors', 'ranking', 'lobby'].flatMap((n) => [
    [`assets/img/features/${n}-960.webp`, 960, 16 / 9],
    [`assets/img/features/${n}-1600.webp`, 1600, 16 / 9],
  ]),
];

export const SLOTS = [
  'golden-fruits', 'cash-fever', 'fairy-garden', 'aladdin', 'excalibur', 'titan',
  'treasure-island', 'curse-of-the-pharaohs', 'halloween-witch', 'christmas-miracle', 'zombie-hunter', 'gangsters-poker',
];

for (const [file, width, ratio] of WEBP) {
  test(`${file} is ${width}px wide with ratio ${ratio.toFixed(3)}`, () => {
    const size = webpSize(readFileSync(file));
    assert.equal(size.width, width);
    assert.ok(Math.abs(size.width / size.height - ratio) / ratio < 0.01, `${size.width}×${size.height}`);
  });
}

test('12 slot tiles exist at 273×282', () => {
  for (const slug of SLOTS) assert.deepEqual(webpSize(readFileSync(`assets/img/slots/${slug}.webp`)), { width: 273, height: 282 });
});

test('PNG icons have the declared sizes', () => {
  for (const [file, px] of [['favicon-32', 32], ['icon-192', 192], ['icon-512', 512], ['apple-touch-icon', 180]]) {
    assert.deepEqual(pngSize(readFileSync(`assets/img/brand/${file}.png`)), { width: px, height: px });
  }
});

test('official Google Play badge, social image and favicon exist', () => {
  assert.ok(pngSize(readFileSync('assets/img/badges/google-play-en.png')).width >= 500);
  assert.ok(existsSync('assets/img/og/og-golden-hour.jpg'));
  assert.equal(readFileSync('favicon.ico').readUInt16LE(2), 1); // ICO type 1
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `node --test tests/unit/images.test.mjs`
Expected: FAIL(ENOENT)

- [ ] **Step 3: `scripts/build-images.sh`를 만든다**

```bash
#!/usr/bin/env bash
# 클라이언트 저장소 원본과 받은 소재(assets/img/_incoming)를 사이트용 WebP·PNG·ICO·JPG 로 만든다.
# 원본 PNG 는 이 저장소에 넣지 않고, 결과만 커밋한다. 원본보다 크게 늘리지 않는다.
# 사용: CLIENT_REPO=/path/to/mazynga_unity_global scripts/build-images.sh
set -euo pipefail
cd "$(dirname "$0")/.."

CLIENT="${CLIENT_REPO:-/Users/ultramaker/Projects/work/mazynga/mazynga_unity_global}"
BRAND="$CLIENT/output/promo-video-kit/01_brand"
STORE="$CLIENT/output/promo-video-kit/02_store_screenshots"
UI="$CLIENT/output/promo-video-kit/03_ui_elements"
TILES="$CLIENT/Assets/Texture/TEST"
IN="assets/img/_incoming"
OUT="assets/img"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"/{hero,brand,slots,features,icons,reels,og,badges}

# webp SRC DST WIDTH [QUALITY]: 폭 WIDTH 로 줄여(비율 유지) WebP 로 저장. 원본이 더 작으면 원본 폭 그대로.
webp() {
  local src="$1" dst="$2" w="$3" q="${4:-82}" sw
  sw=$(sips -g pixelWidth "$src" | awk '/pixelWidth/{print $2}')
  if (( w > sw )); then w=$sw; fi
  cwebp -quiet -q "$q" -alpha_q 90 -metadata none -resize "$w" 0 "$src" -o "$dst"
}

# 첫 화면·설치 섹션 키 아트
for w in 960 1440 1914; do webp "$BRAND/splash_wide_1914x822.png" "$OUT/hero/splash-wide-$w.webp" "$w" 84; done
for w in 600 900 1254; do webp "$BRAND/title_keyart_1254.png" "$OUT/hero/keyart-square-$w.webp" "$w" 84; done
for w in 960 1920; do webp "$BRAND/title_keyart_16x9_lastframe.png" "$OUT/hero/keyart-16x9-$w.webp" "$w" 80; done

# 릴: 정사각 키 아트의 가운데 릴 창(7)을 잘라 쓴다. 측정값: x 498, y 535, 252×435(sips 는 y, x 순서)
sips --cropOffset 535 498 --cropToHeightWidth 435 252 "$BRAND/title_keyart_1254.png" --out "$TMP/seven.png" >/dev/null
webp "$TMP/seven.png" "$OUT/reels/seven.webp" 252 88

# 아이콘(받은 소재)
webp "$IN/icon_chip.png" "$OUT/icons/chip.webp" 152 88
webp "$IN/icon_crown_432.png" "$OUT/icons/crown.webp" 216 88
webp "$IN/icon_trophy.png" "$OUT/icons/trophy.webp" 256 85
webp "$IN/icon_gift.png" "$OUT/icons/gift.webp" 256 85
webp "$IN/extra_crown_chip_purple_1024.png" "$OUT/icons/crown-chip.webp" 256 85
webp "$IN/icon_lock_closed.png" "$OUT/icons/lock.webp" 64 90
cwebp -quiet -lossless -metadata none "$IN/coin_spin_sheet.png" -o "$OUT/icons/coin-sheet.webp"

# 슬롯 타일(로비 타일 273×282, 원본 크기 그대로)
while read -r slug src; do
  webp "$TILES/$src.png" "$OUT/slots/$slug.webp" 273 85
done <<'SLOTS'
golden-fruits 04_goldenfruits
cash-fever 18_cashfever
fairy-garden 06_fairygarden
aladdin 26_aladdin
excalibur 31_excalibur
titan 59_titan
treasure-island 01_treasureisland
curse-of-the-pharaohs 38_curseofthepharaohs
halloween-witch 52_halloweenwitch
christmas-miracle 56_christmasmiracle
zombie-hunter 48_zombiehunter
gangsters-poker 03_gangsterspoker
SLOTS

# 기능 화면(스토어 홍보 화면 — 새 UI 촬영본이 오면 Task 11 에서 바꾼다)
while read -r name src; do
  for w in 960 1600; do webp "$STORE/$src.png" "$OUT/features/$name-$w.webp" "$w" 80; done
done <<'SHOTS'
jackpot 01_titan_major_jackpot
ranking 03_ranking_social
floors 04_level_up_floors
lucky-time 05_excalibur_lucky_time
lobby 06_lobby_60_slots
SHOTS
webp "$UI/lucky_time_badge.png" "$OUT/features/lucky-time-badge.webp" 384 88

# 브랜드
webp "$BRAND/app_icon_round_1024.png" "$OUT/brand/app-icon-128.webp" 128 88
webp "$BRAND/company_logo.png" "$OUT/brand/vglobal-logo.webp" 480 88
sips -Z 32 "$BRAND/app_icon_round_1024.png" --out "$OUT/brand/favicon-32.png" >/dev/null
sips -Z 192 "$BRAND/app_icon_round_1024.png" --out "$OUT/brand/icon-192.png" >/dev/null
sips -Z 512 "$BRAND/app_icon_round_1024.png" --out "$OUT/brand/icon-512.png" >/dev/null
sips -Z 180 "$BRAND/app_icon_round_1024.png" --out "$OUT/brand/apple-touch-icon.png" >/dev/null
sips -Z 48 -s format ico "$BRAND/app_icon_round_1024.png" --out favicon.ico >/dev/null

# 공유 이미지 1200×630: 가로 키 아트를 높이 630 으로 줄이고 가운데를 자른다
sips --resampleHeight 630 "$BRAND/splash_wide_1914x822.png" --out "$TMP/og.png" >/dev/null
sips --cropToHeightWidth 630 1200 "$TMP/og.png" --out "$TMP/og-crop.png" >/dev/null
sips -s format jpeg -s formatOptions 85 "$TMP/og-crop.png" --out "$OUT/og/og-golden-hour.jpg" >/dev/null

echo "images built into $OUT"
```

Run: `chmod +x scripts/build-images.sh && scripts/build-images.sh`
Expected: `images built into assets/img`. 오류 없이 끝난다.

- [ ] **Step 4: 공식 Google Play 배지를 받는다**

```bash
curl -fsSL -o assets/img/badges/google-play-en.png \
  https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png
sips -g pixelWidth -g pixelHeight assets/img/badges/google-play-en.png
```
Expected: 646×250 PNG(배지 둘레에 투명 여백이 포함되어 있다). 이 파일은 고치지 않는다.

- [ ] **Step 5: 잘라 낸 7 그림을 눈으로 확인한다**

`assets/img/reels/seven.webp`를 열어(Read 도구) 빨간 7 하나가 크림색 릴 창 가운데에 있고 양옆의 금색 칸막이가 거의 보이지 않는지 본다. 칸막이가 보이면 좌우를 4px씩 줄여 다시 자른다(`--cropOffset 535 502 --cropToHeightWidth 435 244`). 테스트의 기대 폭도 그에 맞게 고친다.

- [ ] **Step 6: 테스트 통과를 확인한다**

Run: `node --test tests/unit/images.test.mjs`
Expected: PASS(모든 이미지)

- [ ] **Step 7: 커밋한다**

```bash
git add scripts/build-images.sh tests/unit/helpers/image-size.mjs tests/unit/images.test.mjs assets/img favicon.ico
git status --short assets/img | grep _incoming && echo "STOP: _incoming must stay untracked" || true
git commit -m "feat(site): add Golden Hour images, icons and official Play badge"
```

---

### Task 5: 페이지 틀(head·메뉴·하단)과 도메인 스크립트

**Files:**
- Create: `assets/css/components.css`, `assets/js/main.js`, `assets/js/nav.js`, `assets/js/analytics.js`, `assets/LICENSES.md`, `scripts/set-domain.sh`, `tests/unit/set-domain.test.mjs`, `tests/e2e/shell.spec.mjs`
- Modify: `index.html`(전체 교체), `sitemap.xml`(전체 교체)

**Interfaces:**
- Consumes: Task 3의 토큰·base.css, Task 4의 이미지 경로
- Produces:
  - `initNav(root = document): void`
    - 필요한 HTML: `[data-nav]`, `[data-nav-toggle]`, `#site-menu`, `[data-nav-sentinel]`
    - 상태 클래스: `.is-solid`, `.is-open`
  - `analytics.js`: 전역 `gtag`. `[data-track]` 요소를 누르면 `gtag('event', data-track, { location: data-track-location })`를 보낸다.
  - 컴포넌트 클래스: `.panel`, `.gold-title`(+`data-text`), `.gold-title--xl`, `.sweep-text`, `.btn`, `.btn--icon`, `.pill`, `.pill--age`, `.tag`, `.play-badge`(+`--sm`/`--lg`/`--xl`, `.is-celebrating`), `.shot`, `.brand`, `.site-nav`, `.site-footer`, `.faq__*`
  - `index.html`에 비어 있는 `<main id="main"></main>`. Task 6이 채운다.

- [ ] **Step 1: e2e·단위 테스트를 먼저 쓴다**

`tests/e2e/shell.spec.mjs`:
```js
import { test, expect } from './fixtures.mjs';

test.describe('page shell', () => {
  test('index loads without console errors or CSP violations', async ({ page, problems }) => {
    await page.goto('/');
    await expect(page.locator('header.site-nav')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(problems).toEqual([]);
  });

  test('CSP meta comes right after charset and has the agreed policy', async ({ page }) => {
    await page.goto('/');
    const meta = await page.evaluate(() => {
      const el = document.head.children[1];
      return { equiv: el.getAttribute('http-equiv'), content: el.getAttribute('content') };
    });
    expect(meta.equiv).toBe('Content-Security-Policy');
    expect(meta.content).toContain("script-src 'self' https://www.googletagmanager.com;");
    expect(meta.content).toContain("object-src 'none'");
    expect(meta.content).not.toContain('unsafe-eval');
    expect(meta.content).not.toContain('upgrade-insecure-requests');
  });

  test('structured data names the new app without fake ratings', async ({ page }) => {
    await page.goto('/');
    const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    const app = data.find((d) => d['@type'] === 'MobileApplication');
    expect(app.name).toBe('Golden Hour - Slots Casino');
    expect(app.publisher.name).toBe('Vglobal Co., Ltd.');
    expect(app.contentRating).toBe('18+');
    expect(app.aggregateRating).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain('Social Casino2');
  });

  test('social preview image is served', async ({ page, request }) => {
    await page.goto('/');
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(og).toBe('https://sscgl.vglobal.site/assets/img/og/og-golden-hour.jpg');
    expect((await request.get('/assets/img/og/og-golden-hour.jpg')).status()).toBe(200);
  });

  test('footer shows the 18+ notice and the no-cash-value disclaimer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer.site-footer');
    await expect(footer.locator('.pill--age')).toHaveText('18+');
    await expect(footer).toContainText('no cash value');
    await expect(footer).toContainText('© 2026 Vglobal Co., Ltd.');
  });

  test('every play badge links to the store, opens safely and is tracked', async ({ page }) => {
    await page.goto('/');
    for (const a of await page.locator('a.play-badge').all()) {
      await expect(a).toHaveAttribute('href', 'https://play.google.com/store/apps/details?id=site.vglobal.android.casinog');
      await expect(a).toHaveAttribute('rel', /noopener/);
      await expect(a).toHaveAttribute('data-track', 'play_store_click');
      await expect(a.locator('img')).toHaveAttribute('alt', 'Get it on Google Play');
    }
  });
});

test.describe('navigation', () => {
  test('desktop nav is one line and at most 72px tall', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop only');
    await page.goto('/');
    expect((await page.locator('header.site-nav').boundingBox()).height).toBeLessThanOrEqual(72);
    const tops = await page.locator('.site-nav__menu a').evaluateAll((as) => as.map((a) => Math.round(a.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
  });

  test('mobile menu opens, closes on Escape and after picking a link', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'mobile only');
    await page.goto('/');
    const toggle = page.locator('[data-nav-toggle]');
    const firstLink = page.locator('.site-nav__menu a').first();
    await expect(firstLink).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(firstLink).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await toggle.click();
    await page.locator('.site-nav__menu a', { hasText: 'FAQ' }).click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
```

`tests/unit/set-domain.test.mjs`:
```js
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
```

- [ ] **Step 2: 실패를 확인한다**

Run: `node --test tests/unit/set-domain.test.mjs`
Expected: FAIL(`scripts/set-domain.sh` ENOENT)

Run: `npx playwright test tests/e2e/shell.spec.mjs --project=desktop`
Expected: FAIL. 옛 `index.html`이라 `header.site-nav`가 없고, CSP meta도 없다.

- [ ] **Step 3: `scripts/set-domain.sh`를 만든다**

```bash
#!/usr/bin/env bash
# 사이트 주소(호스트)를 한 번에 바꾼다. 절대 주소는 HTML <head>, sitemap.xml, robots.txt, CNAME 에만 있다.
# 사용: scripts/set-domain.sh new.host.example   (현재 값은 CNAME 에서 읽는다)
# 바꾼 뒤 할 일(사람): GitHub Pages 설정의 Custom domain, DNS CNAME 레코드, Search Console 등록.
set -euo pipefail
cd "$(dirname "$0")/.."
NEW="${1:?usage: scripts/set-domain.sh <new-host>}"
if [[ ! "$NEW" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]]; then
  echo "invalid host: $NEW" >&2
  exit 2
fi
OLD="$(tr -d '[:space:]' < CNAME)"
if [[ "$OLD" == "$NEW" ]]; then
  echo "already $NEW"
  exit 0
fi
for f in index.html privacy-policy.html terms-of-service.html 404.html sitemap.xml robots.txt CNAME; do
  [[ -f "$f" ]] || continue
  if grep -qF "$OLD" "$f"; then
    OLD="$OLD" NEW="$NEW" perl -pi -e 's/\Q$ENV{OLD}\E/$ENV{NEW}/g' "$f"
    echo "updated $f"
  fi
done
```

Run: `chmod +x scripts/set-domain.sh && node --test tests/unit/set-domain.test.mjs`
Expected: PASS(3개)

- [ ] **Step 4: Lucide 아이콘 원본과 라이선스를 확인한다**

```bash
TMP="$(mktemp -d)"
LV="$(npm view lucide-static version)"
npm pack "lucide-static@$LV" --pack-destination "$TMP" >/dev/null
tar -xzf "$TMP"/lucide-static-*.tgz -C "$TMP"
for n in menu x chevron-down chevron-left chevron-right message-circle; do echo "== $n"; cat "$TMP/package/icons/$n.svg"; done
cat "$TMP/package/LICENSE"
echo "lucide-static $LV"
```
Expected: 아이콘 6개의 SVG와 ISC 라이선스 전문이 나온다. 아래 HTML의 `<path>`·`<line>` 값이 출력과 다르면 출력 값으로 바꾼다.

`assets/LICENSES.md`(위에서 출력한 LICENSE 전문을 그대로 붙인다):
````markdown
# Third-party notices

## Lucide icons (inline SVG: menu, x, chevron-down, chevron-left, chevron-right, message-circle)

Source: lucide-static <위에서 출력한 버전> — https://lucide.dev

```
<lucide-static 패키지의 LICENSE 전문>
```

Fonts and vendored libraries carry their own licenses in `assets/fonts/` and `assets/vendor/`.
````

- [ ] **Step 5: `assets/js/analytics.js`, `assets/js/nav.js`, `assets/js/main.js`를 만든다**

`assets/js/analytics.js`:
```js
// Google Analytics 4 초기화. CSP 때문에 인라인 스크립트 대신 파일로 둔다.
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
window.gtag = gtag;
gtag('js', new Date());
gtag('config', 'G-0JJDZ3R7EH');

// data-track 이 붙은 링크·버튼을 누르면 이벤트를 보낸다. 예: 설치 배지 → play_store_click(location: hero)
document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-track]');
  if (!el) return;
  gtag('event', el.dataset.track, { location: el.dataset.trackLocation || 'unknown' });
});
```

`assets/js/nav.js`:
```js
// 상단 메뉴: 첫 화면을 지나면 배경을 채우고(.is-solid), 모바일에서는 메뉴를 열고 닫는다(.is-open).
export function initNav(root = document) {
  const nav = root.querySelector('[data-nav]');
  if (!nav) return;
  const toggle = nav.querySelector('[data-nav-toggle]');
  const menu = nav.querySelector('#site-menu');
  const sentinel = root.querySelector('[data-nav-sentinel]');

  if (sentinel) {
    new IntersectionObserver(([entry]) => nav.classList.toggle('is-solid', !entry.isIntersecting)).observe(sentinel);
  } else {
    nav.classList.add('is-solid');
  }

  if (!toggle || !menu) return;
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (event) => { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
}
```

`assets/js/main.js`(Task 7·8에서 늘어난다):
```js
// 메인 페이지 시작점.
import { initNav } from './nav.js';

initNav();
```

- [ ] **Step 6: `assets/css/components.css`를 만든다**

```css
/* ── 판(panel): 보라 그라데이션 + 금테 + 빛 번짐·점무늬 ─────────────────────── */
.panel {
  position: relative;
  isolation: isolate;
  border-radius: var(--r-panel);
  background: var(--g-panel);
  box-shadow: var(--shadow-panel), 0 0 0 1px #3a1500;
}
.panel::before { /* 금테 3px: 테두리 영역만 남기는 마스크 */
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  padding: 3px;
  border-radius: inherit;
  background: var(--g-gold-rim);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  pointer-events: none;
}
.panel::after {
  content: "";
  position: absolute;
  inset: 3px;
  z-index: -1;
  border-radius: calc(var(--r-panel) - 3px);
  background:
    radial-gradient(120% 80% at 50% 0%, var(--c-glow), transparent 60%),
    radial-gradient(var(--c-dot) 1.5px, transparent 1.6px) 0 0 / 13px 13px;
  pointer-events: none;
}

/* ── 금색 제목: 금 그라데이션 글자 + 뒤에 깐 갈색 외곽선(::before) ─────────────── */
/* background-clip:text 위에 text-stroke 를 그리면 외곽선이 글자 안쪽을 덮으므로, 같은 글자를 뒤에 한 번 더 그린다.
   SplitText 로 단어를 나눈 뒤에는(.is-split) 단어(.gw)마다 같은 방식으로 그린다. */
.gold-title,
.gold-title .gw {
  position: relative;
  isolation: isolate;
  font-family: var(--font-display);
  font-weight: 900;
  letter-spacing: .01em;
  color: transparent;
  background: var(--g-gold-text);
  -webkit-background-clip: text;
  background-clip: text;
}
.gold-title {
  font-size: clamp(2rem, 1.2rem + 3.2vw, 3.5rem);
  line-height: 1.08;
  padding-block: .06em;
}
.gold-title::before,
.gold-title .gw::before {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute;
  inset: 0;
  z-index: -1;
  padding: inherit;
  background: none;
  color: var(--c-stroke-brown);
  -webkit-text-stroke: .13em var(--c-stroke-brown);
  filter: drop-shadow(0 .07em 0 rgba(40, 8, 0, .55));
}
.gold-title .gw { display: inline-block; }
.gold-title.is-split { background: none; }
.gold-title.is-split::before { content: none; }
.gold-title--xl { font-size: clamp(2.25rem, 1.2rem + 4.4vw, 4.5rem); }

/* 금 글자 위로 빛이 스친다(0.75s, 4.5s마다 — 클라이언트 잭팟 간판 값) */
.sweep-text {
  background:
    linear-gradient(105deg, transparent 42%, rgba(255, 255, 255, .95) 50%, transparent 58%) 160% 0 / 250% 100% no-repeat,
    var(--g-gold-text);
  -webkit-background-clip: text;
  background-clip: text;
  animation: text-sweep 4.5s infinite;
}
@keyframes text-sweep {
  0% { background-position: 160% 0, 0 0; animation-timing-function: cubic-bezier(.45, 0, .55, 1); }
  16.7%, 100% { background-position: -60% 0, 0 0; }
}

/* ── 사탕 버튼(보라): 아래 입술 5px, 위 광택, 마우스를 올리면 빛 스침 ───────────── */
.btn {
  --btn-h: 52px;
  --btn-fill: var(--g-btn-purple);
  --btn-lip: var(--c-lip-purple);
  --btn-stroke: var(--c-btn-stroke-purple);
  --btn-shadow: rgba(30, 8, 70, .55);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5em;
  min-height: var(--btn-h);
  margin-bottom: 5px;
  padding: 0 1.6em;
  border: 1.5px solid rgba(20, 4, 40, .7);
  border-radius: var(--r-pill);
  background: var(--btn-fill);
  box-shadow: 0 5px 0 var(--btn-lip), var(--shadow-btn), inset 0 1.5px 0 rgba(255, 255, 255, .65);
  color: #fff;
  font-family: var(--font-display);
  font-size: 1.125rem;
  letter-spacing: .02em;
  text-decoration: none;
  text-shadow:
    1.25px 0 var(--btn-stroke), -1.25px 0 var(--btn-stroke), 0 1.25px var(--btn-stroke), 0 -1.25px var(--btn-stroke),
    0 3px 3px var(--btn-shadow);
  cursor: pointer;
  transform-origin: 50% 60%;
}
.btn::before { /* 위쪽 46% 광택 */
  content: "";
  position: absolute;
  inset: 0 0 54% 0;
  z-index: -1;
  border-radius: var(--r-pill) var(--r-pill) 40% 40% / var(--r-pill) var(--r-pill) 100% 100%;
  background: linear-gradient(rgba(255, 255, 255, .38), rgba(255, 255, 255, .08));
}
.btn::after { /* 빛 스침 띠 */
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -40%;
  width: 30%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .55), transparent);
  transform: translateX(-100%) skewX(-24deg);
  pointer-events: none;
}
.btn:hover::after { animation: btn-shine .6s cubic-bezier(.45, 0, .55, 1); }
@keyframes btn-shine { to { transform: translateX(560%) skewX(-24deg); } }
.btn:disabled {
  --btn-fill: var(--g-btn-disabled);
  --btn-lip: var(--c-lip-disabled);
  --btn-stroke: var(--c-btn-stroke-disabled);
  cursor: default;
}
.btn:disabled::after { display: none; }
.btn--icon { width: var(--btn-h); padding: 0; }
.btn svg { width: 22px; height: 22px; filter: drop-shadow(0 1.5px 0 var(--btn-stroke)); }

/* ── 알약·태그 ─────────────────────────────────────────────────────────── */
.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.6em;
  height: 1.75em;
  padding: 0 .6em;
  border-radius: var(--r-pill);
  font-family: var(--font-display);
  font-size: .8125rem;
  letter-spacing: .02em;
}
.pill--age {
  background: var(--g-badge-gold);
  color: #4a1d00;
  box-shadow: var(--shadow-pill), inset 0 1px 0 rgba(255, 255, 255, .7);
}
.tag {
  display: inline-block;
  padding: .2em .75em;
  border: 1.5px solid var(--c-line);
  border-radius: var(--r-pill);
  background: var(--c-inset);
  color: var(--c-text-dim);
  font-size: .8125rem;
  font-weight: 600;
}

/* ── Google Play 공식 배지: 그림은 그대로, 장식은 뒤쪽 빛만 ─────────────────── */
.play-badge {
  position: relative;
  isolation: isolate;
  display: inline-block;
  line-height: 0;
  border-radius: 14px;
}
.play-badge img { width: var(--badge-w, 200px); height: auto; }
.play-badge--sm { --badge-w: 150px; }
.play-badge--lg { --badge-w: clamp(180px, 20vw, 240px); }
.play-badge--xl { --badge-w: clamp(220px, 26vw, 300px); }
.play-badge::before {
  content: "";
  position: absolute;
  inset: -18% -10%;
  z-index: -1;
  border-radius: var(--r-pill);
  background: radial-gradient(closest-side, rgba(255, 197, 58, .55), rgba(255, 197, 58, 0));
  opacity: 0;
  transform: scale(.8);
  pointer-events: none;
}
.play-badge:hover::before { opacity: .6; transform: scale(1); transition: opacity .25s, transform .25s; }
.play-badge.is-celebrating::before { animation: badge-glow 1.2s ease-out 2; }
@keyframes badge-glow {
  0% { opacity: 0; transform: scale(.8); }
  35% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0; transform: scale(1.25); }
}

/* ── 스크린샷 틀 ──────────────────────────────────────────────────────── */
.shot {
  overflow: hidden;
  border-radius: var(--r-inset);
  background: var(--c-inset);
  box-shadow: 0 0 0 1.5px rgba(255, 210, 87, .45), 0 12px 30px rgba(0, 0, 0, .5);
}
.shot img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }

/* ── 상단 메뉴 ────────────────────────────────────────────────────────── */
.nav-sentinel { position: absolute; top: 0; left: 0; width: 1px; height: 24px; pointer-events: none; }
.site-nav {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: var(--z-nav);
  height: var(--nav-h);
  transition: background-color .3s, box-shadow .3s;
}
.site-nav.is-solid,
.site-nav.is-open {
  background-color: rgba(21, 8, 48, .88);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  backdrop-filter: blur(14px) saturate(1.2);
  box-shadow: 0 1px 0 rgba(255, 210, 87, .22), 0 10px 30px rgba(0, 0, 0, .35);
}
.site-nav__inner { display: flex; align-items: center; gap: 24px; height: 100%; }
.brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
.brand__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  box-shadow: 0 0 0 1.5px rgba(255, 210, 87, .6), 0 4px 10px rgba(0, 0, 0, .4);
}
.brand__name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: transparent;
  background: var(--g-gold-text);
  -webkit-background-clip: text;
  background-clip: text;
}
.site-nav__menu { display: flex; gap: 28px; margin-left: auto; }
.site-nav__menu a { position: relative; padding: 8px 2px; color: var(--c-text); font-weight: 600; text-decoration: none; }
.site-nav__menu a::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  height: 2px;
  background: var(--g-gold-short);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .25s;
}
.site-nav__menu a:hover::after,
.site-nav__menu a:focus-visible::after { transform: scaleX(1); }
.site-nav__toggle { display: none; }
.site-nav__toggle .icon-close,
.site-nav.is-open .site-nav__toggle .icon-menu { display: none; }
.site-nav.is-open .site-nav__toggle .icon-close { display: block; }

@media (max-width: 767px) {
  .site-nav__inner { gap: 12px; }
  .site-nav__menu {
    position: fixed;
    inset: var(--nav-h) 0 auto 0;
    flex-direction: column;
    gap: 0;
    margin: 0;
    padding: 8px var(--gutter) 20px;
    background: rgba(21, 8, 48, .97);
    border-bottom: 1px solid rgba(255, 210, 87, .22);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px);
    transition: opacity .2s, transform .2s, visibility .2s;
  }
  .site-nav.is-open .site-nav__menu { opacity: 1; visibility: visible; transform: none; }
  .site-nav__menu a { padding: 14px 0; border-bottom: 1px solid rgba(190, 150, 255, .14); font-size: 1.125rem; }
  .site-nav .play-badge--sm { --badge-w: 120px; margin-left: auto; }
  .site-nav__toggle {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1.5px solid var(--c-line);
    border-radius: 12px;
    background: var(--c-inset);
    cursor: pointer;
  }
}
@media (max-width: 419px) {
  .brand__name { display: none; }
}

/* ── 하단 ─────────────────────────────────────────────────────────────── */
.site-footer {
  padding-block: 56px 28px;
  background: var(--c-bg-deep);
  border-top: 1px solid rgba(255, 210, 87, .18);
}
.site-footer__grid { display: grid; grid-template-columns: 1.2fr 1fr 2fr; gap: 32px 48px; }
.site-footer__tagline { margin-top: 12px; color: var(--c-text-dim); }
.site-footer__links { display: grid; gap: 10px; align-content: start; }
.site-footer__links a { color: var(--c-text); text-decoration: none; }
.site-footer__links a:hover { text-decoration: underline; text-underline-offset: 4px; }
.site-footer__notice {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: start;
  color: var(--c-text-dim);
  font-size: .9375rem;
}
.site-footer__bottom {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid rgba(190, 150, 255, .14);
  color: var(--c-text-dim);
  font-size: .875rem;
}
@media (max-width: 899px) {
  .site-footer__grid { grid-template-columns: 1fr; }
}

/* ── FAQ(접었다 펴는 목록, 클라이언트 일반 줄 색) ───────────────────────────── */
.faq__list { display: grid; gap: 12px; margin-top: 32px; }
.faq__item {
  border-radius: var(--r-row);
  background: var(--g-row);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .1), 0 6px 16px rgba(0, 0, 0, .35);
}
.faq__item summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  font-size: 1.125rem;
  font-weight: 600;
  list-style: none;
  cursor: pointer;
}
.faq__item summary::-webkit-details-marker { display: none; }
.faq__item summary svg { flex: none; width: 22px; height: 22px; transition: transform .25s; }
.faq__item[open] summary svg { transform: rotate(180deg); }
.faq__answer { padding: 0 22px 20px; }
.faq__answer a { color: var(--c-gold-light); }
```

- [ ] **Step 7: `index.html`을 새 틀로 바꾼다(`<main>`은 비워 둔다)**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://www.googletagmanager.com; connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com; img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Golden Hour – Slots Casino | 60+ Free 3D Slot Games</title>
  <meta name="description" content="Spin 60+ unique 3D slot machines, catch Lucky Time boosts, chase jackpots and climb the rankings in Golden Hour – Slots Casino. Free to play on Android.">
  <link rel="canonical" href="https://sscgl.vglobal.site/">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#150830">
  <meta name="color-scheme" content="dark">
  <meta name="application-name" content="Golden Hour">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Golden Hour – Slots Casino">
  <meta property="og:title" content="Golden Hour – Slots Casino">
  <meta property="og:description" content="60+ unique 3D slots, Lucky Time boosts, jackpots and social rankings. Free to play on Android.">
  <meta property="og:url" content="https://sscgl.vglobal.site/">
  <meta property="og:image" content="https://sscgl.vglobal.site/assets/img/og/og-golden-hour.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Golden Hour – Slots Casino key art: a 777 slot machine at sunset">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Golden Hour – Slots Casino">
  <meta name="twitter:description" content="60+ unique 3D slots, Lucky Time boosts, jackpots and social rankings. Free to play on Android.">
  <meta name="twitter:image" content="https://sscgl.vglobal.site/assets/img/og/og-golden-hour.jpg">

  <link rel="icon" href="favicon.ico" sizes="48x48">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/img/brand/favicon-32.png">
  <link rel="apple-touch-icon" href="assets/img/brand/apple-touch-icon.png">

  <link rel="preload" href="assets/fonts/gh-display-900.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" as="image" imagesrcset="assets/img/hero/splash-wide-960.webp 960w, assets/img/hero/splash-wide-1440.webp 1440w, assets/img/hero/splash-wide-1914.webp 1914w" imagesizes="100vw" media="(min-aspect-ratio: 1001/1000)">
  <link rel="preload" as="image" imagesrcset="assets/img/hero/keyart-square-600.webp 600w, assets/img/hero/keyart-square-900.webp 900w, assets/img/hero/keyart-square-1254.webp 1254w" imagesizes="100vw" media="(max-aspect-ratio: 1/1)">

  <link rel="stylesheet" href="assets/vendor/swiper-14.3.0/swiper-bundle.min.css">
  <link rel="stylesheet" href="assets/vendor/lenis-1.3.26/lenis.css">
  <link rel="stylesheet" href="assets/css/tokens.css">
  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/components.css">

  <script defer src="assets/js/analytics.js"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-0JJDZ3R7EH"></script>
  <script defer src="assets/vendor/gsap-3.15.0/gsap.min.js"></script>
  <script defer src="assets/vendor/gsap-3.15.0/ScrollTrigger.min.js"></script>
  <script defer src="assets/vendor/gsap-3.15.0/SplitText.min.js"></script>
  <script defer src="assets/vendor/lenis-1.3.26/lenis.min.js"></script>
  <script defer src="assets/vendor/swiper-14.3.0/swiper-bundle.min.js"></script>
  <script defer src="assets/vendor/canvas-confetti-1.9.4/confetti.browser.js"></script>
  <script type="module" src="assets/js/main.js"></script>

  <script type="application/ld+json">
  [
    {
      "@context": "https://schema.org",
      "@type": "MobileApplication",
      "name": "Golden Hour - Slots Casino",
      "alternateName": "Golden Hour",
      "description": "Golden Hour is a social casino game with 60+ unique 3D slot machines, Lucky Time boosts, jackpots, floors to unlock, rankings and social play. For entertainment only; no real-money gambling.",
      "applicationCategory": "GameApplication",
      "applicationSubCategory": "Casino",
      "operatingSystem": "Android",
      "contentRating": "18+",
      "url": "https://sscgl.vglobal.site/",
      "installUrl": "https://play.google.com/store/apps/details?id=site.vglobal.android.casinog",
      "image": "https://sscgl.vglobal.site/assets/img/og/og-golden-hour.jpg",
      "screenshot": [
        "https://sscgl.vglobal.site/assets/img/features/lobby-1600.webp",
        "https://sscgl.vglobal.site/assets/img/features/jackpot-1600.webp",
        "https://sscgl.vglobal.site/assets/img/features/floors-1600.webp",
        "https://sscgl.vglobal.site/assets/img/features/ranking-1600.webp"
      ],
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "publisher": { "@type": "Organization", "name": "Vglobal Co., Ltd." }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Golden Hour – Slots Casino",
      "url": "https://sscgl.vglobal.site/"
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Vglobal Co., Ltd.",
      "url": "https://sscgl.vglobal.site/",
      "logo": "https://sscgl.vglobal.site/assets/img/brand/icon-512.png",
      "email": "vglobalinfo24@gmail.com",
      "sameAs": [
        "https://homejapan.wixsite.com/vglobal",
        "https://play.google.com/store/apps/details?id=site.vglobal.android.casinog"
      ]
    }
  ]
  </script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="nav-sentinel" aria-hidden="true" data-nav-sentinel></div>

  <header class="site-nav" data-nav>
    <div class="site-nav__inner container">
      <a class="brand" href="./" aria-label="Golden Hour home">
        <img class="brand__icon" src="assets/img/brand/app-icon-128.webp" alt="" width="128" height="128">
        <span class="brand__name">Golden Hour</span>
      </a>
      <nav class="site-nav__menu" id="site-menu" aria-label="Primary">
        <a href="#slots">Slots</a>
        <a href="#lucky-time">Features</a>
        <a href="#faq">FAQ</a>
      </nav>
      <a class="play-badge play-badge--sm" href="https://play.google.com/store/apps/details?id=site.vglobal.android.casinog" target="_blank" rel="noopener" data-track="play_store_click" data-track-location="nav">
        <img src="assets/img/badges/google-play-en.png" alt="Get it on Google Play" width="646" height="250">
      </a>
      <button class="site-nav__toggle" type="button" aria-controls="site-menu" aria-expanded="false" data-nav-toggle>
        <span class="sr-only">Menu</span>
        <svg class="icon-menu" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        <svg class="icon-close" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  </header>

  <main id="main"></main>

  <footer class="site-footer">
    <div class="container site-footer__grid">
      <div>
        <a class="brand" href="./">
          <img class="brand__icon" src="assets/img/brand/app-icon-128.webp" alt="" width="128" height="128" loading="lazy">
          <span class="brand__name">Golden Hour</span>
        </a>
        <p class="site-footer__tagline">60+ unique 3D slots. Free to play on Android.</p>
      </div>
      <nav class="site-footer__links" aria-label="Footer">
        <a href="privacy-policy.html">Privacy Policy</a>
        <a href="terms-of-service.html">Terms of Service</a>
        <a href="mailto:vglobalinfo24@gmail.com">Support</a>
        <a href="https://homejapan.wixsite.com/vglobal" target="_blank" rel="noopener">About Vglobal</a>
      </nav>
      <div class="site-footer__notice">
        <span class="pill pill--age">18+</span>
        <p>Golden Hour is a social casino game intended for an adult audience (18+) and for entertainment purposes only. It does not offer real-money gambling or an opportunity to win cash, real-world prizes or anything of monetary value. Virtual chips and other in-game items have no cash value. Practice or success at social casino gaming does not imply future success at real-money gambling.</p>
      </div>
    </div>
    <div class="container site-footer__bottom">
      <p>© 2026 Vglobal Co., Ltd. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>
```
Step 4 출력과 SVG 값이 다르면 출력 값을 쓴다.

- [ ] **Step 8: `sitemap.xml`을 바꾼다(중복 `/index.html`과 404 제외)**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://sscgl.vglobal.site/</loc>
    <lastmod>2026-10-08</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://sscgl.vglobal.site/privacy-policy.html</loc>
    <lastmod>2026-10-08</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://sscgl.vglobal.site/terms-of-service.html</loc>
    <lastmod>2026-10-08</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>
```
`robots.txt`는 그대로 둔다(주소는 `set-domain.sh`가 관리).

- [ ] **Step 9: 테스트와 점검을 돌린다**

Run: `npx playwright test tests/e2e/shell.spec.mjs`
Expected: 3개 프로젝트 모두 PASS. 프로젝트 전용 테스트는 다른 프로젝트에서 skip된다.

Run: `node scripts/verify.mjs --check refs,inline`
Expected: `index.html`에 대한 오류가 없다. `privacy-policy.html`·`terms-of-service.html`·`404.html`의 옛 오류는 Task 9에서 없앤다.

- [ ] **Step 10: 커밋한다**

```bash
git add index.html sitemap.xml assets/css/components.css assets/js/main.js assets/js/nav.js assets/js/analytics.js assets/LICENSES.md scripts/set-domain.sh tests/unit/set-domain.test.mjs tests/e2e/shell.spec.mjs
git commit -m "feat(site): new page shell with CSP, Golden Hour metadata, nav and footer"
```

---
### Task 6: 메인 페이지 섹션(정적 배치)

**Files:**
- Create: `assets/css/sections.css`, `tests/e2e/layout.spec.mjs`
- Modify: `index.html`(`<head>`에 sections.css 링크 추가, `<main id="main"></main>` 채우기)

**Interfaces:**
- Consumes: Task 5의 컴포넌트 클래스, Task 4의 이미지
- Produces(Task 7·8의 JS가 찾는 HTML 표시):
  - 첫 화면
    - `.hero`(상태 클래스 `.is-interactive`), `.hero__stage`, `.hero__art`
    - `[data-reels]`(`data-state`: `idle|spinning|landed|static`, `data-result`: 심볼 id) > `.reel` > `.reel__strip`
    - `[data-spin]`(처음엔 `disabled`), `[data-particles]`, `[data-confetti]`, `[data-play-badge]`
  - 섹션
    - `[data-slots]`(Swiper 루트), `.slots__prev`, `.slots__next`
    - `[data-jackpot]`, `[data-odometer]`(`data-start`)
    - `[data-floors]` > `[data-tower]`(`data-unlocked`) > `.floor`(`data-floor` 1~5, 위에서부터 5F)
    - `[data-bonus]` > `.bonus__progress`, `.bonus__chip`
    - `[data-reveal]`(등장 연출 대상), `h2.gold-title[data-text]`
  - 릴 겹침 좌표: `.hero__stage`의 `--reels-x/y/w/h`, `--reel-cols`, `--reel-gap`

- [ ] **Step 1: e2e 테스트를 먼저 쓴다**

`tests/e2e/layout.spec.mjs`:
```js
import { test, expect } from './fixtures.mjs';

const SECTION_IDS = ['top', 'slots', 'lucky-time', 'floors', 'social', 'bonus', 'faq', 'download'];

test('sections appear in order with no console errors', async ({ page, problems }) => {
  await page.goto('/');
  const ids = await page.locator('main > section[id]').evaluateAll((s) => s.map((x) => x.id));
  expect(ids).toEqual(SECTION_IDS);
  await page.waitForLoadState('networkidle');
  expect(problems).toEqual([]);
});

test('no horizontal scrolling', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

test('hero shows a short lede and the play badge in the first viewport', async ({ page }) => {
  await page.goto('/');
  const badge = await page.locator('.hero [data-play-badge]').boundingBox();
  expect(badge.y + badge.height).toBeLessThanOrEqual(page.viewportSize().height);
  const words = (await page.locator('.hero__lede').textContent()).trim().split(/\s+/).length;
  expect(words).toBeLessThanOrEqual(20);
});

test('short screens keep the badge reachable', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'one run covers all sizes');
  // [화면, 배지 아래쪽이 들어와야 하는 높이 배수] — 가로 휴대폰은 한 번 스크롤까지 허용
  for (const [viewport, factor] of [[{ width: 1280, height: 720 }, 1], [{ width: 375, height: 667 }, 1], [{ width: 812, height: 375 }, 1.6]]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const badge = await page.locator('.hero [data-play-badge]').boundingBox();
    expect(badge.y + badge.height, JSON.stringify(viewport)).toBeLessThanOrEqual(viewport.height * factor);
  }
});

test('every image declares width, height and alt', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('img:not([width]), img:not([height])').count()).toBe(0);
  expect(await page.locator('img:not([alt])').count()).toBe(0);
});

test('one h1, and every section after the hero has an h2', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('h1').count()).toBe(1);
  for (const id of SECTION_IDS.slice(1)) expect(await page.locator(`#${id} h2`).count(), id).toBe(1);
});

test('content blocks have the planned counts', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('.slot-card').count()).toBe(12);
  expect(await page.locator('.bento > .bento__cell').count()).toBe(4);
  expect(await page.locator('[data-tower] .floor').count()).toBe(5);
  expect(await page.locator('.faq__item').count()).toBe(6);
});

test('jackpot area uses chips, never currency or live wording', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('#lucky-time').textContent();
  expect(text).not.toMatch(/[$€£¥₩]/);
  expect(text).not.toMatch(/\blive\b/i);
});

test('FAQ answers open', async ({ page }) => {
  await page.goto('/#faq');
  const first = page.locator('.faq__item').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('.faq__answer')).toContainText('No.');
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx playwright test tests/e2e/layout.spec.mjs --project=desktop`
Expected: FAIL(`main > section[id]`가 없어 `[]`가 나온다)

- [ ] **Step 3: `index.html`의 `<head>`에 섹션 CSS를 연결한다**

`<link rel="stylesheet" href="assets/css/components.css">` 바로 아래에 추가한다:
```html
  <link rel="stylesheet" href="assets/css/sections.css">
```

- [ ] **Step 4: `<main id="main"></main>`을 아래 내용으로 바꾼다**

```html
  <main id="main">
    <section class="hero" id="top" aria-label="Golden Hour – Slots Casino">
      <div class="hero__backdrop" aria-hidden="true">
        <picture>
          <source media="(max-aspect-ratio: 1/1)" srcset="assets/img/hero/keyart-square-600.webp 600w, assets/img/hero/keyart-square-900.webp 900w, assets/img/hero/keyart-square-1254.webp 1254w" sizes="100vw">
          <img src="assets/img/hero/splash-wide-960.webp" srcset="assets/img/hero/splash-wide-960.webp 960w, assets/img/hero/splash-wide-1440.webp 1440w, assets/img/hero/splash-wide-1914.webp 1914w" sizes="100vw" alt="" width="1914" height="822">
        </picture>
      </div>
      <div class="hero__stage">
        <h1 class="hero__title">
          <picture>
            <source media="(max-aspect-ratio: 1/1)" srcset="assets/img/hero/keyart-square-600.webp 600w, assets/img/hero/keyart-square-900.webp 900w, assets/img/hero/keyart-square-1254.webp 1254w" sizes="100vw" width="1254" height="1254">
            <img class="hero__art" src="assets/img/hero/splash-wide-1440.webp" srcset="assets/img/hero/splash-wide-960.webp 960w, assets/img/hero/splash-wide-1440.webp 1440w, assets/img/hero/splash-wide-1914.webp 1914w" sizes="100vw" alt="Golden Hour – Slots Casino" width="1914" height="822" fetchpriority="high">
          </picture>
        </h1>
        <div class="reels" data-reels data-state="idle" aria-hidden="true">
          <div class="reel"><div class="reel__strip"></div></div>
          <div class="reel"><div class="reel__strip"></div></div>
          <div class="reel"><div class="reel__strip"></div></div>
        </div>
      </div>
      <canvas class="hero__fx" data-particles aria-hidden="true"></canvas>
      <canvas class="hero__confetti" data-confetti aria-hidden="true"></canvas>
      <div class="hero__copy container">
        <p class="hero__lede">Spin 60+ unique 3D slot machines, catch Lucky Time boosts and chase jackpots. Free to play.</p>
        <div class="hero__actions">
          <a class="play-badge play-badge--lg" href="https://play.google.com/store/apps/details?id=site.vglobal.android.casinog" target="_blank" rel="noopener" data-track="play_store_click" data-track-location="hero" data-play-badge>
            <img src="assets/img/badges/google-play-en.png" alt="Get it on Google Play" width="646" height="250">
          </a>
          <button class="btn hero__spin" type="button" data-spin data-track="hero_spin" data-track-location="hero" disabled>Spin</button>
        </div>
        <p class="hero__legal"><span class="pill pill--age">18+</span> For entertainment only. No real-money gambling.</p>
      </div>
    </section>

    <section class="section slots" id="slots" aria-labelledby="slots-title">
      <div class="container section__head">
        <h2 class="gold-title" id="slots-title" data-text="60+ Unique 3D Slots">60+ Unique 3D Slots</h2>
        <p class="section__lede" data-reveal>From classic sevens to fantasy, adventure and seasonal themes. Every machine has its own symbols, animations and bonus features.</p>
      </div>
      <div class="slots__carousel swiper" data-slots>
        <div class="swiper-wrapper">
          <div class="swiper-slide"><figure class="slot-card"><img src="assets/img/slots/golden-fruits.webp" alt="" width="273" height="282" loading="lazy" decoding="async"><figcaption><span class="slot-card__name">Golden Fruits</span><span class="tag">Classic</span></figcaption></figure></div>
          <div class="swiper-slide"><figure class="slot-card"><img src="assets/img/slots/fairy-garden.webp" alt="" width="273" height="282" loading="lazy" decoding="async"><figcaption><span class="slot-card__name">Fairy Garden</span><span class="tag">Fantasy</span></figcaption></figure></div>
          <div class="swiper-slide"><figure class="slot-card"><img src="assets/img/slots/treasure-island.webp" alt="" width="273" height="282" loading="lazy" decoding="async"><figcaption><span class="slot-card__name">Treasure Island</span><span class="tag">Adventure</span></figcaption></figure></div>
          <div class="swiper-slide"><figure class="slot-card"><img src="assets/img/slots/halloween-witch.webp" alt="" width="273" height="282" loading="lazy" decoding="async"><figcaption><span class="slot-card__name">Halloween Witch</span><span class="tag">Seasonal</span></figcaption></figure></div>
          <div class="swiper-slide"><figure class="slot-card"><img src="assets/img/slots/zombie-hunter.webp" alt="" width="273" height="282" loading="lazy" decoding="async"><figcaption><span class="slot-card__name">Zombie Hunter</span><span class="tag">Character</span></figcaption></figure></div>
          <div class="swiper-slide"><figure class="slot-card"><img src="assets/img/slots/aladdin.webp" alt="" width="273" height="282" loading="lazy" decoding="async"><figcaption><span class="slot-card__name">Aladdin</span><span class="tag">Fantasy</span></figcaption></figure></div>
          <div class="swiper-slide"><figure class="slot-card"><img src="assets/img/slots/cash-fever.webp" alt="" width="273" height="282" loading="lazy" decoding="async"><figcaption><span class="slot-card__name">Cash Fever</span><span class="tag">Classic</span></figcaption></figure></div>
          <div class="swiper-slide"><figure class="slot-card"><img src="assets/img/slots/curse-of-the-pharaohs.webp" alt="" width="273" height="282" loading="lazy" decoding="async"><figcaption><span class="slot-card__name">Curse of the Pharaohs</span><span class="tag">Adventure</span></figcaption></figure></div>
          <div class="swiper-slide"><figure class="slot-card"><img src="assets/img/slots/christmas-miracle.webp" alt="" width="273" height="282" loading="lazy" decoding="async"><figcaption><span class="slot-card__name">Christmas Miracle</span><span class="tag">Seasonal</span></figcaption></figure></div>
          <div class="swiper-slide"><figure class="slot-card"><img src="assets/img/slots/gangsters-poker.webp" alt="" width="273" height="282" loading="lazy" decoding="async"><figcaption><span class="slot-card__name">Gangsters Poker</span><span class="tag">Character</span></figcaption></figure></div>
          <div class="swiper-slide"><figure class="slot-card"><img src="assets/img/slots/excalibur.webp" alt="" width="273" height="282" loading="lazy" decoding="async"><figcaption><span class="slot-card__name">Excalibur</span><span class="tag">Fantasy</span></figcaption></figure></div>
          <div class="swiper-slide"><figure class="slot-card"><img src="assets/img/slots/titan.webp" alt="" width="273" height="282" loading="lazy" decoding="async"><figcaption><span class="slot-card__name">Titan</span><span class="tag">Fantasy</span></figcaption></figure></div>
        </div>
      </div>
      <div class="slots__nav">
        <button class="btn btn--icon slots__prev" type="button" aria-label="Previous slot"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>
        <button class="btn btn--icon slots__next" type="button" aria-label="Next slot"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>
      </div>
    </section>

    <section class="section lucky" id="lucky-time" aria-labelledby="lucky-title">
      <div class="container lucky__grid">
        <div class="jackpot panel" data-jackpot data-reveal>
          <img class="jackpot__crown" src="assets/img/icons/crown.webp" alt="" width="216" height="180" loading="lazy">
          <p class="jackpot__sign gold-title sweep-text" data-text="MAJOR JACKPOT" aria-hidden="true">MAJOR JACKPOT</p>
          <p class="jackpot__value">
            <img class="jackpot__chip" src="assets/img/icons/chip.webp" alt="" width="152" height="152" loading="lazy">
            <span class="odometer" data-odometer data-start="2847300150" role="img" aria-label="Major jackpot counter in virtual chips">2,847,300,150</span>
          </p>
          <p class="jackpot__note">Virtual chips. No cash value.</p>
        </div>
        <div class="lucky__copy">
          <h2 class="gold-title" id="lucky-title" data-text="Lucky Time &amp; Jackpots">Lucky Time &amp; Jackpots</h2>
          <p data-reveal>Lucky Time adds limited-time boosts and bonus chances to your session. Feel the rush when the Major Jackpot lands on your favorite slot.</p>
          <img class="lucky__badge" src="assets/img/features/lucky-time-badge.webp" alt="Lucky Time badge" width="384" height="98" loading="lazy" data-reveal>
          <div class="lucky__shots">
            <figure class="shot" data-reveal><img src="assets/img/features/lucky-time-960.webp" srcset="assets/img/features/lucky-time-960.webp 960w, assets/img/features/lucky-time-1600.webp 1600w" sizes="(min-width: 900px) 320px, 46vw" alt="Lucky Time active in the Excalibur slot" width="1920" height="1080" loading="lazy" decoding="async"></figure>
            <figure class="shot" data-reveal><img src="assets/img/features/jackpot-960.webp" srcset="assets/img/features/jackpot-960.webp 960w, assets/img/features/jackpot-1600.webp 1600w" sizes="(min-width: 900px) 320px, 46vw" alt="Major Jackpot win in the Titan slot" width="1920" height="1080" loading="lazy" decoding="async"></figure>
          </div>
        </div>
      </div>
    </section>

    <section class="section floors" id="floors" aria-labelledby="floors-title" data-floors>
      <div class="container floors__grid">
        <div class="floors__copy">
          <h2 class="gold-title" id="floors-title" data-text="Level Up. Unlock New Floors.">Level Up. Unlock New Floors.</h2>
          <p data-reveal>Keep playing to open new areas of Golden Hour. As your level rises and your virtual chip balance grows, higher floors unlock with new slot machines and bigger challenges.</p>
          <figure class="shot" data-reveal><img src="assets/img/features/floors-960.webp" srcset="assets/img/features/floors-960.webp 960w, assets/img/features/floors-1600.webp 1600w" sizes="(min-width: 1024px) 520px, 92vw" alt="A new floor unlocking in the Golden Hour lobby" width="1920" height="1080" loading="lazy" decoding="async"></figure>
        </div>
        <ol class="tower" data-tower data-unlocked="0" reversed aria-label="Floors 1 to 5">
          <li class="floor" data-floor="5"><span class="floor__no">5F</span><span class="floor__slots"><img src="assets/img/slots/titan.webp" alt="" width="273" height="282" loading="lazy"><img src="assets/img/slots/halloween-witch.webp" alt="" width="273" height="282" loading="lazy"></span><img class="floor__lock" src="assets/img/icons/lock.webp" alt="" width="64" height="92" loading="lazy"></li>
          <li class="floor" data-floor="4"><span class="floor__no">4F</span><span class="floor__slots"><img src="assets/img/slots/excalibur.webp" alt="" width="273" height="282" loading="lazy"><img src="assets/img/slots/gangsters-poker.webp" alt="" width="273" height="282" loading="lazy"></span><img class="floor__lock" src="assets/img/icons/lock.webp" alt="" width="64" height="92" loading="lazy"></li>
          <li class="floor" data-floor="3"><span class="floor__no">3F</span><span class="floor__slots"><img src="assets/img/slots/aladdin.webp" alt="" width="273" height="282" loading="lazy"><img src="assets/img/slots/zombie-hunter.webp" alt="" width="273" height="282" loading="lazy"></span><img class="floor__lock" src="assets/img/icons/lock.webp" alt="" width="64" height="92" loading="lazy"></li>
          <li class="floor" data-floor="2"><span class="floor__no">2F</span><span class="floor__slots"><img src="assets/img/slots/treasure-island.webp" alt="" width="273" height="282" loading="lazy"><img src="assets/img/slots/fairy-garden.webp" alt="" width="273" height="282" loading="lazy"></span><img class="floor__lock" src="assets/img/icons/lock.webp" alt="" width="64" height="92" loading="lazy"></li>
          <li class="floor" data-floor="1"><span class="floor__no">1F</span><span class="floor__slots"><img src="assets/img/slots/golden-fruits.webp" alt="" width="273" height="282" loading="lazy"><img src="assets/img/slots/cash-fever.webp" alt="" width="273" height="282" loading="lazy"></span><img class="floor__lock" src="assets/img/icons/lock.webp" alt="" width="64" height="92" loading="lazy"></li>
        </ol>
      </div>
    </section>

    <section class="section social" id="social" aria-labelledby="social-title">
      <div class="container">
        <div class="section__head">
          <h2 class="gold-title" id="social-title" data-text="Rankings &amp; Social Play">Rankings &amp; Social Play</h2>
          <p class="section__lede" data-reveal>Compare your best wins with other players, climb the Daily Top 25 and play together with friends.</p>
        </div>
        <div class="bento">
          <article class="bento__cell bento__cell--rank" data-reveal>
            <img src="assets/img/features/ranking-960.webp" srcset="assets/img/features/ranking-960.webp 960w, assets/img/features/ranking-1600.webp 1600w" sizes="(min-width: 900px) 600px, 92vw" alt="Top Win and Daily Top 25 rankings" width="1920" height="1080" loading="lazy" decoding="async">
            <div class="bento__text"><h3>Top Win &amp; Daily Top 25</h3><p>Climb the rankings and beat your own records.</p></div>
          </article>
          <article class="bento__cell bento__cell--friends" data-reveal>
            <img class="bento__icon" src="assets/img/icons/crown-chip.webp" alt="" width="256" height="256" loading="lazy">
            <h3>Add &amp; follow friends</h3><p>Follow the players you meet at the machines.</p>
          </article>
          <article class="bento__cell bento__cell--gifts" data-reveal>
            <img class="bento__icon" src="assets/img/icons/gift.webp" alt="" width="256" height="256" loading="lazy">
            <h3>Send gifts</h3><p>Share virtual chip gifts with your friends.</p>
          </article>
          <article class="bento__cell bento__cell--messages" data-reveal>
            <svg class="bento__icon bento__icon--svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#msg-gold)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs><linearGradient id="msg-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff5c6"/><stop offset=".5" stop-color="#ffc53a"/><stop offset="1" stop-color="#e27d00"/></linearGradient></defs><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
            <h3>Message players</h3><p>Chat with the people you play with, right inside the game.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section bonus" id="bonus" aria-labelledby="bonus-title" data-bonus>
      <div class="container bonus__inner">
        <div class="bonus__ring" aria-hidden="true" data-reveal>
          <svg viewBox="0 0 220 220">
            <defs><linearGradient id="ring-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff5c6"/><stop offset=".5" stop-color="#ffc53a"/><stop offset="1" stop-color="#e27d00"/></linearGradient></defs>
            <circle class="bonus__track" cx="110" cy="110" r="96"/>
            <circle class="bonus__progress" cx="110" cy="110" r="96" pathLength="100"/>
          </svg>
          <div class="bonus__face">
            <img class="bonus__chip" src="assets/img/icons/chip.webp" alt="" width="152" height="152" loading="lazy">
            <span class="bonus__time">4:00:00</span>
          </div>
        </div>
        <h2 class="gold-title" id="bonus-title" data-text="Bonus Chips Every 4 Hours">Bonus Chips Every 4 Hours</h2>
        <p class="section__lede" data-reveal>Check in every four hours to collect a virtual chip bonus and keep playing your favorite slots and events.</p>
      </div>
    </section>

    <div class="team" role="note" aria-label="About the team">
      <div class="container team__inner" data-reveal>
        <p class="team__text">Crafted by a team with <strong>10+ years</strong> in social casino games.</p>
        <img class="team__logo" src="assets/img/brand/vglobal-logo.webp" alt="Vglobal" width="480" height="360" loading="lazy">
      </div>
    </div>

    <section class="section faq" id="faq" aria-labelledby="faq-title">
      <div class="container container--narrow">
        <div class="section__head">
          <h2 class="gold-title" id="faq-title" data-text="FAQ">FAQ</h2>
        </div>
        <div class="faq__list">
          <details class="faq__item" data-reveal>
            <summary>Is Golden Hour real-money gambling?<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
            <div class="faq__answer"><p>No. Golden Hour is a social casino game for entertainment only. You can't win cash or real-world prizes, and virtual chips have no cash value.</p></div>
          </details>
          <details class="faq__item" data-reveal>
            <summary>Is it free to play?<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
            <div class="faq__answer"><p>Yes. Golden Hour is free to download and play. Optional in-app purchases are available.</p></div>
          </details>
          <details class="faq__item" data-reveal>
            <summary>Who can play?<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
            <div class="faq__answer"><p>Golden Hour is intended for adults aged 18 and over.</p></div>
          </details>
          <details class="faq__item" data-reveal>
            <summary>Which devices are supported?<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
            <div class="faq__answer"><p>Golden Hour is available for Android devices on Google Play.</p></div>
          </details>
          <details class="faq__item" data-reveal>
            <summary>How do I contact support?<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
            <div class="faq__answer"><p>Email our support team at <a href="mailto:vglobalinfo24@gmail.com">vglobalinfo24@gmail.com</a>.</p></div>
          </details>
          <details class="faq__item" data-reveal>
            <summary>How is my data handled?<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
            <div class="faq__answer"><p>Our <a href="privacy-policy.html">Privacy Policy</a> explains what we collect, how we use it and how to contact us about your data.</p></div>
          </details>
        </div>
      </div>
    </section>

    <section class="download" id="download" aria-labelledby="download-title">
      <div class="download__bg" aria-hidden="true">
        <img src="assets/img/hero/keyart-16x9-960.webp" srcset="assets/img/hero/keyart-16x9-960.webp 960w, assets/img/hero/keyart-16x9-1920.webp 1920w" sizes="100vw" alt="" width="1920" height="1080" loading="lazy" decoding="async">
      </div>
      <div class="container download__inner">
        <h2 class="gold-title gold-title--xl" id="download-title" data-text="Your Golden Hour starts now.">Your Golden Hour starts now.</h2>
        <a class="play-badge play-badge--xl" href="https://play.google.com/store/apps/details?id=site.vglobal.android.casinog" target="_blank" rel="noopener" data-track="play_store_click" data-track-location="download" data-reveal>
          <img src="assets/img/badges/google-play-en.png" alt="Get it on Google Play" width="646" height="250" loading="lazy">
        </a>
      </div>
    </section>
  </main>
```
설계 4.3의 6번 질문("데이터 삭제")은 개인정보처리방침에 삭제 절차가 따로 적혀 있지 않다. 그래서 "How is my data handled?"로 바꾸고 정책 페이지로 안내한다. 법률 문서 내용을 지어내지 않기 위해서다.

- [ ] **Step 5: `assets/css/sections.css`를 만든다**

```css
/* ── 공통 섹션 ─────────────────────────────────────────────────────────── */
.section { position: relative; padding-block: var(--space-section); }
.section__head { display: grid; justify-items: center; gap: 16px; margin-bottom: clamp(32px, 5vw, 56px); text-align: center; }
.section__lede { max-width: 58ch; color: var(--c-text-dim); font-size: 1.125rem; }

/* ── 첫 화면 ─────────────────────────────────────────────────────────────
   키 아트(.hero__stage)는 그림 비율을 지키며 "남은 높이"에 맞춰 커진다. 가로 화면은 1914×822, 세로 화면(가로 ≤ 세로)은 1254×1254.
   릴 겹침 좌표는 그림 크기에 대한 백분율이다(측정: 가로 그림 릴 x 737–1185, y 565–782 / 정사각 그림 릴 x 200–1050, y 535–970). */
.hero {
  --art-ratio: 1914 / 822;
  --art-ratio-n: 2.3285;
  --hero-copy-h: 260px;
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100dvh;
  padding-top: var(--nav-h);
  overflow: hidden;
}
.hero__backdrop { position: absolute; inset: 0; z-index: -2; }
.hero__backdrop img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(28px) brightness(.55) saturate(1.2);
  transform: scale(1.15);
}
.hero__backdrop::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(21, 8, 48, .25) 0%, rgba(21, 8, 48, 0) 35%, var(--c-bg) 100%);
}
.hero__stage {
  --reels-x: 38.5%;
  --reels-y: 68.7%;
  --reels-w: 23.4%;
  --reels-h: 26.4%;
  --reel-cols: 153fr 136fr 135fr;
  --reel-gap: 2.7%;
  position: relative;
  z-index: 1;
  width: clamp(50%, (100dvh - var(--nav-h) - var(--hero-copy-h)) * var(--art-ratio-n), 100%);
  aspect-ratio: var(--art-ratio);
  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 5%, #000 95%, transparent 100%), linear-gradient(180deg, #000 93%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(90deg, transparent 0, #000 5%, #000 95%, transparent 100%), linear-gradient(180deg, #000 93%, transparent 100%);
  mask-composite: intersect;
}
.hero__title { line-height: 0; }
.hero__art { width: 100%; height: 100%; object-fit: cover; }
.hero__fx, .hero__confetti { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.hero__fx { z-index: 2; }
.hero__confetti { z-index: 4; }

@media (max-aspect-ratio: 1/1) {
  .hero { --art-ratio: 1 / 1; --art-ratio-n: 1; }
  .hero__stage {
    --reels-x: 15.9%;
    --reels-y: 42.7%;
    --reels-w: 67.8%;
    --reels-h: 34.7%;
    --reel-cols: 285fr 252fr 282fr;
    --reel-gap: 1.8%;
  }
}
@media (max-width: 767px) {
  .hero { --hero-copy-h: 270px; }
}

/* 릴 겹침: 쉬는 동안(idle, 777 로 멈춤)은 투명해서 그림의 777 이 보인다 */
.reels {
  position: absolute;
  left: var(--reels-x);
  top: var(--reels-y);
  width: var(--reels-w);
  height: var(--reels-h);
  display: grid;
  grid-template-columns: var(--reel-cols);
  column-gap: var(--reel-gap);
  opacity: 0;
  pointer-events: none;
}
.reels[data-state="spinning"],
.reels[data-state="landed"]:not([data-result="seven"]) { opacity: 1; }
.reels[data-state="landed"][data-result="seven"] { transition: opacity .2s ease .12s; }
.reel {
  position: relative;
  overflow: hidden;
  container-type: size;
  border-radius: 6% / 4%;
  background: linear-gradient(90deg, #cdb894 0%, #f6ead2 22%, #fff9ec 50%, #f6ead2 78%, #cdb894 100%);
}
.reel::after { /* 원통의 위아래 그늘 */
  content: "";
  position: absolute;
  inset: 0;
  box-shadow: inset 0 22px 16px -14px rgba(90, 45, 0, .55), inset 0 -22px 16px -14px rgba(90, 45, 0, .55);
  pointer-events: none;
}
.reel__strip { display: flex; flex-direction: column; will-change: transform; }
.reel__cell { flex: none; display: grid; place-items: center; height: 100cqh; }
.reel__cell img { width: 76%; height: 76%; object-fit: contain; }
.reel__cell--seven img { width: 100%; height: 100%; object-fit: cover; }
.reels[data-state="spinning"] .reel:not(.is-stopped) .reel__strip { filter: blur(1.6px); }

.hero__copy { position: relative; z-index: 3; display: grid; justify-items: center; gap: 16px; padding-block: 4px 40px; text-align: center; }
.hero__lede { max-width: 36ch; font-size: clamp(1.0625rem, .95rem + .5vw, 1.3125rem); font-weight: 600; text-shadow: 0 2px 12px rgba(0, 0, 0, .6); }
.hero__actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 14px 18px; }
.hero__spin { visibility: hidden; }
.hero.is-interactive .hero__spin { visibility: visible; }
.hero__legal { display: inline-flex; align-items: center; gap: 10px; color: var(--c-text-dim); font-size: .9375rem; }
@media (max-width: 767px) {
  .hero .play-badge--lg { --badge-w: 180px; }
}
@media (prefers-reduced-motion: reduce) {
  .hero__spin { display: none; }
}

/* ── 60+ 슬롯(넘김) ──────────────────────────────────────────────────── */
.slots { overflow: hidden; background: radial-gradient(60% 50% at 50% 45%, rgba(124, 78, 230, .28), transparent 70%); }
.slots__carousel { overflow: visible; padding-block: 24px 8px; }
.slots__carousel .swiper-slide { width: clamp(180px, 22vw, 260px); }
.slot-card { display: grid; justify-items: center; gap: 12px; }
.slot-card img { width: 100%; filter: drop-shadow(0 18px 24px rgba(0, 0, 0, .55)); }
.slot-card figcaption { display: grid; justify-items: center; gap: 6px; text-align: center; }
.slot-card__name { font-family: var(--font-display); font-size: 1.125rem; }
.swiper-slide:not(.swiper-slide-active) .slot-card figcaption { opacity: .55; }
.slots__nav { display: flex; justify-content: center; gap: 14px; margin-top: 28px; }

/* ── 럭키 타임 & 잭팟(판 | 글) ────────────────────────────────────────── */
.lucky__grid { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: clamp(32px, 5vw, 72px); align-items: center; }
.jackpot { display: grid; justify-items: center; gap: 14px; padding: 64px 28px 36px; text-align: center; }
.jackpot__crown { width: 120px; margin-top: -112px; filter: drop-shadow(0 8px 14px rgba(0, 0, 0, .5)); }
.jackpot__sign { font-size: clamp(1.75rem, 1rem + 2.6vw, 2.75rem); letter-spacing: .04em; }
.jackpot__value {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 22px;
  border: 1.5px solid var(--c-line);
  border-radius: var(--r-inset);
  background: var(--c-inset);
}
.jackpot__chip { width: 40px; height: 40px; }
.odometer {
  display: inline-flex;
  color: #fff4c9;
  font-family: var(--font-display);
  font-size: clamp(1.625rem, 1rem + 2.2vw, 2.625rem);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.odo__digit { display: inline-block; width: .62em; height: 1em; overflow: hidden; text-align: center; }
.odo__reel { display: flex; flex-direction: column; }
.odo__reel > span { height: 1em; }
.odo__sep { display: inline-block; width: .3em; }
.jackpot__note { font-size: .875rem; }
.lucky__copy { display: grid; gap: 20px; align-content: start; }
.lucky__copy > p { color: var(--c-text-dim); font-size: 1.125rem; }
.lucky__badge { width: 192px; }
.lucky__shots { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px; }
@media (max-width: 899px) {
  .lucky__grid { grid-template-columns: 1fr; }
  .jackpot { margin-top: 64px; }
}

/* ── 층 잠금 해제(글 | 탑) ───────────────────────────────────────────── */
.floors { background: linear-gradient(180deg, transparent, rgba(69, 25, 125, .35) 50%, transparent); }
.floors__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(32px, 5vw, 80px);
  align-items: center;
  min-height: min(calc(100dvh - var(--nav-h)), 860px);
}
.floors__copy { display: grid; gap: 20px; }
.floors__copy > p { color: var(--c-text-dim); font-size: 1.125rem; }
.tower { display: grid; gap: 12px; padding: 0; list-style: none; }
.floor {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: 56px 1fr 40px;
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  border-radius: var(--r-row);
  background: linear-gradient(180deg, #2c1752, #170a33);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06);
}
.floor::before { /* 열린 층: 클라이언트 VIP 줄(보라 + 금선) */
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: var(--g-row-vip);
  box-shadow: inset 0 0 0 1.5px rgba(255, 205, 95, .8), 0 0 24px rgba(255, 197, 58, .25);
  opacity: 0;
  transition: opacity .45s;
}
.floor__no { color: #fff4c9; font-family: var(--font-display); font-size: 1.5rem; }
.floor__slots { display: flex; gap: 10px; }
.floor__slots img { width: 52px; opacity: .45; transition: opacity .45s; }
.floor__lock { width: 28px; transition: transform .35s cubic-bezier(.34, 1.56, .64, 1), opacity .35s; }
.floor.is-unlocked::before { opacity: 1; }
.floor.is-unlocked .floor__slots img { opacity: 1; }
.floor.is-unlocked .floor__lock { opacity: 0; transform: scale(0) rotate(-20deg); }
@media (max-width: 1023px) {
  .floors__grid { grid-template-columns: 1fr; min-height: 0; }
}

/* ── 랭킹 & 소셜(크기가 다른 4칸) ─────────────────────────────────────── */
.bento {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 16px;
}
.bento__cell {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: grid;
  align-content: end;
  gap: 8px;
  min-height: 220px;
  padding: 24px;
  border-radius: 24px;
  box-shadow: inset 0 0 0 1.5px rgba(190, 150, 255, .22), 0 12px 28px rgba(0, 0, 0, .4);
}
.bento__cell h3 { font-family: var(--font-display); font-size: 1.375rem; }
.bento__cell--rank { grid-row: 1 / 3; padding: 0; background: var(--c-bg-2); }
.bento__cell--rank > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1; }
.bento__text { padding: 64px 24px 24px; background: linear-gradient(180deg, transparent, rgba(10, 3, 26, .92) 45%); }
.bento__text p { margin-top: 6px; }
.bento__cell--friends { background: radial-gradient(90% 80% at 80% 10%, rgba(255, 95, 210, .35), transparent 60%), var(--g-row-vip); }
.bento__cell--gifts { background: radial-gradient(90% 80% at 80% 10%, rgba(255, 216, 77, .3), transparent 60%), linear-gradient(180deg, #45197d, #1d0c40); }
.bento__cell--messages { grid-column: 2 / 4; background: radial-gradient(70% 90% at 90% 50%, rgba(95, 227, 255, .22), transparent 60%), linear-gradient(180deg, #3a1f6b, #1d0c40); }
.bento__icon { position: absolute; top: 16px; right: 16px; z-index: -1; width: 104px; height: auto; filter: drop-shadow(0 10px 16px rgba(0, 0, 0, .45)); }
.bento__icon--svg { width: 88px; height: 88px; }
@media (max-width: 899px) {
  .bento { grid-template-columns: 1fr 1fr; }
  .bento__cell--rank { grid-column: 1 / 3; grid-row: auto; aspect-ratio: 16 / 10; }
  .bento__cell--messages { grid-column: 1 / 3; }
}
@media (max-width: 559px) {
  .bento { grid-template-columns: 1fr; }
  .bento__cell--rank, .bento__cell--messages { grid-column: auto; }
}

/* ── 4시간 보너스(가운데) ─────────────────────────────────────────────── */
.bonus { text-align: center; background: radial-gradient(50% 60% at 50% 30%, rgba(255, 197, 58, .16), transparent 70%); }
.bonus__inner { display: grid; justify-items: center; gap: 20px; }
.bonus__ring { position: relative; display: grid; place-items: center; width: clamp(180px, 22vw, 240px); aspect-ratio: 1; }
.bonus__ring svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.bonus__track { fill: none; stroke: rgba(10, 3, 26, .62); stroke-width: 14; }
.bonus__progress {
  fill: none;
  stroke: url(#ring-gold);
  stroke-width: 14;
  stroke-linecap: round;
  stroke-dasharray: 100;
  stroke-dashoffset: 0;
  filter: drop-shadow(0 0 8px rgba(255, 197, 58, .6));
}
.bonus__face { position: relative; display: grid; justify-items: center; gap: 4px; }
.bonus__chip { width: clamp(72px, 9vw, 104px); }
.bonus__time { color: #fff4c9; font-family: var(--font-display); font-size: 1.125rem; font-variant-numeric: tabular-nums; }

/* ── 제작팀 띠 ───────────────────────────────────────────────────────── */
.team { padding-block: 40px; border-block: 1px solid rgba(255, 210, 87, .18); background: rgba(10, 3, 26, .5); }
.team__inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 28px; text-align: center; }
.team__text { font-size: 1.25rem; font-weight: 600; }
.team__text strong { color: var(--c-gold-light); }
.team__logo { width: 120px; filter: brightness(0) invert(1); opacity: .85; }

/* ── 마지막 설치 유도 ───────────────────────────────────────────────── */
.download { position: relative; isolation: isolate; overflow: hidden; padding-block: clamp(96px, 14vw, 180px); text-align: center; }
.download__bg { position: absolute; inset: 0; z-index: -1; }
.download__bg img { width: 100%; height: 100%; object-fit: cover; opacity: .55; }
.download__bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--c-bg) 0%, rgba(21, 8, 48, .35) 35%, rgba(21, 8, 48, .35) 65%, var(--c-bg) 100%);
}
.download__inner { display: grid; justify-items: center; gap: 28px; }
```

- [ ] **Step 6: 테스트를 돌린다**

Run: `npx playwright test tests/e2e/layout.spec.mjs tests/e2e/shell.spec.mjs`
Expected: 3개 프로젝트 모두 PASS

Run: `node scripts/verify.mjs --check refs,inline`
Expected: `index.html` 관련 오류 0건

- [ ] **Step 7: 눈으로 확인한다**

`.claude/launch.json`의 `site`로 미리보기를 띄운다(`preview_start name=site`). 1440×900, 768×1024, 375×812에서 첫 화면과 각 섹션을 캡처해 본다.
- 금색 제목의 갈색 외곽선이 글자 바깥에만 보이는가
- 판의 금테가 이어져 보이는가
- 잭팟 왕관이 판 위로 걸쳐 있는가
- 층 행 5개가 한 줄씩 정렬되는가
- 4칸 격자에 빈칸이 없는가

어긋난 곳은 `sections.css`·`components.css`에서 고치고, 테스트를 다시 돌린다.

- [ ] **Step 8: 커밋한다**

```bash
git add index.html assets/css/sections.css tests/e2e/layout.spec.mjs
git commit -m "feat(site): lay out hero, slots, lucky time, floors, social, bonus, FAQ and download sections"
```

---
### Task 7: 첫 화면 릴·코인·색종이 연출

**Files:**
- Create: `assets/js/motion.js`, `assets/js/lib/reels.js`, `assets/js/lib/particles.js`, `assets/js/hero-reels.js`, `assets/js/particles.js`, `tests/unit/reels.test.mjs`, `tests/unit/particles.test.mjs`, `tests/e2e/hero.spec.mjs`
- Modify: `assets/js/main.js`(전체 교체)

**Interfaces:**
- Consumes: Task 6의 HTML 표시와 CSS 상태(`data-state`, `.is-stopped`, `.is-interactive`, `.is-celebrating`), 전역 `gsap`·`confetti`
- Produces:
  - `motion.js`: `prefersReducedMotion(): boolean`, `DUR`, `EASE`, `CONFETTI_COLORS`
  - `lib/reels.js`
    - `REEL_SYMBOLS`(첫 값은 `'seven'`)
    - `buildStrip(symbols, loops, target, { from = target, rng = Math.random } = {}): string[]`
    - `shuffle(list, rng): any[]`
    - `spinDurations(count, base = 1.4, step = 0.45): number[]`
    - `finalYPercent(length): number`
    - `pickResult(symbols, rng): string`
  - `lib/particles.js`: `GRAVITY`, `COIN_FRAMES`, `COIN_FPS`, `makeSparkle`, `stepSparkle`, `sparkleAlpha`, `makeCoin`, `stepCoin`, `coinFrame`, `isCoinGone`
  - `particles.js`: `createParticles(canvas, { coinSheet, reduced, rng }): { start(), stop(), burst(x, y, count), destroy() }`
    - canvas의 `data-state`: `running|stopped|static`
  - `hero-reels.js`: `initHeroReels(hero, { reduced, onLand(symbol, rect) }): { spin(target): Promise<string|null>, ready: Promise<void> } | null`
    - `[data-reels]`에 `data-spins`(회전 횟수)를 기록한다

- [ ] **Step 1: 단위 테스트를 먼저 쓴다**

`tests/unit/reels.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REEL_SYMBOLS, buildStrip, shuffle, spinDurations, finalYPercent, pickResult } from '../../assets/js/lib/reels.js';

// 같은 결과를 다시 만들 수 있는 난수(mulberry32)
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('the first symbol is seven (the key art shows 777)', () => {
  assert.equal(REEL_SYMBOLS[0], 'seven');
});

test('buildStrip starts on `from`, ends on the target, and never shows the target in between', () => {
  const strip = buildStrip(REEL_SYMBOLS, 3, 'crown', { from: 'seven', rng: seeded(1) });
  assert.equal(strip.length, 2 + 3 * (REEL_SYMBOLS.length - 1));
  assert.equal(strip[0], 'seven');
  assert.equal(strip.at(-1), 'crown');
  assert.ok(strip.slice(1, -1).every((s) => s !== 'crown'));
});

test('buildStrip puts every other symbol once in each loop', () => {
  const middle = buildStrip(REEL_SYMBOLS, 2, 'gift', { rng: seeded(7) }).slice(1, -1);
  const others = REEL_SYMBOLS.filter((s) => s !== 'gift').sort();
  assert.deepEqual(middle.slice(0, others.length).sort(), others);
  assert.deepEqual(middle.slice(others.length).sort(), others);
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

test('finalYPercent moves the last cell into the window', () => {
  assert.equal(finalYPercent(10), -90);
  assert.equal(finalYPercent(4), -75);
});

test('pickResult covers both ends of the list', () => {
  assert.equal(pickResult(REEL_SYMBOLS, () => 0), REEL_SYMBOLS[0]);
  assert.equal(pickResult(REEL_SYMBOLS, () => 0.9999), REEL_SYMBOLS.at(-1));
});
```

`tests/unit/particles.test.mjs`:
```js
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
```

- [ ] **Step 2: 실패를 확인한다**

Run: `node --test tests/unit/reels.test.mjs tests/unit/particles.test.mjs`
Expected: FAIL(`Cannot find module '.../assets/js/lib/reels.js'`)

- [ ] **Step 3: 계산 모듈을 만든다**

`assets/js/lib/reels.js`:
```js
// 첫 화면 릴의 계산(DOM 없음). 심볼 id 는 hero-reels.js 의 그림 경로 표와 같다.
export const REEL_SYMBOLS = ['seven', 'chip', 'crown', 'trophy', 'gift', 'crown-chip'];

export function shuffle(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 릴 띠의 심볼 순서. 첫 칸은 지금 보이는 심볼(from), 마지막 칸은 멈출 심볼(target), 가운데는 target 을 뺀 심볼을 loops 바퀴. */
export function buildStrip(symbols, loops, target, { from = target, rng = Math.random } = {}) {
  const others = symbols.filter((s) => s !== target);
  const strip = [from];
  for (let i = 0; i < loops; i += 1) strip.push(...shuffle(others, rng));
  strip.push(target);
  return strip;
}

/** 릴 i(0부터)의 회전 시간(초). 설계 6.1: 1.4, 1.85, 2.3 */
export function spinDurations(count, base = 1.4, step = 0.45) {
  return Array.from({ length: count }, (_, i) => Number((base + i * step).toFixed(2)));
}

/** 띠(높이 = 칸 수 × 창 높이)의 마지막 칸이 창에 오도록 옮길 yPercent. */
export function finalYPercent(length) {
  return -((length - 1) / length) * 100;
}

/** 다시 돌리기 결과: 세 릴이 같은 심볼로 멈춘다. */
export function pickResult(symbols, rng = Math.random) {
  return symbols[Math.min(symbols.length - 1, Math.floor(rng() * symbols.length))];
}
```

`assets/js/lib/particles.js`:
```js
// 첫 화면 코인·반짝이 입자의 계산(DOM·canvas 없음). particles.js 가 그린다.
export const GRAVITY = 1400;   // px/s²
export const COIN_FRAMES = 10; // coin-sheet.webp: 5열 × 2행, 칸 64px
export const COIN_FPS = 14;    // 클라이언트 대기 표시와 같은 속도

export function makeSparkle(rng, w, h) {
  return {
    x: rng() * w,
    y: h * (0.3 + rng() * 0.7),
    r: 1.2 + rng() * 2.6,
    vy: -(8 + rng() * 22),
    phase: rng() * Math.PI * 2,
    speed: 1.5 + rng() * 2.5,
  };
}

export function stepSparkle(p, dt, w, h, rng) {
  p.y += p.vy * dt;
  p.phase += p.speed * dt;
  if (p.y < -10) Object.assign(p, makeSparkle(rng, w, h), { y: h + 10 });
  return p;
}

export function sparkleAlpha(p) {
  return 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(p.phase));
}

export function makeCoin(rng, x, y) {
  const angle = -Math.PI / 2 + (rng() - 0.5) * 1.6;
  const speed = 520 + rng() * 520;
  return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 26 + rng() * 20, t: rng() * 0.7, rot: (rng() - 0.5) * 0.6 };
}

export function stepCoin(c, dt) {
  c.vy += GRAVITY * dt;
  c.x += c.vx * dt;
  c.y += c.vy * dt;
  c.t += dt;
  return c;
}

export function coinFrame(c) {
  return Math.floor(c.t * COIN_FPS) % COIN_FRAMES;
}

export function isCoinGone(c, h) {
  return c.vy > 0 && c.y - c.size > h;
}
```

Run: `node --test tests/unit/reels.test.mjs tests/unit/particles.test.mjs`
Expected: PASS(12개)

- [ ] **Step 4: 첫 화면 e2e 테스트를 쓴다**

`tests/e2e/hero.spec.mjs`:
```js
import { test, expect } from './fixtures.mjs';

const SYMBOLS = ['seven', 'chip', 'crown', 'trophy', 'gift', 'crown-chip'];
const reels = (page) => page.locator('[data-reels]');
const landed = (page) => expect(reels(page)).toHaveAttribute('data-state', 'landed', { timeout: 10_000 });

test('reels spin once on load and land on 777', async ({ page, problems }) => {
  await page.goto('/');
  await landed(page);
  await expect(reels(page)).toHaveAttribute('data-result', 'seven');
  await expect(reels(page)).toHaveAttribute('data-spins', '1');
  await expect(page.locator('[data-spin]')).toBeVisible();
  await expect(page.locator('[data-spin]')).toBeEnabled();
  expect(problems).toEqual([]);
});

test('spin again lands three matching symbols', async ({ page }) => {
  await page.goto('/');
  await landed(page);
  await page.locator('[data-spin]').click();
  await expect(reels(page)).toHaveAttribute('data-state', 'spinning');
  await expect(page.locator('[data-spin]')).toBeDisabled();
  await landed(page);
  expect(SYMBOLS).toContain(await reels(page).getAttribute('data-result'));
});

test('rapid clicks never start overlapping spins', async ({ page }) => {
  await page.goto('/');
  await landed(page);
  // disabled 를 풀고 세 번 연달아 눌러도 회전은 한 번만 시작해야 한다
  await page.evaluate(() => {
    const b = document.querySelector('[data-spin]');
    b.click();
    b.disabled = false;
    b.click();
    b.click();
  });
  await landed(page);
  await expect(reels(page)).toHaveAttribute('data-spins', '2');
});

test('particles run in the hero and stop once it scrolls away', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('[data-particles]');
  await expect(canvas).toHaveAttribute('data-state', 'running');
  await page.locator('#faq').scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute('data-state', 'stopped');
});

test('reduced motion shows a still 777 with no spin button and no particles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(reels(page)).toHaveAttribute('data-state', 'static');
  await expect(page.locator('[data-spin]')).toBeHidden();
  await expect(page.locator('[data-particles]')).toHaveAttribute('data-state', 'static');
});

test('orientation switch swaps the key art and the reel overlay together', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'one run is enough');
  await page.goto('/');
  const read = () => page.evaluate(() => ({
    src: document.querySelector('.hero__art').currentSrc,
    left: parseFloat(getComputedStyle(document.querySelector('.reels')).left),
    stage: document.querySelector('.hero__stage').offsetWidth, // transform(확대 연출)을 빼고 잰 폭
  }));
  const wide = await read();
  expect(wide.src).toContain('splash-wide');
  expect(wide.left / wide.stage).toBeCloseTo(0.385, 2);
  await page.setViewportSize({ width: 700, height: 1000 });
  await expect.poll(async () => (await read()).src).toContain('keyart-square');
  const tall = await read();
  expect(tall.left / tall.stage).toBeCloseTo(0.159, 2);
});
```

Run: `npx playwright test tests/e2e/hero.spec.mjs --project=desktop`
Expected: FAIL(`data-state`가 계속 `idle`)

- [ ] **Step 5: `assets/js/motion.js`를 만든다**

```js
// 연출 공용 값. 시간·easing 은 클라이언트 웹 시안(kit.js) 확정값.
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export const prefersReducedMotion = () => reducedQuery.matches;

export const DUR = { reveal: 0.6, press: 0.08, release: 0.25 };
export const EASE = { out: 'power2.out', inOut: 'power2.inOut', pop: 'back.out(2)', press: 'back.out(3)' };

// 클라이언트 꽃가루 색
export const CONFETTI_COLORS = ['#ffd84d', '#ff5fd2', '#5fe3ff', '#ffffff', '#7dff9a', '#ff8a3d', '#b58cff'];
```

- [ ] **Step 6: `assets/js/particles.js`를 만든다**

```js
// 첫 화면 canvas: 떠오르는 반짝이(최대 40개)와 터지는 코인(최대 60개).
// 화면 밖이거나 탭이 숨겨지면 그리기를 멈춘다. 동작 줄이기면 아무것도 그리지 않는다.
import { makeSparkle, stepSparkle, sparkleAlpha, makeCoin, stepCoin, coinFrame, isCoinGone } from './lib/particles.js';

const MAX_SPARKLES = 40;
const MAX_COINS = 60;
const CELL = 64;
const COLS = 5;

export function createParticles(canvas, { coinSheet, reduced = false, rng = Math.random } = {}) {
  const ctx = canvas.getContext('2d');
  const sparkles = [];
  const coins = [];
  let w = 0;
  let h = 0;
  let raf = 0;
  let last = 0;
  let visible = true;
  let running = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    sparkles.length = 0;
    const n = Math.min(MAX_SPARKLES, Math.round(w / 36));
    for (let i = 0; i < n; i += 1) sparkles.push(makeSparkle(rng, w, h));
  }

  function drawSparkle(p) {
    const r = p.r * 2.4;
    ctx.globalAlpha = sparkleAlpha(p);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - r);
    ctx.quadraticCurveTo(p.x, p.y, p.x + r, p.y);
    ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + r);
    ctx.quadraticCurveTo(p.x, p.y, p.x - r, p.y);
    ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - r);
    ctx.fill();
  }

  function drawCoin(c) {
    const f = coinFrame(c);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.drawImage(coinSheet, (f % COLS) * CELL, Math.floor(f / COLS) * CELL, CELL, CELL, -c.size / 2, -c.size / 2, c.size, c.size);
    ctx.restore();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, w, h);
    for (const p of sparkles) drawSparkle(stepSparkle(p, dt, w, h, rng));
    for (let i = coins.length - 1; i >= 0; i -= 1) {
      const c = stepCoin(coins[i], dt);
      if (isCoinGone(c, h)) coins.splice(i, 1);
      else if (coinSheet?.complete && coinSheet.naturalWidth) drawCoin(c);
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (reduced || running || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
    canvas.dataset.state = 'running';
  }

  function stop() {
    if (reduced) return;
    running = false;
    cancelAnimationFrame(raf);
    canvas.dataset.state = 'stopped';
  }

  function burst(x, y, count = 36) {
    if (reduced) return;
    for (let i = 0; i < count && coins.length < MAX_COINS; i += 1) coins.push(makeCoin(rng, x, y));
  }

  if (reduced) {
    canvas.dataset.state = 'static';
    return { start() {}, stop() {}, burst() {}, destroy() {} };
  }

  resize();
  seed();
  const ro = new ResizeObserver(() => { resize(); seed(); });
  ro.observe(canvas);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start(); else stop();
  });
  io.observe(canvas);
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);

  return {
    start,
    stop,
    burst,
    destroy() {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
```

- [ ] **Step 7: `assets/js/hero-reels.js`를 만든다**

```js
// 첫 화면 릴: 키 아트의 777 자리에 겹친 릴 3개를 돌린다. 계산은 lib/reels.js.
// 777 로 멈추면 겹침을 투명하게 해서(CSS) 그림 원래의 777 이 보인다.
import { REEL_SYMBOLS, buildStrip, spinDurations, finalYPercent, pickResult } from './lib/reels.js';

const SYMBOL_SRC = {
  seven: 'assets/img/reels/seven.webp',
  chip: 'assets/img/icons/chip.webp',
  crown: 'assets/img/icons/crown.webp',
  trophy: 'assets/img/icons/trophy.webp',
  gift: 'assets/img/icons/gift.webp',
  'crown-chip': 'assets/img/icons/crown-chip.webp',
};
const LOOPS = 3;         // 띠 하나에 다른 심볼을 몇 바퀴 넣을지
const BLUR_OFF_AT = 0.8; // 회전 시간의 80%가 지나면 흐림을 끈다(멈출 때 그림이 또렷하게)

function renderStrip(strip, ids) {
  strip.replaceChildren(...ids.map((id) => {
    const cell = document.createElement('div');
    cell.className = `reel__cell reel__cell--${id}`;
    const img = document.createElement('img');
    img.src = SYMBOL_SRC[id];
    img.alt = '';
    img.width = 256; // CSS 가 크기를 정한다. 속성은 레이아웃 예약·점검용
    img.height = 256;
    img.decoding = 'async';
    cell.append(img);
    return cell;
  }));
}

/**
 * @returns {{ spin(target: string): Promise<string|null>, ready: Promise<void> } | null}
 *   동작 줄이기이거나 GSAP 이 없으면 null 이고, 릴은 data-state="static"(그림의 777 그대로).
 */
export function initHeroReels(hero, { reduced = false, onLand } = {}) {
  const reels = hero.querySelector('[data-reels]');
  if (!reels) return null;
  const { gsap } = window;
  if (reduced || !gsap) {
    reels.dataset.state = 'static';
    reels.dataset.result = 'seven';
    return null;
  }

  const strips = [...reels.querySelectorAll('.reel__strip')];
  const spinBtn = hero.querySelector('[data-spin]');
  const ready = Promise.all(Object.values(SYMBOL_SRC).map((src) => {
    const img = new Image();
    img.src = src;
    return img.decode().catch(() => {});
  })).then(() => {});
  let current = 'seven';
  let busy = false;
  let spins = 0;

  function spin(target) {
    if (busy) return Promise.resolve(null);
    busy = true;
    spins += 1;
    reels.dataset.spins = String(spins);
    if (spinBtn) spinBtn.disabled = true;

    const durations = spinDurations(strips.length);
    const tl = gsap.timeline();
    strips.forEach((strip, i) => {
      const ids = buildStrip(REEL_SYMBOLS, LOOPS, target, { from: current });
      renderStrip(strip, ids);
      strip.parentElement.classList.remove('is-stopped');
      gsap.set(strip, { yPercent: 0 });
      tl.to(strip, { yPercent: finalYPercent(ids.length), duration: durations[i], ease: 'back.out(0.6)' }, 0);
      tl.call(() => strip.parentElement.classList.add('is-stopped'), null, durations[i] * BLUR_OFF_AT);
    });
    delete reels.dataset.result;
    reels.dataset.state = 'spinning';

    return new Promise((resolve) => {
      tl.eventCallback('onComplete', () => {
        busy = false;
        current = target;
        reels.dataset.state = 'landed';
        reels.dataset.result = target;
        if (spinBtn) spinBtn.disabled = false;
        onLand?.(target, reels.getBoundingClientRect());
        resolve(target);
      });
    });
  }

  spinBtn?.addEventListener('click', () => spin(pickResult(REEL_SYMBOLS)));
  return { spin, ready };
}
```

- [ ] **Step 8: `assets/js/main.js`를 바꾼다**

```js
// 메인 페이지 시작점: 메뉴, 첫 화면 연출(릴·코인·색종이).
import { prefersReducedMotion, CONFETTI_COLORS } from './motion.js';
import { initNav } from './nav.js';
import { createParticles } from './particles.js';
import { initHeroReels } from './hero-reels.js';

const reduced = prefersReducedMotion();
const { gsap } = window;

initNav();
const fx = initHeroFx();
initHero();

function initHeroFx() {
  const canvas = document.querySelector('[data-particles]');
  if (!canvas) return null;
  const coinSheet = new Image();
  coinSheet.src = 'assets/img/icons/coin-sheet.webp';
  const particles = createParticles(canvas, { coinSheet, reduced });
  particles.start();
  const confettiCanvas = document.querySelector('[data-confetti]');
  // useWorker:false — Worker(blob:)를 만들지 않아 CSP 를 넓히지 않는다
  const shoot = !reduced && window.confetti && confettiCanvas
    ? window.confetti.create(confettiCanvas, { resize: true, useWorker: false })
    : null;
  return { canvas, particles, shoot };
}

function celebrate(reelsRect) {
  if (!fx) return;
  const box = fx.canvas.getBoundingClientRect();
  const cx = reelsRect.left + reelsRect.width / 2 - box.left;
  const cy = reelsRect.top + reelsRect.height * 0.4 - box.top;
  fx.particles.burst(cx, cy, 36);
  if (fx.shoot) {
    const origin = { x: cx / box.width, y: (reelsRect.top - box.top) / box.height };
    const base = { particleCount: 70, spread: 75, startVelocity: 42, colors: CONFETTI_COLORS, scalar: 0.9, ticks: 220 };
    fx.shoot({ ...base, angle: 115, origin: { x: origin.x - 0.12, y: origin.y } });
    fx.shoot({ ...base, angle: 65, origin: { x: origin.x + 0.12, y: origin.y } });
  }
  document.querySelectorAll('[data-play-badge]').forEach((badge) => {
    badge.classList.remove('is-celebrating');
    void badge.offsetWidth; // 빛 애니메이션을 처음부터 다시
    badge.classList.add('is-celebrating');
  });
}

async function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const reels = initHeroReels(hero, { reduced, onLand: (_, rect) => celebrate(rect) });
  if (!reels) return;
  hero.classList.add('is-interactive');
  // LCP(키 아트)를 늦추지 않도록 그림은 투명도를 건드리지 않고 크기만 살짝
  gsap.from('.hero__stage', { scale: 1.04, duration: 0.9, ease: 'power2.out' });
  gsap.from('.hero__copy > *', { y: 18, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08, delay: 0.15 });
  await Promise.all([waitForImage(hero.querySelector('.hero__art')), reels.ready]);
  gsap.delayedCall(0.5, () => reels.spin('seven'));
}

function waitForImage(img) {
  if (!img) return Promise.resolve();
  if (img.complete) return img.decode().catch(() => {});
  return new Promise((resolve) => {
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  });
}
```

- [ ] **Step 9: 테스트를 돌린다**

Run: `node --test tests/unit/reels.test.mjs tests/unit/particles.test.mjs && npx playwright test tests/e2e/hero.spec.mjs tests/e2e/layout.spec.mjs tests/e2e/shell.spec.mjs`
Expected: 모두 PASS

- [ ] **Step 10: 릴 겹침 정렬을 눈으로 확인한다**

미리보기에서 1440×900과 375×812를 확인한다. 페이지를 열고 돌기 시작한 직후와 멈춘 직후를 캡처한다.
- 회전 중인 릴 창 3개가 그림 속 릴 창(크림색 원통)과 겹치는가
- 멈춘 뒤 777로 바뀌는 순간 그림이 튀지 않는가

어긋나면 `sections.css`의 `--reels-x/y/w/h`를 0.2% 단위로 맞추고, `hero.spec.mjs`의 `toBeCloseTo` 기준값도 같이 고친다.

- [ ] **Step 11: 커밋한다**

```bash
git add assets/js tests/unit/reels.test.mjs tests/unit/particles.test.mjs tests/e2e/hero.spec.mjs assets/css/sections.css
git commit -m "feat(site): spinning 777 hero reels with coin burst, confetti and sparkles"
```

---

### Task 8: 섹션 연출(등장, 슬롯 넘김, 잭팟, 층, 보너스, 부드러운 스크롤)

**Files:**
- Create: `assets/js/lib/odometer.js`, `assets/js/sections.js`, `tests/unit/odometer.test.mjs`, `tests/e2e/sections.spec.mjs`
- Modify: `assets/js/main.js`(전체 교체)

**Interfaces:**
- Consumes: Task 6의 HTML 표시, Task 7의 `motion.js`, 전역 `gsap`·`ScrollTrigger`·`SplitText`·`Swiper`·`Lenis`
- Produces:
  - `lib/odometer.js`: `formatChips(n): string`, `toGlyphs(n): string[]`, `digitOffsetPercent(d): number`, `nextJackpot(current, rng?, min?, max?): number`
  - `sections.js`: `initSections(root, { reduced }): void`
  - 상태 표시
    - `[data-odometer]`의 `data-value`
    - `[data-tower]`의 `data-unlocked`(0~5), `.floor.is-unlocked`
    - `[data-bonus]`의 `data-state="full"`
    - 제목 단어 `.gw[data-text]`

- [ ] **Step 1: 잭팟 숫자 단위 테스트를 먼저 쓴다**

`tests/unit/odometer.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatChips, toGlyphs, digitOffsetPercent, nextJackpot } from '../../assets/js/lib/odometer.js';

test('formatChips floors, clamps at zero and adds thousands separators', () => {
  assert.equal(formatChips(2847300150.9), '2,847,300,150');
  assert.equal(formatChips(-5), '0');
});

test('toGlyphs splits digits and separators', () => {
  assert.deepEqual(toGlyphs(12345), ['1', '2', ',', '3', '4', '5']);
});

test('digitOffsetPercent moves the 0–9 column so the digit shows', () => {
  assert.equal(digitOffsetPercent('0'), 0);
  assert.equal(digitOffsetPercent('7'), -70);
});

test('nextJackpot always grows by 1,200–9,799 chips', () => {
  assert.equal(nextJackpot(1000, () => 0), 2200);
  assert.equal(nextJackpot(1000, () => 0.999999), 10799);
});
```

Run: `node --test tests/unit/odometer.test.mjs`
Expected: FAIL(모듈 없음)

- [ ] **Step 2: `assets/js/lib/odometer.js`를 만든다**

```js
// 잭팟 숫자 표시 계산(DOM 없음). 단위는 가상 칩이고 통화 기호를 쓰지 않는다.
export function formatChips(n) {
  return Math.max(0, Math.floor(n)).toLocaleString('en-US');
}

export function toGlyphs(n) {
  return [...formatChips(n)];
}

/** 0~9 가 세로로 쌓인 칸(높이 10줄)을 몇 % 올려야 숫자 d 가 보이는지. */
export function digitOffsetPercent(d) {
  return 0 - Number(d) * 10;
}

/** 다음 값: 매 틱마다 min 이상 max 미만만큼 늘어난다(장식용, 실제 값이 아님). */
export function nextJackpot(current, rng = Math.random, min = 1200, max = 9800) {
  return current + Math.floor(min + rng() * (max - min));
}
```

Run: `node --test tests/unit/odometer.test.mjs`
Expected: PASS(4개)

- [ ] **Step 3: 섹션 e2e 테스트를 쓴다**

`tests/e2e/sections.spec.mjs`:
```js
import { test, expect } from './fixtures.mjs';

const hiddenRevealCount = (page) => page.locator('[data-reveal]')
  .evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);

test('slot carousel uses coverflow and the next button moves it', async ({ page, problems }) => {
  await page.goto('/#slots');
  const carousel = page.locator('[data-slots]');
  await expect(carousel).toHaveClass(/swiper-initialized/);
  await expect(carousel).toHaveClass(/swiper-coverflow/);
  const active = () => carousel.locator('.swiper-slide-active').getAttribute('data-swiper-slide-index');
  const before = await active();
  await page.locator('.slots__next').click();
  await expect.poll(active).not.toBe(before);
  expect(problems).toEqual([]);
});

test('jackpot counter rolls up to its start value and keeps growing', async ({ page }) => {
  await page.goto('/');
  const odo = page.locator('[data-odometer]');
  await odo.scrollIntoViewIfNeeded();
  const value = async () => Number(await odo.getAttribute('data-value'));
  await expect.poll(value, { timeout: 5_000 }).toBeGreaterThanOrEqual(2847300150);
  const first = await value();
  await expect.poll(value, { timeout: 6_000 }).toBeGreaterThan(first);
  await expect(odo).toHaveAttribute('aria-label', 'Major jackpot counter in virtual chips');
});

test('floors unlock from 1F to 5F while scrolling', async ({ page }) => {
  await page.goto('/');
  const tower = page.locator('[data-tower]');
  await expect(tower).toHaveAttribute('data-unlocked', '0');
  await tower.scrollIntoViewIfNeeded();
  for (let i = 0; i < 40 && (await tower.getAttribute('data-unlocked')) !== '5'; i += 1) {
    await page.mouse.wheel(0, 250);
    await page.waitForTimeout(120);
  }
  await expect(tower).toHaveAttribute('data-unlocked', '5');
  await expect(page.locator('.floor[data-floor="1"]')).toHaveClass(/is-unlocked/);
});

test('the 4-hour ring fills when it comes into view', async ({ page }) => {
  await page.goto('/');
  const bonus = page.locator('[data-bonus]');
  await bonus.scrollIntoViewIfNeeded();
  await expect(bonus).toHaveAttribute('data-state', 'full', { timeout: 5_000 });
});

test('section titles are split into gold words that keep their outline text and label', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#slots-title .gw').first()).toHaveAttribute('data-text', '60+');
  await expect(page.locator('#slots-title')).toHaveAttribute('aria-label', '60+ Unique 3D Slots');
});

test('scrolling to the bottom reveals every block', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 60; i += 1) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(800);
  expect(await hiddenRevealCount(page)).toBe(0);
});

test('keyboard reaches the badge, the carousel buttons and the FAQ', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'keyboard check on desktop');
  await page.goto('/');
  const seen = new Set();
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press('Tab');
    seen.add(await page.evaluate(() => {
      const el = document.activeElement;
      return el.matches('.hero [data-play-badge]') ? 'hero-badge'
        : el.matches('.slots__next') ? 'slots-next'
        : el.matches('.faq__item summary') ? 'faq' : el.tagName;
    }));
  }
  for (const key of ['hero-badge', 'slots-next', 'faq']) expect(seen.has(key), key).toBe(true);
});

test('reduced motion shows every section in its final state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-tower]')).toHaveAttribute('data-unlocked', '5');
  await expect(page.locator('[data-bonus]')).toHaveAttribute('data-state', 'full');
  await expect(page.locator('[data-slots]')).not.toHaveClass(/swiper-coverflow/);
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  expect(await hiddenRevealCount(page)).toBe(0);
});

test('content stays readable when the animation libraries fail to load', async ({ page }) => {
  await page.route('**/assets/vendor/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('[data-reels]')).toHaveAttribute('data-state', 'static');
  await expect(page.locator('[data-tower]')).toHaveAttribute('data-unlocked', '5');
  await expect(page.locator('[data-bonus]')).toHaveAttribute('data-state', 'full');
  expect(await hiddenRevealCount(page)).toBe(0);
  await expect(page.locator('.slot-card').first()).toBeVisible();
});
```

Run: `npx playwright test tests/e2e/sections.spec.mjs --project=desktop`
Expected: FAIL(`swiper-initialized` 없음 등)

- [ ] **Step 4: `assets/js/sections.js`를 만든다**

```js
// 메인 페이지 섹션 연출: 제목·블록 등장, 슬롯 넘김, 잭팟 숫자, 층 열림, 4시간 원, 버튼 누름.
// 라이브러리가 없거나 동작 줄이기면 모든 블록을 최종 상태로 둔다.
import { DUR, EASE } from './motion.js';
import { toGlyphs, digitOffsetPercent, nextJackpot } from './lib/odometer.js';

const TICK_MS = 1600;

export function initSections(root = document, { reduced = false } = {}) {
  const animated = !reduced && Boolean(window.gsap && window.ScrollTrigger);
  initSlots(root, { reduced });
  initOdometer(root, { animated });
  initFloors(root, { animated });
  initBonus(root, { animated });
  if (animated) {
    initReveals(root);
    initPressFeedback(root);
  }
}

/* 화면 아래쪽에 있는 블록만 숨겼다가 보일 때 올린다(이미 보이거나 지나간 블록은 그대로). */
function initReveals(root) {
  const { gsap, ScrollTrigger, SplitText } = window;
  const below = (el) => el.getBoundingClientRect().top > window.innerHeight;
  if (SplitText) {
    root.querySelectorAll('h2.gold-title').forEach((title) => {
      const split = SplitText.create(title, { type: 'words', wordsClass: 'gw' });
      split.words.forEach((w) => { w.dataset.text = w.textContent; });
      title.classList.add('is-split');
      if (!below(title)) return;
      gsap.from(split.words, {
        yPercent: 60, opacity: 0, duration: DUR.reveal, ease: EASE.out, stagger: 0.04,
        scrollTrigger: { trigger: title, start: 'top 88%', once: true },
      });
    });
  }
  const items = [...root.querySelectorAll('[data-reveal]')].filter(below);
  if (!items.length) return;
  gsap.set(items, { opacity: 0, y: 32 });
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: DUR.reveal, ease: EASE.out, stagger: 0.08, overwrite: true }),
  });
}

function initSlots(root, { reduced }) {
  const el = root.querySelector('[data-slots]');
  if (!el || !window.Swiper) return;
  new window.Swiper(el, {
    effect: reduced ? 'slide' : 'coverflow',
    coverflowEffect: { rotate: 28, stretch: 0, depth: 140, modifier: 1, slideShadows: false },
    slidesPerView: 'auto',
    centeredSlides: true,
    loop: true,
    grabCursor: true,
    speed: reduced ? 0 : 600,
    keyboard: { enabled: true, onlyInViewport: true },
    navigation: { prevEl: root.querySelector('.slots__prev'), nextEl: root.querySelector('.slots__next') },
    autoplay: reduced ? false : { delay: 4000, pauseOnMouseEnter: true, disableOnInteraction: false },
    a11y: { enabled: true, prevSlideMessage: 'Previous slot', nextSlideMessage: 'Next slot' },
  });
}

function buildOdometer(el, glyphs) {
  el.replaceChildren(...glyphs.map((g) => {
    if (!/\d/.test(g)) {
      const sep = document.createElement('span');
      sep.className = 'odo__sep';
      sep.textContent = g;
      return sep;
    }
    const digit = document.createElement('span');
    digit.className = 'odo__digit';
    const column = document.createElement('span');
    column.className = 'odo__reel';
    for (let d = 0; d <= 9; d += 1) {
      const n = document.createElement('span');
      n.textContent = String(d);
      column.append(n);
    }
    digit.append(column);
    return digit;
  }));
}

function initOdometer(root, { animated }) {
  const el = root.querySelector('[data-odometer]');
  if (!el || !animated) return;
  const { gsap, ScrollTrigger } = window;
  let value = Number(el.dataset.start);
  let glyphCount = toGlyphs(value).length;
  let timer = null;
  let rolled = false;
  buildOdometer(el, toGlyphs(value));
  el.dataset.value = '0';

  const render = (n, duration) => {
    const glyphs = toGlyphs(n);
    if (glyphs.length !== glyphCount) {
      buildOdometer(el, glyphs);
      glyphCount = glyphs.length;
    }
    const columns = el.querySelectorAll('.odo__reel');
    glyphs.filter((g) => /\d/.test(g)).forEach((g, i) => {
      gsap.to(columns[i], { yPercent: digitOffsetPercent(g), duration, ease: 'power3.out', delay: duration ? i * 0.04 : 0, overwrite: true });
    });
    el.dataset.value = String(n);
  };

  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    end: 'bottom 15%',
    onToggle: (self) => {
      clearInterval(timer);
      timer = null;
      if (!self.isActive) return;
      if (!rolled) {
        rolled = true;
        render(value, 1.4);
      }
      timer = setInterval(() => {
        value = nextJackpot(value);
        render(value, 0.8);
      }, TICK_MS);
    },
  });
}

function initFloors(root, { animated }) {
  const section = root.querySelector('[data-floors]');
  const tower = section?.querySelector('[data-tower]');
  if (!tower) return;
  const floors = [...tower.querySelectorAll('.floor')].reverse(); // 1F 부터
  const setUnlocked = (n) => {
    floors.forEach((f, i) => f.classList.toggle('is-unlocked', i < n));
    tower.dataset.unlocked = String(n);
  };
  if (!animated) {
    setUnlocked(floors.length);
    return;
  }
  const { gsap, ScrollTrigger } = window;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => {
    // 데스크톱: 섹션을 화면에 고정하고 스크롤 진행에 맞춰 한 층씩 연다
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=140%',
      pin: true,
      scrub: true,
      onUpdate: (self) => setUnlocked(Math.round(self.progress * floors.length)),
    });
    return () => setUnlocked(0);
  });
  mm.add('(max-width: 1023px)', () => {
    // 모바일: 고정 없이, 탑이 보이면 0.35초 간격으로 차례로 연다
    const calls = [];
    const st = ScrollTrigger.create({
      trigger: tower,
      start: 'top 70%',
      once: true,
      onEnter: () => floors.forEach((_, i) => calls.push(gsap.delayedCall(i * 0.35, () => setUnlocked(i + 1)))),
    });
    return () => { st.kill(); calls.forEach((c) => c.kill()); };
  });
}

function initBonus(root, { animated }) {
  const el = root.querySelector('[data-bonus]');
  if (!el) return;
  if (!animated) {
    el.dataset.state = 'full';
    return;
  }
  const { gsap } = window;
  const progress = el.querySelector('.bonus__progress');
  const chip = el.querySelector('.bonus__chip');
  gsap.set(progress, { strokeDashoffset: 100 });
  gsap.set(chip, { scale: 0, opacity: 0 });
  gsap.timeline({
    scrollTrigger: { trigger: el, start: 'top 70%', once: true },
    onComplete: () => { el.dataset.state = 'full'; },
  })
    .to(progress, { strokeDashoffset: 0, duration: 1.2, ease: EASE.inOut })
    .to(chip, { scale: 1, opacity: 1, duration: 0.5, ease: EASE.pop });
}

/* 사탕 버튼 누름: 0.94배로 눌렸다가 튕겨 돌아온다(클라이언트 값). 설치 배지는 그림을 바꾸지 않기 위해 제외. */
function initPressFeedback(root) {
  const { gsap } = window;
  root.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('pointerdown', () => gsap.to(btn, { scale: 0.94, duration: DUR.press, ease: 'power2.out' }));
    const release = () => gsap.to(btn, { scale: 1, duration: DUR.release, ease: EASE.press });
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
  });
}
```

- [ ] **Step 5: `assets/js/main.js`를 최종본으로 바꾼다**

```js
// 메인 페이지 시작점: 메뉴, 부드러운 스크롤, 첫 화면 연출(릴·코인·색종이·배경 패럴랙스), 섹션 연출.
import { prefersReducedMotion, CONFETTI_COLORS } from './motion.js';
import { initNav } from './nav.js';
import { createParticles } from './particles.js';
import { initHeroReels } from './hero-reels.js';
import { initSections } from './sections.js';

const reduced = prefersReducedMotion();
const { gsap, ScrollTrigger, SplitText } = window;

if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger, ...(SplitText ? [SplitText] : []));
initNav();
initSmoothScroll();
const fx = initHeroFx();
initHero();
document.fonts.ready.then(() => initSections(document, { reduced }));

function initSmoothScroll() {
  if (reduced || !window.Lenis || !gsap || !ScrollTrigger) return;
  const lenis = new window.Lenis({ autoRaf: false, anchors: { offset: -80 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function initHeroFx() {
  const canvas = document.querySelector('[data-particles]');
  if (!canvas) return null;
  const coinSheet = new Image();
  coinSheet.src = 'assets/img/icons/coin-sheet.webp';
  const particles = createParticles(canvas, { coinSheet, reduced });
  particles.start();
  const confettiCanvas = document.querySelector('[data-confetti]');
  // useWorker:false — Worker(blob:)를 만들지 않아 CSP 를 넓히지 않는다
  const shoot = !reduced && window.confetti && confettiCanvas
    ? window.confetti.create(confettiCanvas, { resize: true, useWorker: false })
    : null;
  return { canvas, particles, shoot };
}

function celebrate(reelsRect) {
  if (!fx) return;
  const box = fx.canvas.getBoundingClientRect();
  const cx = reelsRect.left + reelsRect.width / 2 - box.left;
  const cy = reelsRect.top + reelsRect.height * 0.4 - box.top;
  fx.particles.burst(cx, cy, 36);
  if (fx.shoot) {
    const origin = { x: cx / box.width, y: (reelsRect.top - box.top) / box.height };
    const base = { particleCount: 70, spread: 75, startVelocity: 42, colors: CONFETTI_COLORS, scalar: 0.9, ticks: 220 };
    fx.shoot({ ...base, angle: 115, origin: { x: origin.x - 0.12, y: origin.y } });
    fx.shoot({ ...base, angle: 65, origin: { x: origin.x + 0.12, y: origin.y } });
  }
  document.querySelectorAll('[data-play-badge]').forEach((badge) => {
    badge.classList.remove('is-celebrating');
    void badge.offsetWidth; // 빛 애니메이션을 처음부터 다시
    badge.classList.add('is-celebrating');
  });
}

async function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const reels = initHeroReels(hero, { reduced, onLand: (_, rect) => celebrate(rect) });
  if (!reels) return;
  hero.classList.add('is-interactive');
  // LCP(키 아트)를 늦추지 않도록 그림은 투명도를 건드리지 않고 크기만 살짝
  gsap.from('.hero__stage', { scale: 1.04, duration: 0.9, ease: 'power2.out' });
  gsap.from('.hero__copy > *', { y: 18, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08, delay: 0.15 });
  if (ScrollTrigger) {
    // 배경 패럴랙스: 스크롤하면 흐린 배경이 앞 그림보다 느리게 내려간다
    const scrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero__backdrop img', { yPercent: 12, ease: 'none', scrollTrigger: scrub });
    gsap.to('.hero__stage', { yPercent: 6, ease: 'none', scrollTrigger: { ...scrub } });
  }
  await Promise.all([waitForImage(hero.querySelector('.hero__art')), reels.ready]);
  gsap.delayedCall(0.5, () => reels.spin('seven'));
}

function waitForImage(img) {
  if (!img) return Promise.resolve();
  if (img.complete) return img.decode().catch(() => {});
  return new Promise((resolve) => {
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  });
}
```

- [ ] **Step 6: 모든 테스트를 돌린다**

Run: `npm run test:unit && npx playwright test`
Expected: 모두 PASS. 실패하면 각 테스트 이름이 가리키는 모듈을 고친다. 테스트 기대값을 낮추지 않는다.

- [ ] **Step 7: 눈으로 확인한다**

미리보기 1440×900에서 위에서 아래까지 천천히 스크롤해 본다.
- 제목이 단어 단위로 떠오르는가
- 층 섹션이 화면에 고정된 동안 1F→5F가 차례로 열리고, 고정이 풀린 뒤 레이아웃이 튀지 않는가
- 잭팟 숫자가 자릿수별로 굴러가는가
- 슬롯 카드가 3D로 기울어 넘어가는가

375×812에서는 층이 고정 없이 차례로 열리는지 확인한다.

- [ ] **Step 8: 커밋한다**

```bash
git add assets/js tests/unit/odometer.test.mjs tests/e2e/sections.spec.mjs
git commit -m "feat(site): scroll reveals, coverflow slots, jackpot odometer, floor unlocks, bonus ring and smooth scroll"
```

---

### Task 9: 정책 페이지와 404

**Files:**
- Create: `assets/css/legal.css`, `assets/js/page.js`, `tests/unit/legal-text.test.mjs`, `tests/e2e/legal.spec.mjs`
- Modify: `privacy-policy.html`, `terms-of-service.html`, `404.html`(전체 교체)

**Interfaces:**
- Consumes: `initNav`(Task 5), `prefersReducedMotion`(Task 7), 컴포넌트 CSS
- Produces: 정책 페이지 본문 래퍼 `.legal` > `.legal__panel.panel`, 404 `[data-jam]`

- [ ] **Step 1: 법률 문구 보존 테스트와 e2e를 먼저 쓴다**

`tests/unit/legal-text.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// 리뉴얼 직전 커밋. 법률 문구는 앱 이름·회사명 외에는 이 커밋과 같아야 한다.
const BASE = '5690ce6';

function mainText(html) {
  const m = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  assert.ok(m, 'no <main>');
  return m[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

for (const page of ['privacy-policy.html', 'terms-of-service.html']) {
  test(`${page} keeps the legal text except the app and company names`, () => {
    const before = execFileSync('git', ['show', `${BASE}:${page}`], { encoding: 'utf8' });
    const expected = mainText(before)
      .replaceAll('Social Casino2', 'Golden Hour - Slots Casino')
      .replaceAll('Vglobal Inc.', 'Vglobal Co., Ltd.');
    assert.equal(mainText(readFileSync(page, 'utf8')), expected);
  });
}
```

`tests/e2e/legal.spec.mjs`:
```js
import { test, expect } from './fixtures.mjs';

for (const [path, h1] of [['/privacy-policy.html', 'Privacy Policy'], ['/terms-of-service.html', 'Terms of Service']]) {
  test(`${path} renders in the new frame without errors`, async ({ page, problems }) => {
    await page.goto(path);
    await expect(page.locator('main h1')).toHaveText(h1);
    await expect(page.locator('header.site-nav')).toHaveClass(/is-solid/);
    await expect(page.locator('footer.site-footer')).toContainText('no cash value');
    await expect(page.locator('body')).not.toContainText('Social Casino2');
    await page.waitForLoadState('networkidle');
    expect(problems).toEqual([]);
  });
}

test('404 page is noindex and links home', async ({ page, problems }) => {
  await page.goto('/404.html');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('h1')).toHaveText('This reel got stuck');
  await expect(page.locator('main a.btn')).toHaveAttribute('href', '/');
  await page.waitForLoadState('networkidle');
  expect(problems).toEqual([]);
});

test('404 assets load even from a nested missing path', async ({ page }) => {
  // GitHub Pages 는 /no/such/page 같은 경로에서도 404.html 을 그대로 보여 준다. 그 상황을 흉내 낸다.
  await page.route('**/no/such/page', (route) => route.fulfill({ path: '404.html', contentType: 'text/html' }));
  await page.goto('/no/such/page');
  const broken = await page.locator('img').evaluateAll((imgs) => imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src));
  expect(broken).toEqual([]);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(21, 8, 48)');
});
```

Run: `node --test tests/unit/legal-text.test.mjs && npx playwright test tests/e2e/legal.spec.mjs --project=desktop`
Expected: 단위 테스트는 앱 이름이 아직 바뀌지 않아 FAIL. e2e도 FAIL(`header.site-nav` 없음).

- [ ] **Step 2: `assets/css/legal.css`를 만든다**

```css
/* ── 정책 페이지 ─────────────────────────────────────────────────────── */
.legal { padding-block: calc(var(--nav-h) + 48px) var(--space-section); }
.legal__panel { padding: clamp(28px, 5vw, 64px); }
.legal__panel h1 {
  margin-bottom: 24px;
  font-family: var(--font-display);
  font-size: clamp(2rem, 1.4rem + 2.4vw, 3rem);
  color: transparent;
  background: var(--g-gold-text);
  -webkit-background-clip: text;
  background-clip: text;
}
.legal__panel h2 { margin: 40px 0 12px; color: #fff4c9; font-family: var(--font-display); font-size: clamp(1.25rem, 1.1rem + .6vw, 1.5rem); }
.legal__panel p,
.legal__panel li { max-width: 70ch; font-size: 1.0625rem; line-height: 1.7; }
.legal__panel p { margin-bottom: 14px; }
.legal__panel ul,
.legal__panel ol { margin: 0 0 14px 1.25em; padding: 0; }
.legal__panel a { color: var(--c-gold-light); overflow-wrap: anywhere; }

/* ── 404 ─────────────────────────────────────────────────────────────── */
.page-404 .site-nav .play-badge { margin-left: auto; }
.error { display: grid; place-items: center; min-height: 100dvh; padding: calc(var(--nav-h) + 32px) 0 64px; text-align: center; }
.error__inner { display: grid; justify-items: center; gap: 20px; }
.error__machine {
  display: flex;
  gap: 10px;
  padding: 14px;
  border-radius: 28px;
  background: var(--g-panel);
  box-shadow: 0 0 0 3px #c26d0e, var(--shadow-panel);
}
.error__reel {
  display: grid;
  place-items: center;
  width: clamp(64px, 14vw, 104px);
  aspect-ratio: 252 / 435;
  overflow: hidden;
  border-radius: 12px;
  background: linear-gradient(90deg, #cdb894, #fff9ec 50%, #cdb894);
}
.error__reel img { width: 100%; height: 100%; object-fit: cover; }
.error__reel--chip img { width: 70%; height: auto; object-fit: contain; }
.error p { color: var(--c-text-dim); font-size: 1.125rem; }
```

- [ ] **Step 3: `assets/js/page.js`를 만든다**

```js
// 정책·404 페이지 시작점: 메뉴, 404 의 걸린 릴 흔들림.
import { initNav } from './nav.js';
import { prefersReducedMotion } from './motion.js';

initNav();

const jam = document.querySelector('[data-jam]');
if (jam && window.gsap && !prefersReducedMotion()) {
  window.gsap.timeline({ repeat: -1, repeatDelay: 2.2 })
    .to(jam, { yPercent: -8, duration: 0.08, ease: 'power1.inOut', yoyo: true, repeat: 5 })
    .to(jam, { rotate: -4, duration: 0.12, ease: 'power2.out' })
    .to(jam, { rotate: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
}
```

- [ ] **Step 4: 두 정책 페이지의 틀을 바꾼다(본문은 그대로)**

각 파일에서 `<main …>` 앞부분 전체를 아래 머리(`<head>`, 메뉴)로 바꾼다. 아래 값은 페이지마다 다르다.

| 페이지 | TITLE | DESCRIPTION | PATH |
|---|---|---|---|
| privacy-policy.html | `Privacy Policy \| Golden Hour – Slots Casino` | `How Vglobal Co., Ltd. collects, uses and protects your information in Golden Hour – Slots Casino.` | `privacy-policy.html` |
| terms-of-service.html | `Terms of Service \| Golden Hour – Slots Casino` | `The rules and user agreement for Golden Hour – Slots Casino by Vglobal Co., Ltd.` | `terms-of-service.html` |

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://www.googletagmanager.com; connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com; img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>TITLE</title>
  <meta name="description" content="DESCRIPTION">
  <link rel="canonical" href="https://sscgl.vglobal.site/PATH">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#150830">
  <meta name="color-scheme" content="dark">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Golden Hour – Slots Casino">
  <meta property="og:title" content="TITLE">
  <meta property="og:description" content="DESCRIPTION">
  <meta property="og:url" content="https://sscgl.vglobal.site/PATH">
  <meta property="og:image" content="https://sscgl.vglobal.site/assets/img/og/og-golden-hour.jpg">
  <link rel="icon" href="favicon.ico" sizes="48x48">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/img/brand/favicon-32.png">
  <link rel="apple-touch-icon" href="assets/img/brand/apple-touch-icon.png">
  <link rel="preload" href="assets/fonts/gh-display-900.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/css/tokens.css">
  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/components.css">
  <link rel="stylesheet" href="assets/css/legal.css">
  <script defer src="assets/js/analytics.js"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-0JJDZ3R7EH"></script>
  <script type="module" src="assets/js/page.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-nav" data-nav>
    <div class="site-nav__inner container">
      <a class="brand" href="./" aria-label="Golden Hour home">
        <img class="brand__icon" src="assets/img/brand/app-icon-128.webp" alt="" width="128" height="128">
        <span class="brand__name">Golden Hour</span>
      </a>
      <nav class="site-nav__menu" id="site-menu" aria-label="Primary">
        <a href="./#slots">Slots</a>
        <a href="./#lucky-time">Features</a>
        <a href="./#faq">FAQ</a>
      </nav>
      <a class="play-badge play-badge--sm" href="https://play.google.com/store/apps/details?id=site.vglobal.android.casinog" target="_blank" rel="noopener" data-track="play_store_click" data-track-location="nav">
        <img src="assets/img/badges/google-play-en.png" alt="Get it on Google Play" width="646" height="250">
      </a>
      <button class="site-nav__toggle" type="button" aria-controls="site-menu" aria-expanded="false" data-nav-toggle>
        <span class="sr-only">Menu</span>
        <svg class="icon-menu" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        <svg class="icon-close" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  </header>
```
(SVG 값은 Task 5 Step 4에서 확인한 Lucide 값과 같게 한다.)

`<main class="privacy-policy">`와 그 바로 안의 `<div class="container">`를 아래로 바꾼다. 닫는 `</div>`는 `</article></div>`로 바꾼다.
```html
  <main id="main" class="legal">
    <div class="container container--narrow">
      <article class="legal__panel panel">
```
`<h1>`부터 마지막 `</p>`까지의 기존 본문은 한 글자도 바꾸지 않는다. 그다음 두 가지만 바꾼다.
```bash
perl -pi -e 's/Social Casino2/Golden Hour - Slots Casino/g; s/Vglobal Inc\./Vglobal Co., Ltd./g' privacy-policy.html terms-of-service.html
```

`</main>` 뒤의 옛 하단과 인라인 `<script>`는 지우고, Task 5 `index.html`의 `<footer class="site-footer">…</footer>`를 그대로 붙인 뒤 `</body></html>`로 닫는다.

- [ ] **Step 5: `404.html`을 새로 쓴다(모든 로컬 경로는 `/`로 시작)**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://www.googletagmanager.com; connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com; img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Page not found | Golden Hour – Slots Casino</title>
  <meta name="robots" content="noindex">
  <meta name="theme-color" content="#150830">
  <meta name="color-scheme" content="dark">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="preload" href="/assets/fonts/gh-display-900.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/base.css">
  <link rel="stylesheet" href="/assets/css/components.css">
  <link rel="stylesheet" href="/assets/css/legal.css">
  <script defer src="/assets/js/analytics.js"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-0JJDZ3R7EH"></script>
  <script defer src="/assets/vendor/gsap-3.15.0/gsap.min.js"></script>
  <script type="module" src="/assets/js/page.js"></script>
</head>
<body class="page-404">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-nav" data-nav>
    <div class="site-nav__inner container">
      <a class="brand" href="/" aria-label="Golden Hour home">
        <img class="brand__icon" src="/assets/img/brand/app-icon-128.webp" alt="" width="128" height="128">
        <span class="brand__name">Golden Hour</span>
      </a>
      <a class="play-badge play-badge--sm" href="https://play.google.com/store/apps/details?id=site.vglobal.android.casinog" target="_blank" rel="noopener" data-track="play_store_click" data-track-location="404">
        <img src="/assets/img/badges/google-play-en.png" alt="Get it on Google Play" width="646" height="250">
      </a>
    </div>
  </header>
  <main id="main" class="error">
    <div class="container error__inner">
      <div class="error__machine" aria-hidden="true">
        <div class="error__reel"><img src="/assets/img/reels/seven.webp" alt="" width="252" height="435"></div>
        <div class="error__reel" data-jam><img src="/assets/img/reels/seven.webp" alt="" width="252" height="435"></div>
        <div class="error__reel error__reel--chip"><img src="/assets/img/icons/chip.webp" alt="" width="152" height="152"></div>
      </div>
      <h1 class="gold-title" data-text="This reel got stuck">This reel got stuck</h1>
      <p>The page you're looking for doesn't exist or has moved.</p>
      <a class="btn" href="/">Back to home</a>
    </div>
  </main>
</body>
</html>
```

- [ ] **Step 6: 테스트와 점검을 돌린다**

Run: `node --test tests/unit/legal-text.test.mjs`
Expected: PASS(2개). 실패하면 diff에 나온 문장을 원래대로 되돌린다.

Run: `npx playwright test tests/e2e/legal.spec.mjs`
Expected: PASS

Run: `npm run verify`
Expected: `verify (refs,inline,vendor,budget,abs404): OK`. 이제 옛 페이지가 없으므로 모든 점검이 통과해야 한다.

- [ ] **Step 7: 커밋한다**

```bash
git add privacy-policy.html terms-of-service.html 404.html assets/css/legal.css assets/js/page.js tests/unit/legal-text.test.mjs tests/e2e/legal.spec.mjs
git commit -m "feat(site): restyle privacy policy, terms and 404 for Golden Hour"
```

---

### Task 10: 옛 파일 정리와 최종 검증

**Files:**
- Delete: `styles.css`, `carousel.js`, `images/`(그리고 사용자가 승인하면 `.htaccess`)
- Create: `tests/e2e/perf.spec.mjs`
- Modify: `sitemap.xml`(lastmod), `docs/superpowers/specs/2026-10-08-golden-hour-site-redesign-design.md`(달라진 점 반영, 상태)

- [ ] **Step 1: 성능 테스트를 쓴다**

`tests/e2e/perf.spec.mjs`:
```js
import { test, expect } from './fixtures.mjs';

// 느린 4G(1.6Mbps, 지연 150ms)와 CPU 4배 감속에서 LCP 를 잰다. 로컬 서버는 압축을 안 하므로 실제보다 불리한 조건이다.
test('LCP stays under 2.5s on a throttled phone', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile only');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('/', { waitUntil: 'load' });
  const lcp = await page.evaluate(() => new Promise((resolve) => {
    new PerformanceObserver((list) => resolve(list.getEntries().at(-1).startTime))
      .observe({ type: 'largest-contentful-paint', buffered: true });
  }));
  console.log(`LCP ${Math.round(lcp)}ms`);
  expect(lcp).toBeLessThan(2500);
});

test('layout shift stays under 0.1 during the hero animation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-reels]')).toHaveAttribute('data-state', /landed|static/, { timeout: 10_000 });
  const cls = await page.evaluate(() => new Promise((resolve) => {
    let total = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) total += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve(total), 300);
  }));
  expect(cls).toBeLessThan(0.1);
});
```

Run: `npx playwright test tests/e2e/perf.spec.mjs`
Expected: PASS. LCP가 2.5초를 넘으면 원인을 찾아 고친다. 테스트 출력에서 LCP 요소를 확인하고, 첫 화면 이미지의 preload와 `sizes`, 글꼴 preload를 점검한다.

- [ ] **Step 2: `.htaccess` 삭제를 사용자에게 확인한다**

AskUserQuestion으로 묻는다: "GitHub Pages는 `.htaccess`를 읽지 않습니다. 이 사이트를 Apache 서버에 올릴 계획이 없으면 지워도 될까요?" 답에 따라 지우거나 남긴다.

- [ ] **Step 3: 옛 파일을 지운다**

```bash
grep -rn "styles\.css\|carousel\.js\|images/" --include=*.html . | grep -v node_modules || echo "no references"
git rm -q styles.css carousel.js
git rm -rq images
```
Expected: 첫 명령은 `no references`를 출력한다.

- [ ] **Step 4: 전체 테스트와 점검을 돌린다**

Run: `npm test`
Expected: 단위 테스트, `verify`, e2e(3개 프로젝트)가 모두 PASS

- [ ] **Step 5: 실제 GA로 CSP를 확인한다(가짜 응답 없이)**

미리보기(`preview_start name=site`)로 `http://127.0.0.1:4173/`를 연다. 10초 기다린 뒤 콘솔 오류를 읽는다(`read_console_messages onlyErrors=true`). `Refused to …` CSP 위반이 GA 관련 주소에서 나오면 처리 방법은 이렇다.
1. 그 주소를 Global Constraints의 CSP와 HTML 4개에 같은 값으로 더한다. 예: `https://www.google.com`(connect-src)
2. `shell.spec.mjs`의 CSP 테스트에 기대값을 더한다.

위반이 없으면 그대로 둔다.

- [ ] **Step 6: 화면 크기별로 최종 확인하고 품질 점검 목록을 채운다**

1440×900, 1280×720, 768×1024, 375×812, 375×667에서 첫 화면과 각 섹션을 캡처한다. 설계 문서 12절 목록을 하나씩 확인한다.
- [ ] 첫 화면에서 lede(20단어 이하)와 배지가 스크롤 없이 보인다(375×667 포함)
- [ ] 첫 화면 글자 요소는 제목(그림), lede, 배지, 18+ 4개다
- [ ] 설치 버튼은 공식 배지 하나다(메뉴, 첫 화면, 마지막 섹션 모두 같음)
- [ ] 섹션 배치가 겹치지 않는다. 그림과 글을 좌우로 나눈 섹션은 럭키 타임과 층 2개만 연속된다
- [ ] 제목 위 작은 대문자 라벨이 없다
- [ ] 모서리는 큰 판 32/24, 상자 16, 줄 18, 버튼·배지 알약만 쓴다
- [ ] 4칸 격자에 빈칸이 없다
- [ ] div로 만든 가짜 화면, 가짜 평점, 가짜 후기가 없다. 잭팟 숫자는 "Virtual chips. No cash value."가 붙은 장식이다
- [ ] 메뉴가 데스크톱에서 한 줄이고 72px 이하다
- [ ] 다단 배치 모두에 767px 이하 배치가 있다
- [ ] 동작 줄이기, transform·opacity 위주, 스크롤 이벤트 직접 사용 없음
- [ ] 문구에 `!` 남발과 빈말이 없다

- [ ] **Step 7: 설계 문서와 사이트맵을 맞춘다**

설계 문서 `docs/superpowers/specs/2026-10-08-golden-hour-site-redesign-design.md`를 고친다.
- 맨 위 상태를 "구현 완료"로 바꾼다.
- 이 계획의 "설계 문서와 달라진 점" 8개를 해당 절(5.5, 6.1, 6.2, 7.1, 7.4, 4.1, 4.3)에 반영한다.
- 6.2절에 "첫 화면 로고 빛 스침은 로고가 키 아트 그림에 포함되어 있어 잭팟 간판에만 적용"을 더한다.

`sitemap.xml`의 `lastmod` 3개를 오늘 날짜로 바꾼다.

- [ ] **Step 8: 커밋한다**

```bash
git add -A tests/e2e/perf.spec.mjs sitemap.xml docs/superpowers/specs/2026-10-08-golden-hour-site-redesign-design.md
git commit -m "chore(site): remove legacy files, add performance checks, sync spec"
```

---

### Task 11: 새 UI 촬영본으로 교체(클라이언트 세션 소재 도착 후)

클라이언트 세션이 인증 v2 작업을 끝내고 `assets/img/_incoming/`에 `shot_*.png` 7장과 `slot_*.png`·`slots.txt`를 넣으면 진행한다. 그 전에는 Task 10까지로 배포할 수 있는 상태다(옛 UI 홍보 화면을 쓴 상태).

**Files:**
- Modify: `scripts/build-images.sh`, `index.html`(alt 문구, 슬롯 카드), `tests/unit/images.test.mjs`

- [ ] **Step 1: 받은 파일을 확인한다**

```bash
ls -l assets/img/_incoming/shot_*.png assets/img/_incoming/slot_*.png assets/img/_incoming/slots.txt
for f in assets/img/_incoming/shot_*.png; do sips -g pixelWidth -g pixelHeight "$f" | tail -2 | tr '\n' ' '; echo " $f"; done
```
Expected: `shot_*.png` 7장이 모두 1920×1080이다. 닉네임이 가짜 값인지 이미지를 열어 확인한다. 실제 사용자처럼 보이면 클라이언트 세션에 다시 요청한다.

- [ ] **Step 2: 변환 스크립트의 기능 화면 출처를 바꾼다**

`scripts/build-images.sh`의 `SHOTS` 블록과 그 위 `while` 줄을 아래로 바꾼다(출처를 `_incoming`으로):
```bash
while read -r name src; do
  for w in 960 1600; do webp "$IN/$src.png" "$OUT/features/$name-$w.webp" "$w" 80; done
done <<'SHOTS'
lobby shot_lobby_floor
lucky-time shot_lucky_time
jackpot shot_major_jackpot
floors shot_floor_unlock
ranking shot_top25
social shot_social
bonus shot_chip_bonus
SHOTS
```
`tests/unit/images.test.mjs`의 기능 화면 목록을 `['jackpot', 'lucky-time', 'floors', 'ranking', 'lobby', 'social', 'bonus']`로 늘린다.

Run: `scripts/build-images.sh && node --test tests/unit/images.test.mjs`
Expected: PASS

- [ ] **Step 3: 새 화면을 페이지에 연결한다**

`index.html`에서 바꿀 것:
- **alt 문구**: 새 화면에 맞게 고친다. `Lucky Time active in the lobby`, `Major Jackpot win`, `A new floor unlocking`, `Daily Top 25 ranking`
- **소셜 격자의 `bento__cell--messages`**: 아이콘 SVG를 `assets/img/features/social-960.webp` 그림으로 바꾼다. `bento__cell--rank`와 같은 구조(`<img>` + `.bento__text`)로 하고, CSS는 `.bento__cell--messages > img`에 `.bento__cell--rank > img`와 같은 규칙을 더한다.
- **보너스 섹션**: `.bonus__inner` 끝에 `<figure class="shot" data-reveal>`로 `bonus-960/1600` 그림을 넣는다(폭 `min(560px, 92vw)`).
- **슬롯 카드**: `slots.txt`의 이름·테마가 지금 카드 12장과 다르면 `index.html` 슬롯 카드의 이름·`.tag`를 그 목록대로 고친다. 새 `slot_*.png`가 있으면 `build-images.sh`의 `SLOTS` 블록 출처를 `_incoming`으로 바꾼다.

- [ ] **Step 4: 전체 테스트를 돌리고 눈으로 확인한다**

Run: `npm test`
Expected: PASS. 미리보기에서 바뀐 섹션을 3가지 화면 크기로 캡처해 확인한다.

- [ ] **Step 5: 커밋한다**

```bash
git add scripts/build-images.sh assets/img/features index.html assets/css/sections.css tests/unit/images.test.mjs
git commit -m "feat(site): swap in new-UI gameplay captures"
```

---

## 실행 중 사용자 확인이 필요한 지점

- Task 2·3·5에서 npm 레지스트리 패키지를 받는다(`npm pack`). 받는 패키지는 gsap, lenis, swiper, canvas-confetti, @fontsource/source-sans-3, lucide-static이다. Task 1에서는 @playwright/test를 설치하고, Task 3에서는 fontTools(pip)를 설치한다. Task 4에서는 Google Play 공식 배지 PNG(약 10KB, `play.google.com`)를 받는다. 계획을 승인하면 이 다운로드도 승인한 것으로 본다.
- Task 10 Step 2: `.htaccess` 삭제 여부
- Task 10 Step 5에서 CSP에 GA 주소를 더해야 하는 경우, 무엇을 더했는지 알린다.
- 지원 이메일이 두 개다. 사이트에는 `vglobalinfo24@gmail.com`, 개인정보처리방침 본문에는 `vglobalinfo2024@gmail.com`이 적혀 있다. 법률 문서는 고치지 않으므로, 어느 쪽이 맞는지 사용자에게 알리고 확인을 받는다.
