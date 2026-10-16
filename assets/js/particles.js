// canvas 연출: 떠오르는 반짝이(최대 40개, 첫 화면)와 터지는 코인(최대 60개, 데일리 잭팟).
// 화면 밖이거나 탭이 숨겨지면 그리기를 멈춘다. 동작 줄이기면 아무것도 그리지 않는다.
import { makeSparkle, stepSparkle, sparkleAlpha, makeCoin, stepCoin, coinFrame, isCoinGone } from './lib/particles.js?v=2aeb5867';

const MAX_SPARKLES = 40;
const MAX_COINS = 60;
const CELL = 64;
const COLS = 5;

export function createParticles(canvas, { coinSheet, reduced = false, sparkles: withSparkles = true, rng = Math.random } = {}) {
  const ctx = canvas.getContext('2d');
  const sparkles = [];
  const coins = [];
  let w = 0;
  let h = 0;
  let raf = 0;
  let last = 0;
  let visible = true;
  let running = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    sparkles.length = 0;
    if (!withSparkles) return;
    const n = Math.min(MAX_SPARKLES, Math.round(w / 36));
    for (let i = 0; i < n; i += 1) sparkles.push(makeSparkle(rng, w, h));
  }

  function drawSparkle(p) {
    const r = p.r * 2.4;
    ctx.globalAlpha = sparkleAlpha(p);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - r);
    ctx.quadraticCurveTo(p.x, p.y, p.x + r, p.y);
    ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + r);
    ctx.quadraticCurveTo(p.x, p.y, p.x - r, p.y);
    ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - r);
    ctx.fill();
  }

  function drawCoin(c) {
    const f = coinFrame(c);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.drawImage(coinSheet, (f % COLS) * CELL, Math.floor(f / COLS) * CELL, CELL, CELL, -c.size / 2, -c.size / 2, c.size, c.size);
    ctx.restore();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, w, h);
    for (const p of sparkles) drawSparkle(stepSparkle(p, dt, w, h, rng));
    for (let i = coins.length - 1; i >= 0; i -= 1) {
      const c = stepCoin(coins[i], dt);
      if (isCoinGone(c, h)) coins.splice(i, 1);
      else if (coinSheet?.complete && coinSheet.naturalWidth) drawCoin(c);
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (reduced || running || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
    canvas.dataset.state = 'running';
  }

  function stop() {
    if (reduced) return;
    running = false;
    cancelAnimationFrame(raf);
    canvas.dataset.state = 'stopped';
  }

  function burst(x, y, count = 36) {
    if (reduced) return;
    for (let i = 0; i < count && coins.length < MAX_COINS; i += 1) coins.push(makeCoin(rng, x, y));
  }

  if (reduced) {
    canvas.dataset.state = 'static';
    return { start() {}, stop() {}, burst() {}, destroy() {} };
  }

  resize();
  seed();
  const ro = new ResizeObserver(() => { resize(); seed(); });
  ro.observe(canvas);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start(); else stop();
  });
  io.observe(canvas);
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);

  return {
    start,
    stop,
    burst,
    destroy() {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
