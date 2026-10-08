// 층 섹션(엘리베이터): 모든 층을 한 칸에 겹쳐 두고(가장 큰 층에 높이가 맞춰진다) 지금 층만 보여 준다. 위층으로 가면 자물쇠가 흔들리다 터지고 슬롯이 튀어나온다.
// 큰 화면(가로 ≥1024px, 세로 ≥700px)은 CSS sticky 로 섹션이 화면에 붙어 있는 동안(.floors-track 의 여분 높이)
// 짧은 스크롤(화면 높이의 6%)마다 한 층 오른다 — 고정용 공간을 실행 중에 끼워 넣지 않아 화면 밀림(CLS)이 없다.
// 그보다 작은 화면은 보이는 동안 저절로 한 층씩 오르고(10층 뒤엔 1층부터 다시), 무대를 만지면 멈춘다.
// 어느 화면에서나 무대를 좌우로 밀거나(스와이프) 키보드 좌우 화살표로 층을 바꾼다. 아래 점 10개가 지금 층을 보여 준다.
// GSAP 이 없으면 연출 없이, 동작 줄이기면 저절로 오르기·스크롤 연동 없이 스와이프·화살표로만.
import { floorForProgress, bgGroup } from './lib/floors.js';

// 스크롤로 층을 바꾸는 화면. sections.css 의 .floors-track 높이(100svh + 9 × 6svh: 한 층에 화면 높이의 6%)와 같은 조건
const SCROLL_MQ = '(min-width: 1024px) and (min-height: 700px)';
const RIDE_MS = 2200;  // 작은 화면: 저절로 한 층씩 오르는 간격
const SWIPE_PX = 40;   // 이만큼 좌우로 밀면 한 층

export function initElevator(root, { reduced = false } = {}) {
  const stage = root.querySelector('[data-elevator]');
  if (!stage) return null;
  const floors = [...stage.querySelectorAll('.floor')];
  const count = floors.length;
  const dots = [...stage.querySelectorAll('.floors__dots li')];
  const bgs = [...stage.querySelectorAll('.floors__bg img')];
  const track = stage.closest('[data-floors-track]');
  const { gsap } = window;
  const animated = !reduced && !!gsap;
  let current = 0;
  let tl = null;
  let scrollMode = false; // 스크롤 위치로 층을 정하는 중
  let aim = null;         // 스크롤로 가는 중인 층(연달아 누를 때 다음 층을 여기서부터 센다)
  let rideTimer = 0;
  let stopped = false;    // 사용자가 층을 고르거나 무대를 만지면 저절로 오르기를 그만둔다

  function unlock(el, up) {
    tl?.kill();
    const slots = el.querySelectorAll('.floor__slots > li');
    const lock = el.querySelector('.floor__lock');
    const flash = el.querySelector('.floor__flash');
    tl = gsap.timeline({ onComplete: () => el.classList.add('is-open') });
    tl.fromTo(el.querySelector('.floor__no'), { yPercent: up ? 80 : -80, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, 0);
    if (up) {
      tl.set(slots, { scale: 0.82, autoAlpha: 0.4, filter: 'grayscale(1) brightness(.55)' }, 0)
        .set(lock, { autoAlpha: 1, scale: 1, rotate: 0 }, 0)
        .to(lock, { rotate: 14, duration: 0.05, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 0.05)
        .to(lock, { scale: 1.9, autoAlpha: 0, duration: 0.28, ease: 'power2.out' }, 0.36)
        .fromTo(flash, { scale: 0.3, autoAlpha: 0.95 }, { scale: 1.5, autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, 0.36)
        .to(slots, { scale: 1, autoAlpha: 1, filter: 'grayscale(0) brightness(1)', duration: 0.5, ease: 'back.out(2.4)', stagger: 0.05 }, 0.4);
    } else {
      tl.set(lock, { autoAlpha: 0 }, 0)
        .fromTo(slots, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, filter: 'none', duration: 0.4, ease: 'back.out(2)', stagger: 0.03 }, 0);
    }
  }

  function show(n, { animate = animated } = {}) {
    const next = Math.min(count, Math.max(1, n));
    if (next === aim) aim = null;
    if (next === current) return;
    const prev = current;
    current = next;
    stage.dataset.current = String(next);
    floors.forEach((f, i) => {
      const on = i + 1 === next;
      f.classList.toggle('is-current', on);
      f.inert = !on;
      if (!on) f.classList.remove('is-open');
    });
    dots.forEach((d) => d.classList.toggle('is-current', Number(d.dataset.dot) === next));
    const group = bgGroup(next);
    bgs.forEach((img) => img.classList.toggle('is-active', Number(img.dataset.bg) === group));
    const el = floors[next - 1];
    if (!animate || prev === 0) el.classList.add('is-open');
    else unlock(el, next > prev);
  }

  // .floors-track 안에서 섹션이 붙어 있는 구간의 진행도(0~1)
  function trackProgress() {
    const r = track.getBoundingClientRect();
    const run = r.height - window.innerHeight;
    return run > 0 ? -r.top / run : 0;
  }
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      show(floorForProgress(trackProgress(), count));
    });
  };

  function go(n) {
    stopped = true;
    stopRide();
    n = Math.min(count, Math.max(1, n));
    if (scrollMode) {
      aim = n;
      // 그 층에 해당하는 스크롤 위치로 옮긴다(스크롤이 층을 바꾼다)
      const r = track.getBoundingClientRect();
      const y = window.scrollY + r.top + ((n - 1) / (count - 1)) * (r.height - window.innerHeight) + 2;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.6 });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    } else {
      show(n);
    }
  }

  function startRide() {
    if (stopped || rideTimer || scrollMode || !animated) return;
    rideTimer = setInterval(() => show(current >= count ? 1 : current + 1), RIDE_MS); // 10층 다음엔 1층부터 다시
  }
  function stopRide() {
    clearInterval(rideTimer);
    rideTimer = 0;
  }

  const step = (d) => go((aim ?? current) + d);
  stage.addEventListener('dragstart', (e) => e.preventDefault()); // 아이콘 그림 끌기가 밀기를 끊지 않게
  // 좌우로 밀기(손가락·마우스): 왼쪽으로 밀면 다음 층
  let downX = null;
  stage.addEventListener('pointerdown', (e) => { downX = e.clientX; stopped = true; stopRide(); });
  stage.addEventListener('pointerup', (e) => {
    if (downX === null) return;
    const dx = e.clientX - downX;
    downX = null;
    if (Math.abs(dx) >= SWIPE_PX) step(dx < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', () => { downX = null; });
  stage.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    step(e.key === 'ArrowRight' ? 1 : -1);
  });
  // 키보드로 들어오면 저절로 오르기를 멈춘다(읽던 층이 바뀌지 않게)
  stage.addEventListener('focusin', () => { stopped = true; stopRide(); });
  show(1, { animate: false });
  stage.classList.add('is-ready');

  const mq = window.matchMedia(SCROLL_MQ);
  let inView = false;
  function applyMode() {
    scrollMode = !reduced && !!track && mq.matches;
    if (scrollMode) {
      stopRide();
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    } else {
      window.removeEventListener('scroll', onScroll);
      if (inView) startRide();
    }
  }
  mq.addEventListener('change', applyMode);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) startRide(); else stopRide();
  }, { threshold: 0.5 }).observe(stage);
  applyMode();
  return { show };
}
