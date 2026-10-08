import { test, expect } from './fixtures.mjs';

const SECTION_IDS = ['top', 'slots', 'lucky-time', 'floors', 'social', 'bonus', 'faq', 'download'];

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
  expect(await page.locator('.tiers > .tier').count()).toBe(4);
  expect(await page.locator('.bento > .bento__cell').count()).toBe(4);
  expect(await page.locator('[data-tower] .floor').count()).toBe(5);
  expect(await page.locator('.faq__item').count()).toBe(6);
});

test('jackpot area uses chips, never currency or live wording', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('#lucky-time').textContent();
  expect(text).not.toMatch(/[$€£¥₩]/);
  expect(text).not.toMatch(/\blive\b/i);
  await expect(page.locator('#lucky-time')).toContainText('Virtual chips. No cash value.');
});

test('FAQ answers open', async ({ page }) => {
  await page.goto('/#faq');
  const first = page.locator('.faq__item').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('.faq__answer')).toContainText('No.');
});

test('social and bonus sections show the new-UI captures from the web prototype', async ({ page }) => {
  await page.goto('/');
  const shots = await page.locator('.bento__cell--shot > img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('src')));
  expect(shots).toEqual([
    'assets/img/features/ranking-960.webp',
    'assets/img/features/gifts-960.webp',
    'assets/img/features/messages-960.webp',
  ]);
  await expect(page.locator('#bonus .shot img')).toHaveAttribute('src', 'assets/img/features/time-bonus-700.webp');
});
