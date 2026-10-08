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

test('grand jackpot counter rolls up to its start value and keeps growing', async ({ page }) => {
  await page.goto('/');
  const odo = page.locator('[data-odometer]');
  await odo.scrollIntoViewIfNeeded();
  const value = async () => Number(await odo.getAttribute('data-value'));
  await expect.poll(value, { timeout: 5_000 }).toBeGreaterThanOrEqual(2847300150);
  const first = await value();
  await expect.poll(value, { timeout: 6_000 }).toBeGreaterThan(first);
  await expect(odo).toHaveAttribute('aria-label', 'Grand jackpot counter in virtual chips');
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

test('jumping straight past blocks (anchor jump, restored scroll) still shows them', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'pinned floors are desktop-only');
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const floors = document.getElementById('floors');
    window.scrollTo({ top: floors.getBoundingClientRect().top + window.scrollY + 500, behavior: 'instant' });
  });
  await expect.poll(() => page.locator('#floors [data-reveal]').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity)),
    { timeout: 3_000 }).toEqual(['1', '1']);
});
