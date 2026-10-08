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
