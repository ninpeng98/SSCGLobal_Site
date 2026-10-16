// 연출 공용 값. 시간·easing 은 클라이언트 웹 시안(kit.js) 확정값.
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export const prefersReducedMotion = () => reducedQuery.matches;

export const DUR = { reveal: 0.6, press: 0.08, release: 0.25 };
export const EASE = { out: 'power2.out', inOut: 'power2.inOut', pop: 'back.out(2)', press: 'back.out(3)' };

// 클라이언트 꽃가루 색
export const CONFETTI_COLORS = ['#ffd84d', '#ff5fd2', '#5fe3ff', '#ffffff', '#7dff9a', '#ff8a3d', '#b58cff'];
