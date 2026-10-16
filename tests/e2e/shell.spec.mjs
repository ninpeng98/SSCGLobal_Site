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

test('customer support goes to the CS address on every page', async ({ page }) => {
  for (const path of ['/', '/privacy-policy.html', '/terms-of-service.html']) {
    await page.goto(path);
    await expect(page.locator('footer a', { hasText: 'Support' }), path).toHaveAttribute('href', 'mailto:vglobalcs24@gmail.com');
  }
  await page.goto('/');
  await expect(page.locator('.faq__answer a[href^="mailto:"]')).toHaveAttribute('href', 'mailto:vglobalcs24@gmail.com');
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(JSON.stringify(data)).toContain('vglobalcs24@gmail.com');
});

test('FAQ structured data repeats the visible questions and answers word for word', async ({ page }) => {
  await page.goto('/');
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  const faq = data.find((d) => d['@type'] === 'FAQPage');
  const visible = await page.locator('.faq__item').evaluateAll((items) => items.map((d) => ({
    q: d.querySelector('summary').textContent.trim(),
    a: d.querySelector('.faq__answer').textContent.trim(),
  })));
  expect(visible.length).toBeGreaterThan(0);
  expect(faq.mainEntity.map((e) => ({ q: e.name, a: e.acceptedAnswer.text }))).toEqual(visible);
});

test('llms.txt sums up the site for AI tools and every site link in it works', async ({ request }) => {
  const res = await request.get('/llms.txt');
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text.split('\n')[0]).toBe('# Golden Hour – Slots Casino');
  expect(text).toContain('https://play.google.com/store/apps/details?id=site.vglobal.android.casinog');
  const links = [...text.matchAll(/\]\((https:\/\/sscgl\.vglobal\.site\/[^)]*)\)/g)].map((m) => m[1]);
  expect(links.length).toBeGreaterThan(2);
  for (const url of links) expect((await request.get(url.replace('https://sscgl.vglobal.site', ''))).status(), url).toBe(200);
});
