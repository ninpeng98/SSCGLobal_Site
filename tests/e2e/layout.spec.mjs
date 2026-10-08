import { test, expect } from './fixtures.mjs';

const SECTION_IDS = ['top', 'slots', 'lucky-time', 'floors', 'daily-jackpot', 'bonus', 'social', 'faq', 'download'];

test('sections appear in order with no console errors', async ({ page, problems }) => {
  await page.goto('/');
  const ids = await page.locator('main section[id]').evaluateAll((s) => s.map((x) => x.id));
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
  expect(await page.locator('.slot-card').count()).toBe(14);
  expect(await page.locator('.daily__meters > .meter').count()).toBe(4);
  expect(await page.locator('.social-cards > .social-card').count()).toBe(3);
  expect(await page.locator('[data-elevator] .floor').count()).toBe(10);
  expect(await page.locator('[data-elevator] .floor__slots > li').count()).toBe(47);
  expect(await page.locator('.faq__item').count()).toBe(8); // 계정 삭제 질문 포함
});

test('jackpot areas use chips, never currency or live wording', async ({ page }) => {
  await page.goto('/');
  for (const id of ['#lucky-time', '#daily-jackpot']) {
    const text = await page.locator(id).textContent();
    expect(text, id).not.toMatch(/[$€£¥₩]/);
    expect(text, id).not.toMatch(/\blive\b/i);
    await expect(page.locator(id)).toContainText(/Virtual chips[ .,a-z]*no cash value/i);
  }
});

test('FAQ answers open', async ({ page }) => {
  await page.goto('/#faq');
  const first = page.locator('.faq__item').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('.faq__answer')).toContainText('No.');
});

test('social cards use the new-UI captures (nicknames swapped, no popup frame) in one even row', async ({ page }, info) => {
  await page.goto('/');
  const cards = page.locator('.social-card');
  const shots = await cards.locator('img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('src')));
  expect(shots).toEqual([
    'assets/img/features/ranking-960.webp',
    'assets/img/features/gifts-960.webp',
    'assets/img/features/messages-960.webp',
  ]);
  const boxes = await cards.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ w: Math.round(r.width), top: Math.round(r.top) })));
  if (info.project.name === 'desktop') {
    expect(new Set(boxes.map((b) => b.w)).size).toBe(1);
    expect(new Set(boxes.map((b) => b.top)).size).toBe(1);
  }
  await expect(page.locator('#bonus .collect-demo__plate img').first()).toHaveAttribute('src', 'assets/img/collect/plate-wait.webp');
});

test('rankings explain Peerage: win 1st place, climb six shield tiers, boost the Daily Jackpot', async ({ page }) => {
  await page.goto('/');
  const peerage = page.locator('#social .peerage');
  await expect(peerage.locator('.peerage__ladder .peerage__name')).toHaveText(['Bronze', 'Silver', 'Sapphire', 'Ruby', 'Royal Gold', 'Diamond']);
  // 등급별 데일리 잭팟 보너스(레벨 1~5): 사용자가 준 표
  await expect(peerage.locator('.peerage__ladder .peerage__bonus')).toHaveText(['+0–40%', '+60–120%', '+150–230%', '+270–350%', '+390–470%', '+520–600%']);
  await expect(peerage.locator('.peerage__ladder img')).toHaveCount(6);
  await expect(peerage).toContainText('1st');
  await expect(peerage).toContainText('+600%');
  await expect(page.locator('#daily-jackpot')).toContainText('+600%');
  await expect(page.locator('body')).not.toContainText('+500%');
  await expect(peerage.locator('.shot, img[src*="features/peerage"]')).toHaveCount(0);
});

// 섹션 리듬: 앞 섹션 내용의 아래 끝 → 다음 섹션 제목의 위 끝 = 섹션 여백 두 번(위·아래). 랭킹과 FAQ 사이의 팀 띠는 띠의 테두리까지가 여백 한 번
test('sections keep one even rhythm between their content and the next title', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const gaps = await page.evaluate(() => {
    const space = parseFloat(getComputedStyle(document.querySelector('#slots')).paddingTop);
    const flow = (sec) => [...sec.querySelectorAll(':scope > *, :scope > .container > *, :scope > .hero__copy > *')]
      .filter((e) => !['absolute', 'fixed'].includes(getComputedStyle(e).position) && !e.matches('.container, .hero__copy, .hero__backdrop') && e.getBoundingClientRect().height > 0)
      .map((e) => e.getBoundingClientRect());
    const flowBottom = (sec) => Math.max(...flow(sec).map((r) => r.bottom));
    const headTop = (sec) => Math.min(...flow(sec).map((r) => r.top));
    const ids = ['top', 'slots', 'lucky-time', 'floors', 'daily-jackpot', 'bonus', 'social'];
    const out = {};
    for (let i = 0; i < ids.length - 1; i += 1) {
      out[`${ids[i]}→${ids[i + 1]}`] = Math.round((headTop(document.getElementById(ids[i + 1])) - flowBottom(document.getElementById(ids[i]))) / space * 100) / 100;
    }
    const team = document.querySelector('.team').getBoundingClientRect();
    out['social→team band'] = Math.round((team.top - flowBottom(document.getElementById('social'))) / space * 100) / 100;
    out['team band→faq'] = Math.round((headTop(document.getElementById('faq')) - team.bottom) / space * 100) / 100;
    return out;
  });
  const want = Object.fromEntries(Object.keys(gaps).map((k) => [k, k.includes('team') ? 1 : 2]));
  // 여백 단위로 ±0.1(데스크톱 14px, 휴대폰 7px)
  for (const k of Object.keys(gaps)) expect(Math.abs(gaps[k] - want[k]), `${k}: ${JSON.stringify(gaps)}`).toBeLessThanOrEqual(0.1);
});
