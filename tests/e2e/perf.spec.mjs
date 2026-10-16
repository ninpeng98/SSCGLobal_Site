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

test('layout shift stays under 0.1 while the page settles', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  const cls = await page.evaluate(() => new Promise((resolve) => {
    let total = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) total += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve(total), 300);
  }));
  expect(cls).toBeLessThan(0.1);
});

test('hero badge never fades out again after it first appears on a slow phone', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile only');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.__actionsOpacity = [];
    const tick = () => {
      const el = document.querySelector('.hero__actions');
      if (el) window.__actionsOpacity.push(Number(getComputedStyle(el).opacity));
      if (performance.now() < 6000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForFunction(() => performance.now() > 6000, null, { timeout: 20_000 });
  const samples = await page.evaluate(() => window.__actionsOpacity);
  const firstVisible = samples.findIndex((o) => o === 1);
  expect(firstVisible).toBeGreaterThanOrEqual(0);
  expect(Math.min(...samples.slice(firstVisible))).toBe(1);
});

// 휠로 층 섹션의 고정 스크롤 구간을 지나가는 동안 쌓인 CLS
test('scrolling through the pinned floors does not shift the layout', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'pinned floors are desktop-only');
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  const start = await page.evaluate(() => window.__cls);
  for (let i = 0; i < 40; i += 1) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__cls) - start).toBeLessThan(0.1);
});

// 층보다 아래(#faq)로 바로 열거나 그 위치에서 새로고침할 때
test('opening the page below the floors does not shift the layout', async ({ page }) => {
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/#faq');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.1);
});
