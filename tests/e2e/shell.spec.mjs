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
    await expect(footer.locator('.age-mark')).toHaveText('18+');
    await expect(footer).toContainText('no cash value');
    await expect(footer).toContainText('© 2026 Vglobal Co., Ltd.');
  });

  test('every play badge links to the store, opens safely and is tracked', async ({ page }) => {
    await page.goto('/');
    const badges = await page.locator('a.play-badge').all();
    expect(badges.length).toBeGreaterThan(0);
    for (const a of badges) {
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
