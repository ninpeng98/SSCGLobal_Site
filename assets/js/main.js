// 메인 페이지 시작점: 메뉴, 부드러운 스크롤, 첫 화면 연출(반짝이·배경 패럴랙스), 섹션 연출.
import { prefersReducedMotion } from './motion.js';
import { initNav } from './nav.js';
import { createParticles } from './particles.js';
import { initSections } from './sections.js';

const reduced = prefersReducedMotion();
const { gsap, ScrollTrigger, SplitText } = window;

if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger, ...(SplitText ? [SplitText] : []));
initNav();
initSmoothScroll();
initHero();
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
