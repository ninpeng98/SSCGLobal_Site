// 정책·404 페이지 시작점: 메뉴, 404 의 걸린 릴 흔들림.
import { initNav } from './nav.js';
import { prefersReducedMotion } from './motion.js';

initNav();

const jam = document.querySelector('[data-jam]');
if (jam && window.gsap && !prefersReducedMotion()) {
  window.gsap.timeline({ repeat: -1, repeatDelay: 2.2 })
    .to(jam, { yPercent: -8, duration: 0.08, ease: 'power1.inOut', yoyo: true, repeat: 5 })
    .to(jam, { rotate: -4, duration: 0.12, ease: 'power2.out' })
    .to(jam, { rotate: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
}
