// 메인 페이지 시작점: 메뉴, 부드러운 스크롤, 첫 화면 연출(반짝이·배경 패럴랙스), 데일리 잭팟 기계, 섹션 연출.
import { prefersReducedMotion, CONFETTI_COLORS } from './motion.js?v=90a53229';
import { initNav } from './nav.js?v=7afb179e';
import { createParticles } from './particles.js?v=ed1d69f2';
import { initSections } from './sections.js?v=20922526';
import { initDailyJackpot } from './jackpot.js?v=65d1e2e1';

const reduced = prefersReducedMotion();
const { gsap, ScrollTrigger, SplitText } = window;

if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger, ...(SplitText ? [SplitText] : []));
initNav();
initSmoothScroll();
initHero();
initJackpot();
document.fonts.ready.then(() => initSections(document, { reduced }));

function initSmoothScroll() {
  if (reduced || !window.Lenis || !gsap || !ScrollTrigger) return;
  const lenis = new window.Lenis({ autoRaf: false, anchors: { offset: -80 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis; // 층 섹션의 층 버튼이 스크롤 위치를 옮길 때 쓴다
}

// 첫 화면은 키 아트를 그대로 보여 준다. 문구·배지에는 등장 연출을 넣지 않는다
// (느린 기기에서 모듈이 늦게 돌면 이미 보인 설치 배지를 다시 숨겼다 보이게 된다)
function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const canvas = hero.querySelector('[data-particles]');
  if (canvas) createParticles(canvas, { reduced }).start();
  if (reduced || !gsap || !ScrollTrigger) return;
  // 배경 패럴랙스: 스크롤하면 흐린 배경이 앞 그림보다 느리게 내려간다
  const scrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero__backdrop img', { yPercent: 12, ease: 'none', scrollTrigger: scrub });
  gsap.to('.hero__stage', { yPercent: 6, ease: 'none', scrollTrigger: { ...scrub } });
}

// 데일리 잭팟: 당첨되면 릴 창에서 코인이 터지고, 잭팟(체리 제외)이면 색종이도 쏜다
const BURST = { grand: 48, major: 38, minor: 28, mini: 22, cherry: 12 };
function initJackpot() {
  const section = document.querySelector('[data-daily]');
  if (!section) return;
  const fxCanvas = section.querySelector('[data-jackpot-fx]');
  const coinSheet = new Image();
  coinSheet.src = 'assets/img/icons/coin-sheet.webp';
  const particles = fxCanvas ? createParticles(fxCanvas, { coinSheet, reduced, sparkles: false }) : null;
  const confettiCanvas = section.querySelector('[data-jackpot-confetti]');
  // useWorker:false — Worker(blob:)를 만들지 않아 CSP 를 넓히지 않는다
  const shoot = !reduced && window.confetti && confettiCanvas
    ? window.confetti.create(confettiCanvas, { resize: true, useWorker: false })
    : null;
  initDailyJackpot(section, {
    reduced,
    onWin(tier, rect) {
      const box = section.getBoundingClientRect();
      const cx = rect.left + rect.width / 2 - box.left;
      const cy = rect.top + rect.height / 2 - box.top;
      particles?.burst(cx, cy, BURST[tier]);
      if (!shoot || tier === 'cherry') return;
      const origin = { x: cx / box.width, y: (rect.top - box.top) / box.height };
      const base = { particleCount: tier === 'grand' ? 90 : 50, spread: 75, startVelocity: 42, colors: CONFETTI_COLORS, scalar: 0.9, ticks: 220 };
      shoot({ ...base, angle: 115, origin: { x: origin.x - 0.12, y: origin.y } });
      shoot({ ...base, angle: 65, origin: { x: origin.x + 0.12, y: origin.y } });
    },
  });
}

// 페이지 로드가 끝나면 꾸밈용 바탕 그림(빛 물결)을 받는다(base.css 의 .is-loaded)
const markLoaded = () => document.documentElement.classList.add('is-loaded');
if (document.readyState === 'complete') markLoaded(); else window.addEventListener('load', markLoaded, { once: true });
