import { test, expect } from './fixtures.mjs';

for (const [path, h1] of [['/privacy-policy.html', 'Privacy Policy'], ['/terms-of-service.html', 'Terms of Service']]) {
  test(`${path} renders in the new frame without errors`, async ({ page, problems }) => {
    await page.goto(path);
    await expect(page.locator('main h1')).toHaveText(h1);
    await expect(page.locator('header.site-nav')).toHaveClass(/is-solid/);
    await expect(page.locator('footer.site-footer')).toContainText('no cash value');
    await expect(page.locator('body')).not.toContainText('Social Casino2');
    await page.waitForLoadState('networkidle');
    expect(problems).toEqual([]);
  });
}

test('404 page is noindex and links home', async ({ page, problems }) => {
  await page.goto('/404.html');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('h1')).toHaveText('This reel got stuck');
  await expect(page.locator('main a.btn')).toHaveAttribute('href', '/');
  await page.waitForLoadState('networkidle');
  expect(problems).toEqual([]);
});

test('404 assets load even from a nested missing path', async ({ page }) => {
  // GitHub Pages 는 /no/such/page 같은 경로에서도 404.html 을 그대로 보여 준다. 그 상황을 흉내 낸다.
  await page.route('**/no/such/page', (route) => route.fulfill({ path: '404.html', contentType: 'text/html' }));
  await page.goto('/no/such/page');
  const broken = await page.locator('img').evaluateAll((imgs) => imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src));
  expect(broken).toEqual([]);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(21, 8, 48)');
});
