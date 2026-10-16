import { test, expect } from './fixtures.mjs';

const stage = (page) => page.locator('[data-elevator]');
const current = async (page) => Number(await stage(page).getAttribute('data-current'));
// 무대를 왼쪽으로 밀면 다음 층(오른쪽으로 밀면 이전 층)
async function swipe(page, dir = 'next') {
  const box = await stage(page).boundingBox();
  const y = box.y + box.height * 0.6;
  const [a, b] = dir === 'next' ? [0.75, 0.25] : [0.25, 0.75];
  await page.mouse.move(box.x + box.width * a, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * b, y, { steps: 6 });
  await page.mouse.up();
}

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

test('a short scroll is enough to go up a floor: about two floors per 120px of wheel', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'scroll-driven elevator is for large screens');
  await page.goto('/');
  await page.evaluate(() => window.scrollTo({ top: document.getElementById('floors').getBoundingClientRect().top + window.scrollY + 2, behavior: 'instant' }));
  await expect.poll(() => current(page)).toBe(1);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => current(page), { timeout: 2_000 }).toBeGreaterThanOrEqual(2);
  // 관성 스크롤이 멈춘 뒤 지금 층이 열린 상태(자물쇠 풀림·아이콘 등장 끝)가 된다
  await expect(page.locator('.floor.is-current')).toHaveClass(/is-open/, { timeout: 3_000 });
  for (let i = 0; i < 12 && (await current(page)) < 10; i += 1) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(60);
  }
  await expect.poll(() => current(page)).toBe(10);
  await expect(page.locator('.floor[data-floor="10"] .floor__name')).toHaveText(['Ranch Story', 'Pirate Ship', 'Gold Mine', 'Jewelry Fever']);
  await expect(page.locator('.floors__bg img[data-bg="4"]')).toHaveClass(/is-active/);
});

test('no floor buttons or lobby screenshot; dots show the current floor', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.floor-btn, .floors__panel, .floors__shot')).toHaveCount(0);
  await expect(page.locator('.floors__dots li')).toHaveCount(10);
  await expect(page.locator('.floors__dots li.is-current')).toHaveAttribute('data-dot', '1');
});

test('swiping the stage or pressing arrow keys changes floors and the lobby background', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop', 'large screens change floors by scrolling');
  await page.goto('/');
  await stage(page).scrollIntoViewIfNeeded();
  await swipe(page, 'next');
  await expect.poll(() => current(page)).toBe(2);
  await swipe(page, 'prev');
  await expect.poll(() => current(page)).toBe(1);
  await stage(page).focus();
  for (let i = 0; i < 6; i += 1) await page.keyboard.press('ArrowRight');
  await expect.poll(() => current(page)).toBe(7);
  await expect(page.locator('.floor[data-floor="7"]')).toBeVisible();
  await expect(page.locator('.floor[data-floor="7"] .floor__req')).toHaveText('Unlocks at 500M chips');
  await expect(page.locator('.floors__bg img[data-bg="3"]')).toHaveClass(/is-active/);
  await expect(page.locator('.floors__dots li.is-current')).toHaveAttribute('data-dot', '7');
});

test('on phones the elevator rides up by itself while in view, and stops once you touch it', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop', 'auto ride is for touch layouts');
  await page.goto('/');
  await stage(page).scrollIntoViewIfNeeded();
  await expect.poll(() => current(page), { timeout: 6_000 }).toBeGreaterThanOrEqual(2);
  await swipe(page, 'next');
  const at = await current(page);
  await page.waitForTimeout(3_500);
  expect(await current(page)).toBe(at);
});

test('reduced motion: no riding, swipe and keys still switch floors', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop', 'large screens change floors by scrolling');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await stage(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(3_000);
  expect(await current(page)).toBe(1);
  await expect(page.locator('.floor[data-floor="2"]')).toBeHidden();
  await swipe(page, 'next');
  await expect(page.locator('.floor[data-floor="2"]')).toBeVisible();
  await expect(page.locator('.floor[data-floor="1"]')).toBeHidden();
});

test('without the animation libraries, keys still switch floors', async ({ page }) => {
  await page.route('**/assets/vendor/**', (route) => route.abort());
  await page.goto('/');
  await stage(page).scrollIntoViewIfNeeded();
  await stage(page).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.floor[data-floor="3"]')).toBeVisible();
  await expect(page.locator('.floor[data-floor="1"]')).toBeHidden();
});
