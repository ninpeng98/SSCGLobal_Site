import { test, expect } from './fixtures.mjs';

const hiddenRevealCount = (page) => page.locator('[data-reveal]')
  .evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);

// 보이는 카드마다 [가운데로부터의 가로 거리, 회전 sin, 회전 cos, 깊이]를 읽는다(DOMMatrix: m31 = sinθ, m33 = cosθ, m43 = z)
const ringCards = (page) => page.locator('[data-slots] .swiper-slide').evaluateAll((slides) => {
  const box = document.querySelector('[data-slots]').getBoundingClientRect();
  const mid = box.left + box.width / 2;
  return slides
    .filter((s) => Number(getComputedStyle(s).opacity) > 0.01 && getComputedStyle(s).visibility !== 'hidden')
    .map((s) => {
      const m = new DOMMatrix(getComputedStyle(s).transform);
      const r = s.getBoundingClientRect();
      return { dx: r.left + r.width / 2 - mid, sin: m.m31, cos: m.m33, z: m.m43, active: s.classList.contains('swiper-slide-active') };
    });
});

test('slot carousel is a convex ring: centre card nearest, side cards turn outward, both sides balanced', async ({ page, problems }) => {
  await page.goto('/#slots');
  const carousel = page.locator('[data-slots]');
  await expect(carousel).toHaveClass(/is-ring/);
  await page.waitForTimeout(800);
  const cards = await ringCards(page);
  const left = cards.filter((c) => c.dx < -5);
  const right = cards.filter((c) => c.dx > 5);
  expect(left.length).toBe(right.length);
  expect(left.length).toBeGreaterThanOrEqual(1);
  const active = cards.find((c) => c.active);
  expect(Math.abs(active.dx)).toBeLessThan(2);
  for (const c of cards) {
    expect(c.cos, 'never shows a card from behind').toBeGreaterThan(0);
    expect(c.z).toBeLessThanOrEqual(active.z + 0.5);
  }
  for (const c of left) expect(c.sin, 'left cards face left-front').toBeLessThan(0);
  for (const c of right) expect(c.sin, 'right cards face right-front').toBeGreaterThan(0);
  expect(problems).toEqual([]);
});

test('the ring stays centred and balanced on a very wide screen', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'wide screen check');
  await page.setViewportSize({ width: 2000, height: 1000 });
  await page.goto('/#slots');
  await expect(page.locator('[data-slots]')).toHaveClass(/is-ring/);
  await page.waitForTimeout(800);
  const cards = await ringCards(page);
  const lefts = cards.filter((c) => c.dx < -5).map((c) => -c.dx).sort((a, b) => a - b);
  const rights = cards.filter((c) => c.dx > 5).map((c) => c.dx).sort((a, b) => a - b);
  expect(lefts.length).toBe(rights.length);
  lefts.forEach((d, i) => expect(Math.abs(d - rights[i])).toBeLessThan(3));
});

test('the next button turns the ring', async ({ page }) => {
  await page.goto('/#slots');
  const carousel = page.locator('[data-slots]');
  await expect(carousel).toHaveClass(/swiper-initialized/);
  const active = () => carousel.locator('.swiper-slide-active').getAttribute('data-swiper-slide-index');
  const before = await active();
  await page.locator('.slots__next').click();
  await expect.poll(active).not.toBe(before);
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

test('Collect Bonus shows the button, then the chips landing right away, every 2 hours', async ({ page }) => {
  await page.goto('/');
  const collect = page.locator('[data-collect]');
  await collect.scrollIntoViewIfNeeded();
  await expect(page.locator('#bonus-title')).toHaveText('Bonus Chips Every 2 Hours');
  await expect(collect).toHaveAttribute('data-state', 'ready');
  await expect(collect).toHaveAttribute('data-state', 'paid', { timeout: 5_000 });
  await expect(collect).toHaveAttribute('data-state', 'ready', { timeout: 6_000 });
  await expect(page.locator('#bonus')).not.toContainText(/wheel spin|spin the wheel|roulette/i);
});

test('the Collect Bonus loop plays a few times, then rests on the paid frame', async ({ page }, info) => {
  // 가짜 시계로 17초를 돌리면 화면 연출 프레임이 모두 실행돼 느리다. 반복 횟수 논리는 화면 크기와 무관해 한 번만 본다
  test.skip(info.project.name !== 'desktop', 'one run is enough');
  await page.clock.install();
  await page.goto('/');
  const collect = page.locator('[data-collect]');
  await collect.scrollIntoViewIfNeeded();
  await expect(collect).toHaveAttribute('data-state', 'ready');
  // 한 바퀴 5.25초 × 3 = 15.75초 뒤에는 받은 순간 그림에 멈춰 있어야 한다
  await page.clock.runFor(17_000);
  await expect(collect).toHaveAttribute('data-state', 'paid');
  await page.clock.runFor(6_000);
  await expect(collect).toHaveAttribute('data-state', 'paid');
});

test('section titles are split into gold words and keep their label', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#slots-title .gw').first()).toHaveText('45+');
  await expect(page.locator('#slots-title')).toHaveAttribute('aria-label', '45+ Unique 3D Slots');
});

test('gold titles paint champagne gold down to the g and y tails, with no brown outline', async ({ page }) => {
  await page.goto('/');
  const words = page.locator('#social-title .gw');
  await expect(words.first()).toBeVisible();
  const styles = await words.evaluateAll((els) => els.map((el) => {
    const cs = getComputedStyle(el);
    const em = parseFloat(cs.fontSize);
    return {
      text: el.textContent,
      clip: cs.webkitBackgroundClip || cs.backgroundClip,
      color: cs.color,
      stroke: parseFloat(cs.webkitTextStrokeWidth) || 0,
      // 칠하는 상자가 글자 꼬리(g·y)까지 내려가도록 아래 여백을 넓히고 같은 만큼 자리를 되돌린다
      padBottom: parseFloat(cs.paddingBottom) / em,
      marginBottom: parseFloat(cs.marginBottom) / em,
      after: getComputedStyle(el, '::after').content,
    };
  }));
  for (const s of styles) {
    expect(s.clip, s.text).toBe('text');
    expect(s.color, s.text).toBe('rgba(0, 0, 0, 0)');
    expect(s.stroke, s.text).toBe(0);
    expect(s.padBottom, s.text).toBeGreaterThanOrEqual(0.2);
    expect(s.marginBottom, s.text).toBeCloseTo(-s.padBottom, 3);
    expect(s.after, s.text).toBe('none');
  }
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
  await expect(page.locator('[data-collect]')).toHaveAttribute('data-state', 'paid');
  expect(await page.locator('[data-slots]').evaluate((el) => el.swiper?.autoplay?.running ?? false)).toBe(false);
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  expect(await hiddenRevealCount(page)).toBe(0);
});

test('content stays readable when the animation libraries fail to load', async ({ page }) => {
  await page.route('**/assets/vendor/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('[data-collect] img').first()).toBeVisible();
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
  await expect.poll(() => page.locator('#floors [data-reveal]').evaluateAll((els) => els.length > 0 && els.every((e) => getComputedStyle(e).opacity === '1')),
    { timeout: 3_000 }).toBe(true);
});

test('with only the animation scripts blocked, every slot card can still be scrolled into view', async ({ page }) => {
  await page.route('**/assets/vendor/**/*.js', (route) => route.abort());
  await page.goto('/#slots');
  await expect(page.locator('.slots__nav')).toBeHidden();
  const last = page.locator('.slot-card').last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
});
