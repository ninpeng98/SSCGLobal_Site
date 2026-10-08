import { test, expect } from './fixtures.mjs';

const stage = (page) => page.locator('[data-elevator]');
const current = async (page) => Number(await stage(page).getAttribute('data-current'));

test('the elevator starts on floor 1 with the real 1st-floor slots, big enough to read', async ({ page, problems }, info) => {
  await page.goto('/');
  await stage(page).scrollIntoViewIfNeeded();
  await expect(stage(page)).toHaveClass(/is-ready/);
  const floor1 = page.locator('.floor[data-floor="1"]');
  await expect(floor1).toBeVisible();
  await expect(floor1.locator('.floor__name')).toHaveText(['Treasure Island', 'Zombie Hunter', 'Stone Age', 'Gangsters Poker', 'Curse of the Pharaohs', 'Fairy Garden', 'Halloween Witch']);
  await expect(page.locator('.floor[data-floor="2"]')).toBeHidden();
  const w = (await floor1.locator('img').first().boundingBox()).width;
  expect(w).toBeGreaterThanOrEqual(info.project.name === 'mobile' ? 68 : 110);
  expect(problems).toEqual([]);
});

test('a short scroll is enough to go up a floor, and the slots pop in as the floor unlocks', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'pinned elevator is desktop-only');
  await page.goto('/');
  await page.locator('#floors').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo({ top: document.getElementById('floors').getBoundingClientRect().top + window.scrollY + 2, behavior: 'instant' }));
  await expect.poll(() => current(page)).toBe(1);
  await page.mouse.wheel(0, 200);
  await expect.poll(() => current(page), { timeout: 2_000 }).toBeGreaterThanOrEqual(2);
  const floor = page.locator(`.floor[data-floor="${await current(page)}"]`);
  await expect(floor).toHaveClass(/is-open/, { timeout: 3_000 });
  for (let i = 0; i < 30 && (await current(page)) < 10; i += 1) {
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(60);
  }
  await expect.poll(() => current(page)).toBe(10);
  await expect(page.locator('.floor[data-floor="10"] .floor__name')).toHaveText(['Ranch Story', 'Pirate Ship', 'Gold Mine', 'Jewelry Fever']);
  await expect(page.locator('.floors__bg img[data-bg="4"]')).toHaveClass(/is-active/);
});

test('the floor panel jumps straight to a floor and switches the lobby background', async ({ page }) => {
  await page.goto('/');
  await stage(page).scrollIntoViewIfNeeded();
  await page.locator('.floor-btn[data-go="7"]').click();
  await expect.poll(() => current(page)).toBe(7);
  await expect(page.locator('.floor-btn[data-go="7"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.floor[data-floor="7"]')).toBeVisible();
  await expect(page.locator('.floor[data-floor="7"] .floor__req')).toHaveText('Unlocks at 500M chips');
  await expect(page.locator('.floors__bg img[data-bg="3"]')).toHaveClass(/is-active/);
});

test('on phones the elevator rides up by itself while in view, and stops once you pick a floor', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop', 'auto ride is for touch layouts');
  await page.goto('/');
  await stage(page).scrollIntoViewIfNeeded();
  await expect.poll(() => current(page), { timeout: 6_000 }).toBeGreaterThanOrEqual(2);
  await page.locator('.floor-btn[data-go="5"]').click();
  await expect.poll(() => current(page)).toBe(5);
  await page.waitForTimeout(3_500);
  expect(await current(page)).toBe(5);
});

test('reduced motion: no pinning or riding, the panel still switches floors', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await stage(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(3_000);
  expect(await current(page)).toBe(1);
  expect(await page.locator('.pin-spacer').count()).toBe(0);
  await expect(page.locator('.floor[data-floor="2"]')).toBeHidden();
  await page.locator('.floor-btn[data-go="3"]').click();
  await expect(page.locator('.floor[data-floor="3"]')).toBeVisible();
  await expect(page.locator('.floor[data-floor="1"]')).toBeHidden();
});

test('without the animation libraries the panel still switches floors', async ({ page }) => {
  await page.route('**/assets/vendor/**', (route) => route.abort());
  await page.goto('/');
  await stage(page).scrollIntoViewIfNeeded();
  await page.locator('.floor-btn[data-go="9"]').click();
  await expect(page.locator('.floor[data-floor="9"]')).toBeVisible();
  await expect(page.locator('.floor[data-floor="1"]')).toBeHidden();
});
