import { test, expect } from './fixtures.mjs';

const TIERS = { grand: 'spade', major: 'heart', minor: 'diamond', mini: 'clover', cherry: 'cherry' };
const machine = (page) => page.locator('[data-machine]');
const landed = (page) => expect(machine(page)).toHaveAttribute('data-state', 'landed', { timeout: 10_000 });

// 릴마다 창 가운데에 가장 가까운 칸의 심볼
const middleRow = (page) => page.locator('[data-machine] .machine__reel').evaluateAll((reels) => reels.map((reel) => {
  const box = reel.getBoundingClientRect();
  const mid = box.top + box.height / 2;
  let best = null;
  for (const cell of reel.querySelectorAll('.machine__cell')) {
    const r = cell.getBoundingClientRect();
    const d = Math.abs(r.top + r.height / 2 - mid);
    if (!best || d < best.d) best = { d, symbol: cell.dataset.symbol };
  }
  return best?.symbol;
}));

test('the Daily Jackpot machine spins once when it comes into view and lands on Grand', async ({ page, problems }) => {
  await page.goto('/');
  await expect(machine(page)).toHaveAttribute('data-state', 'idle');
  await machine(page).scrollIntoViewIfNeeded();
  await landed(page);
  await expect(machine(page)).toHaveAttribute('data-result', 'grand');
  await expect(machine(page)).toHaveAttribute('data-spins', '1');
  expect(await middleRow(page)).toEqual(['spade', 'spade', 'spade']);
  await expect(page.locator('.meter[data-tier="grand"]')).toHaveClass(/is-hit/);
  await expect(page.locator('[data-machine-result]')).toContainText('GRAND');
  expect(problems).toEqual([]);
});

test('pressing SPIN on the machine spins again and lines up one tier', async ({ page }) => {
  await page.goto('/');
  await machine(page).scrollIntoViewIfNeeded();
  await landed(page);
  const spin = page.locator('[data-machine-spin]');
  await expect(spin).toHaveAttribute('aria-disabled', 'false');
  await spin.click();
  await expect(machine(page)).toHaveAttribute('data-state', 'spinning');
  await expect(spin).toHaveAttribute('aria-disabled', 'true');
  await landed(page);
  const result = await machine(page).getAttribute('data-result');
  expect(Object.keys(TIERS)).toContain(result);
  expect(await middleRow(page)).toEqual(Array(3).fill(TIERS[result]));
  await expect(page.locator('.meter.is-hit')).toHaveCount(result === 'cherry' ? 0 : 1);
});

test('rapid presses never start overlapping spins', async ({ page }) => {
  await page.goto('/');
  await machine(page).scrollIntoViewIfNeeded();
  await landed(page);
  await page.evaluate(() => {
    const b = document.querySelector('[data-machine-spin]');
    b.click();
    b.disabled = false;
    b.click();
    b.click();
  });
  await landed(page);
  await expect(machine(page)).toHaveAttribute('data-spins', '2');
});

test('the machine is shown on its own: no frame, panel or glow box around it', async ({ page }) => {
  await page.goto('/');
  const look = await machine(page).evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundImage + cs.backgroundColor, border: cs.borderTopWidth, shadow: cs.boxShadow, src: el.querySelector('.machine__body').currentSrc || el.querySelector('.machine__body').src };
  });
  expect(look.bg).toBe('nonergba(0, 0, 0, 0)');
  expect(look.border).toBe('0px');
  expect(look.shadow).toBe('none');
  expect(look.src).toMatch(/assets\/img\/jackpot\/machine-(600|1200)\.webp$/);
});

test('reduced motion shows a still Grand line and no spin button', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await machine(page).scrollIntoViewIfNeeded();
  await expect(machine(page)).toHaveAttribute('data-state', 'static');
  expect(await middleRow(page)).toEqual(['spade', 'spade', 'spade']);
  await expect(page.locator('[data-machine-spin]')).toBeHidden();
});

test('Lucky Time section is about the regular slots only, not the Daily Jackpot machine', async ({ page }) => {
  await page.goto('/');
  const lucky = page.locator('#lucky-time');
  await expect(lucky).not.toContainText('Daily Jackpot');
  await expect(lucky.locator('img[src*="jackpot/"]')).toHaveCount(0);
  await expect(lucky.locator('[data-odometer]')).toHaveCount(1);
  await expect(page.locator('#daily-jackpot')).not.toContainText('Lucky Time');
});

test('SPIN by keyboard keeps focus on the button, and the result is announced', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'keyboard check on desktop');
  await page.goto('/');
  await machine(page).scrollIntoViewIfNeeded();
  await landed(page);
  const spin = page.locator('[data-machine-spin]');
  await spin.focus();
  await page.keyboard.press('Enter');
  await expect(machine(page)).toHaveAttribute('data-state', 'spinning');
  await expect(spin).toBeFocused();
  // 결과 안내 문단은 도는 동안에도 접근성 트리에 남아 있어야 내용이 바뀔 때 읽힌다
  expect(await page.locator('[data-machine-result]').evaluate((el) => getComputedStyle(el).display)).not.toBe('none');
  await landed(page);
  await expect(spin).toBeFocused();
  await expect(page.locator('[data-machine-result]')).not.toBeEmpty();
});

test('the first spin waits until the machine is actually on screen', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // 기계를 잠깐(50ms) 지나쳐 FAQ 로 바로 건너뛴다 — 브라우저 안에서 한 번에 해서 테스트 부하에 흔들리지 않게
  await page.evaluate(() => new Promise((resolve) => {
    document.querySelector('[data-machine]').scrollIntoView({ block: 'center', behavior: 'instant' });
    setTimeout(() => { document.getElementById('faq').scrollIntoView({ behavior: 'instant' }); resolve(); }, 50);
  }));
  await page.waitForTimeout(2_500);
  await expect(machine(page)).toHaveAttribute('data-state', 'idle');
  await machine(page).scrollIntoViewIfNeeded();
  await landed(page);
  await expect(machine(page)).toHaveAttribute('data-result', 'grand');
});

test('each tier meter shows its prize, rolling up to the amount when it comes into view', async ({ page }) => {
  await page.goto('/');
  await machine(page).scrollIntoViewIfNeeded();
  const prizes = page.locator('.meter .meter__prize');
  await expect(prizes).toHaveCount(4);
  await expect.poll(() => prizes.evaluateAll((els) => els.map((e) => e.textContent === Number(e.dataset.prize).toLocaleString('en-US'))),
    { timeout: 5_000 }).toEqual([true, true, true, true]);
  for (const p of await prizes.all()) await expect(p).toBeVisible();
});

test('the machine head chases its bulbs and sweeps a shine over JACKPOT; the meters breathe neon', async ({ page }) => {
  await page.goto('/');
  await machine(page).scrollIntoViewIfNeeded();
  const anim = (sel) => page.locator(sel).evaluateAll((els) => els.map((e) => getComputedStyle(e).animationName));
  expect(await anim('.machine__bulbs img')).toEqual(['bulb-chase', 'bulb-chase', 'bulb-chase']);
  expect((await anim('.machine__shine'))[0]).toBe('jackpot-shine');
  for (const name of await anim('.meter__neon')) expect(name).toContain('neon-breathe');
});

test('reduced motion keeps the bulbs, shine and neon still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const anim = (sel) => page.locator(sel).evaluateAll((els) => els.map((e) => getComputedStyle(e).animationName));
  for (const sel of ['.machine__bulbs img', '.machine__shine', '.meter__neon']) {
    for (const name of await anim(sel)) expect(name, sel).toBe('none');
  }
  await expect(page.locator('.meter .meter__prize').first()).toHaveText('1,200,000,000');
});

test('reel symbols keep the prototype spacing: 81 of every 90 in the column, never touching', async ({ page }) => {
  await page.goto('/');
  await machine(page).scrollIntoViewIfNeeded();
  const sizes = await page.locator('.machine__reel').first().evaluate((reel) => {
    const cell = reel.querySelector('.machine__cell').getBoundingClientRect();
    const img = reel.querySelector('.machine__cell img').getBoundingClientRect();
    return { cell: cell.height, img: img.height };
  });
  expect(sizes.img / sizes.cell).toBeCloseTo(0.9, 1);
});
