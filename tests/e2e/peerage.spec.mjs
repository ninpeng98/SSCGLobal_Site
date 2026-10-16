import { test, expect } from './fixtures.mjs';

const ladder = (page) => page.locator('#social .peerage__ladder');
const opacities = (page) => ladder(page).locator('li img').evaluateAll((imgs) => imgs.map((i) => Number(getComputedStyle(i).opacity)));

test('peerage shields wait below the fold, then rise one tier at a time when the ladder comes into view', async ({ page }) => {
  await page.goto('/');
  await expect(ladder(page)).toHaveClass(/is-armed/);
  expect(await opacities(page)).toEqual([0, 0, 0, 0, 0, 0]);
  await ladder(page).scrollIntoViewIfNeeded();
  await expect(ladder(page)).toHaveClass(/is-shown/);
  // Bronze 가 먼저, Diamond 가 마지막(단계마다 늦게 시작)
  const delays = await ladder(page).locator('li img').evaluateAll((imgs) => imgs.map((i) => parseFloat(getComputedStyle(i).animationDelay)));
  for (let i = 1; i < delays.length; i += 1) expect(delays[i]).toBeGreaterThan(delays[i - 1]);
  await expect.poll(() => opacities(page), { timeout: 4_000 }).toEqual([1, 1, 1, 1, 1, 1]);
});

test('each shield has a shine masked to its own shape and a tier-coloured burst', async ({ page }) => {
  await page.goto('/');
  const items = ladder(page).locator('li');
  await expect(items.locator('.peerage__shine')).toHaveCount(6);
  const pairs = await items.evaluateAll((lis) => lis.map((li) => [li.querySelector('img').getAttribute('src'), getComputedStyle(li.querySelector('.peerage__shine')).maskImage]));
  for (const [src, mask] of pairs) expect(mask).toContain(src);
  const glows = await items.evaluateAll((lis) => lis.map((li) => getComputedStyle(li).getPropertyValue('--tier-glow').trim()));
  expect(new Set(glows).size).toBe(6);
});

test('opening the page already scrolled to the rankings still shows every shield', async ({ page }) => {
  await page.goto('/#social');
  await ladder(page).scrollIntoViewIfNeeded();
  await expect.poll(() => opacities(page), { timeout: 4_000 }).toEqual([1, 1, 1, 1, 1, 1]);
});

test('reduced motion shows the shields still, with no rise or shine', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(ladder(page)).not.toHaveClass(/is-armed/);
  expect(await opacities(page)).toEqual([1, 1, 1, 1, 1, 1]);
  const anims = await ladder(page).locator('li img, .peerage__shine').evaluateAll((els) => els.map((e) => getComputedStyle(e).animationName));
  expect(anims.every((a) => a === 'none')).toBe(true);
});

test('the shields start rising only once the peerage panel itself has faded in', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const ladder = document.querySelector('.peerage__ladder');
    const block = ladder.closest('.peerage');
    new MutationObserver(() => {
      if (ladder.classList.contains('is-shown') && window.__panelOpacity === undefined) window.__panelOpacity = Number(getComputedStyle(block).opacity);
    }).observe(ladder, { attributes: true, attributeFilter: ['class'] });
    window.scrollTo(0, ladder.getBoundingClientRect().top + scrollY - innerHeight / 2);
  });
  await expect.poll(() => page.evaluate(() => window.__panelOpacity), { timeout: 5_000 }).toBeGreaterThan(0.95);
});
