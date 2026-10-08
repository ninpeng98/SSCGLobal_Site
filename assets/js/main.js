// 메인 페이지 시작점: 메뉴, 부드러운 스크롤, 첫 화면 연출(릴·코인·색종이·배경 패럴랙스), 섹션 연출.
import { prefersReducedMotion, CONFETTI_COLORS } from './motion.js';
import { initNav } from './nav.js';
import { createParticles } from './particles.js';
import { initHeroReels } from './hero-reels.js';
import { initSections } from './sections.js';

const reduced = prefersReducedMotion();
const { gsap, ScrollTrigger, SplitText } = window;

if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger, ...(SplitText ? [SplitText] : []));
initNav();
initSmoothScroll();
const fx = initHeroFx();
initHero();
document.fonts.ready.then(() => initSections(document, { reduced }));

function initSmoothScroll() {
  if (reduced || !window.Lenis || !gsap || !ScrollTrigger) return;
  const lenis = new window.Lenis({ autoRaf: false, anchors: { offset: -80 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

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
  // 첫 화면 문구·그림에는 등장 연출을 넣지 않는다 — 느린 기기에서 모듈이 늦게 돌면, 이미 보인 설치 배지를 다시 숨겼다 보이게 된다
  if (ScrollTrigger) {
    // 배경 패럴랙스: 스크롤하면 흐린 배경이 앞 그림보다 느리게 내려간다
    const scrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero__backdrop img', { yPercent: 12, ease: 'none', scrollTrigger: scrub });
    gsap.to('.hero__stage', { yPercent: 6, ease: 'none', scrollTrigger: { ...scrub } });
  }
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
