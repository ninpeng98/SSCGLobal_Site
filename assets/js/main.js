// 메인 페이지 시작점: 메뉴, 첫 화면 연출(릴·코인·색종이).
import { prefersReducedMotion, CONFETTI_COLORS } from './motion.js';
import { initNav } from './nav.js';
import { createParticles } from './particles.js';
import { initHeroReels } from './hero-reels.js';

const reduced = prefersReducedMotion();
const { gsap } = window;

initNav();
const fx = initHeroFx();
initHero();

function initHeroFx() {
  const canvas = document.querySelector('[data-particles]');
  if (!canvas) return null;
  const coinSheet = new Image();
  coinSheet.src = 'assets/img/icons/coin-sheet.webp';
  const particles = createParticles(canvas, { coinSheet, reduced });
  particles.start();
  const confettiCanvas = document.querySelector('[data-confetti]');
  // useWorker:false — Worker(blob:)를 만들지 않아 CSP 를 넓히지 않는다
  const shoot = !reduced && window.confetti && confettiCanvas
    ? window.confetti.create(confettiCanvas, { resize: true, useWorker: false })
    : null;
  return { canvas, particles, shoot };
}

function celebrate(reelsRect) {
  if (!fx) return;
  const box = fx.canvas.getBoundingClientRect();
  const cx = reelsRect.left + reelsRect.width / 2 - box.left;
  const cy = reelsRect.top + reelsRect.height * 0.4 - box.top;
  fx.particles.burst(cx, cy, 36);
  if (fx.shoot) {
    const origin = { x: cx / box.width, y: (reelsRect.top - box.top) / box.height };
    const base = { particleCount: 70, spread: 75, startVelocity: 42, colors: CONFETTI_COLORS, scalar: 0.9, ticks: 220 };
    fx.shoot({ ...base, angle: 115, origin: { x: origin.x - 0.12, y: origin.y } });
    fx.shoot({ ...base, angle: 65, origin: { x: origin.x + 0.12, y: origin.y } });
  }
  document.querySelectorAll('[data-play-badge]').forEach((badge) => {
    badge.classList.remove('is-celebrating');
    void badge.offsetWidth; // 빛 애니메이션을 처음부터 다시
    badge.classList.add('is-celebrating');
  });
}

async function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const reels = initHeroReels(hero, { reduced, onLand: (_, rect) => celebrate(rect) });
  if (!reels) return;
  hero.classList.add('is-interactive');
  // LCP(키 아트)를 늦추지 않도록 그림은 투명도를 건드리지 않고 크기만 살짝
  gsap.from('.hero__stage', { scale: 1.04, duration: 0.9, ease: 'power2.out' });
  gsap.from('.hero__copy > *', { y: 18, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08, delay: 0.15 });
  await Promise.all([waitForImage(hero.querySelector('.hero__art')), reels.ready]);
  gsap.delayedCall(0.5, () => reels.spin('seven'));
}

function waitForImage(img) {
  if (!img) return Promise.resolve();
  if (img.complete) return img.decode().catch(() => {});
  return new Promise((resolve) => {
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  });
}
