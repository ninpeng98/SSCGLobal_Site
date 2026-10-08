import { test, expect } from './fixtures.mjs';

for (const [path, h1] of [['/privacy-policy.html', 'Privacy Policy'], ['/terms-of-service.html', 'Terms of Service'], ['/delete-account.html', 'Delete Your Golden Hour Account']]) {
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

// Google Play 계정 삭제 요청 페이지: 스토어와 같은 앱·개발사 이름, 눈에 띄는 요청 단계, 지우는/남기는 데이터와 기간
test('account deletion page names the app and developer and shows how to request deletion', async ({ page }) => {
  await page.goto('/delete-account.html');
  const main = page.locator('main');
  await expect(main).toContainText('Golden Hour – Slots Casino');
  await expect(main).toContainText('Vglobal Co., Ltd.');
  // 새 앱(auth v2) 기준: 앱 안 [Delete account] 와 이메일 요청 두 길. 손님도 MEMBER ID 가 있다
  const inApp = main.locator('#in-app + ol.delete-steps > li');
  await expect(inApp).toHaveCount(3);
  await expect(inApp.nth(0)).toContainText('Settings');
  await expect(inApp.nth(1)).toContainText('Delete account');
  await expect(inApp.nth(2)).toContainText('waiting period');
  const byEmail = main.locator('#by-email + ol.delete-steps > li');
  await expect(byEmail).toHaveCount(3);
  await expect(byEmail.nth(0)).toContainText('MEMBER ID');
  await expect(byEmail.nth(0)).toContainText('Guest accounts have one too');
  await expect(byEmail.nth(2)).toContainText('within 30 days');
  const request = main.locator('a.btn[href^="mailto:"]');
  await expect(request).toBeVisible();
  const lines = await request.evaluate((a) => { const r = document.createRange(); r.selectNodeContents(a); return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size; });
  expect(lines, 'button label stays on one line').toBe(1);
  const href = await request.getAttribute('href');
  expect(href.startsWith('mailto:vglobalcs24@gmail.com?subject=')).toBe(true);
  expect(decodeURIComponent(href)).toContain('Account deletion request');
  expect(decodeURIComponent(href)).toContain('MEMBER ID:');
  await expect(main.locator('#what-we-delete + ul')).toContainText('virtual chips');
  await expect(main.locator('#what-we-keep + ul')).toContainText('as long as the law requires');
  await expect(main.locator('#what-we-delete + ul')).toContainText('Google account');
  await expect(main.locator('#guests')).toHaveCount(0);
  await expect(main).not.toContainText('REGISTER');
  await expect(main).toContainText('Uninstalling the app does not delete your account');
});

test('every page links to the account deletion page from the footer, the FAQ and the sitemap', async ({ page, request }) => {
  for (const path of ['/', '/privacy-policy.html', '/terms-of-service.html', '/delete-account.html']) {
    await page.goto(path);
    const link = page.locator('footer a', { hasText: 'Delete Account' });
    await expect(link, path).toHaveAttribute('href', /(^|\/)delete-account\.html$/);
  }
  await page.goto('/privacy-policy.html');
  await expect(page.locator('main a[href="delete-account.html"]')).toHaveCount(1);
  await page.goto('/');
  await expect(page.locator('.faq__answer a[href="delete-account.html"]')).toHaveCount(1);
  await expect(page.locator('.faq__answer', { hasText: 'Delete account' })).toHaveCount(1);
  expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>https://sscgl.vglobal.site/delete-account.html</loc>');
  expect(await (await request.get('/llms.txt')).text()).toContain('(https://sscgl.vglobal.site/delete-account.html)');
});
