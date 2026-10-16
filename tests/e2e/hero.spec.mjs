import { test, expect } from './fixtures.mjs';

test('hero shows the key art as is, with no reels laid over it and no spin button', async ({ page, problems }) => {
  await page.goto('/');
  await expect(page.locator('.hero__art')).toBeVisible();
  await expect(page.locator('.hero [data-reels]')).toHaveCount(0);
  await expect(page.locator('.hero [data-spin]')).toHaveCount(0);
  await page.waitForTimeout(1500);
  expect(problems).toEqual([]);
});

test('particles run in the hero and stop once it scrolls away', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('.hero [data-particles]');
  await expect(canvas).toHaveAttribute('data-state', 'running');
  await page.locator('#faq').scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute('data-state', 'stopped');
});

test('reduced motion keeps the hero still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.hero [data-particles]')).toHaveAttribute('data-state', 'static');
});

test('orientation switch swaps the wide and square key art', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'one run is enough');
  await page.goto('/');
  const src = () => page.evaluate(() => document.querySelector('.hero__art').currentSrc);
  expect(await src()).toContain('splash-wide');
  await page.setViewportSize({ width: 700, height: 1000 });
  await expect.poll(src).toContain('keyart-square');
});

test('the 18+ mark is a quiet small label, not a gold badge', async ({ page }) => {
  await page.goto('/');
  const mark = page.locator('.hero__legal .age-mark');
  await expect(mark).toHaveText('18+');
  const style = await mark.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { size: parseFloat(cs.fontSize), bg: cs.backgroundImage, shadow: cs.boxShadow };
  });
  expect(style.size).toBeLessThanOrEqual(13);
  expect(style.bg).toBe('none');
  expect(style.shadow).toBe('none');
  await expect(page.locator('.hero .pill--age')).toHaveCount(0);
});
