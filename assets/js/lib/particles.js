// 첫 화면 코인·반짝이 입자의 계산(DOM·canvas 없음). particles.js 가 그린다.
export const GRAVITY = 1400;   // px/s²
export const COIN_FRAMES = 10; // coin-sheet.webp: 5열 × 2행, 칸 64px
export const COIN_FPS = 14;    // 클라이언트 대기 표시와 같은 속도

export function makeSparkle(rng, w, h) {
  return {
    x: rng() * w,
    y: h * (0.3 + rng() * 0.7),
    r: 1.2 + rng() * 2.6,
    vy: -(8 + rng() * 22),
    phase: rng() * Math.PI * 2,
    speed: 1.5 + rng() * 2.5,
  };
}

export function stepSparkle(p, dt, w, h, rng) {
  p.y += p.vy * dt;
  p.phase += p.speed * dt;
  if (p.y < -10) Object.assign(p, makeSparkle(rng, w, h), { y: h + 10 });
  return p;
}

export function sparkleAlpha(p) {
  return 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(p.phase));
}

export function makeCoin(rng, x, y) {
  const angle = -Math.PI / 2 + (rng() - 0.5) * 1.6;
  const speed = 520 + rng() * 520;
  return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 26 + rng() * 20, t: rng() * 0.7, rot: (rng() - 0.5) * 0.6 };
}

export function stepCoin(c, dt) {
  c.vy += GRAVITY * dt;
  c.x += c.vx * dt;
  c.y += c.vy * dt;
  c.t += dt;
  return c;
}

export function coinFrame(c) {
  return Math.floor(c.t * COIN_FPS) % COIN_FRAMES;
}

export function isCoinGone(c, h) {
  return c.vy > 0 && c.y - c.size > h;
}
