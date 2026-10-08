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
  await expect(spin).toBeEnabled();
  await spin.click();
  await expect(machine(page)).toHaveAttribute('data-state', 'spinning');
  await expect(spin).toBeDisabled();
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
