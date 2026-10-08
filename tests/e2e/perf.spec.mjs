import { test, expect } from './fixtures.mjs';

// 느린 4G(1.6Mbps, 지연 150ms)와 CPU 4배 감속에서 LCP 를 잰다. 로컬 서버는 압축을 안 하므로 실제보다 불리한 조건이다.
test('LCP stays under 2.5s on a throttled phone', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile only');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('/', { waitUntil: 'load' });
  const lcp = await page.evaluate(() => new Promise((resolve) => {
    new PerformanceObserver((list) => resolve(list.getEntries().at(-1).startTime))
      .observe({ type: 'largest-contentful-paint', buffered: true });
  }));
  console.log(`LCP ${Math.round(lcp)}ms`);
  expect(lcp).toBeLessThan(2500);
});

test('layout shift stays under 0.1 during the hero animation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-reels]')).toHaveAttribute('data-state', /landed|static/, { timeout: 10_000 });
  const cls = await page.evaluate(() => new Promise((resolve) => {
    let total = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) total += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve(total), 300);
  }));
  expect(cls).toBeLessThan(0.1);
});
