import { test, expect } from './fixtures.mjs';

// 첫 화면 배경의 아래 끝과 다음 섹션이 같은 페이지 배경(오로라·점무늬)으로 이어져야 한다: 경계 바로 위·아래 띠의 평균 색 차이가 작다
async function bandDiff(page) {
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.classList.contains('is-loaded'));
  await page.waitForFunction(() => performance.getEntriesByType('resource').some((e) => /aurora-1-/.test(e.name) && e.responseEnd > 0));
  const bottom = await page.locator('.hero').evaluate((h) => { window.scrollTo(0, h.getBoundingClientRect().bottom + scrollY - innerHeight / 2); return h.getBoundingClientRect().bottom; });
  await page.waitForTimeout(500);
  const y = await page.locator('.hero').evaluate((h) => h.getBoundingClientRect().bottom);
  const width = page.viewportSize().width;
  const png = await page.screenshot({ clip: { x: 0, y: y - 16, width, height: 32 }, scale: 'css' });
  return page.evaluate(async ({ b64, width }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const mean = (y0) => {
      const d = ctx.getImageData(0, y0, c.width, 8).data;
      const s = [0, 0, 0];
      for (let i = 0; i < d.length; i += 4) { s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; }
      return s.map((v) => v / (d.length / 4));
    };
    const above = mean(4); const below = mean(20);
    return Math.max(...above.map((v, i) => Math.abs(v - below[i])));
  }, { b64: png.toString('base64'), width });
}

test('the hero fades into the page background with no visible seam', async ({ page }) => {
  const diff = await bandDiff(page);
  expect(diff).toBeLessThan(4);
});
