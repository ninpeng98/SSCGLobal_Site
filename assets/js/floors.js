// 층 섹션(엘리베이터): 모든 층을 한 칸에 겹쳐 두고(가장 큰 층에 높이가 맞춰진다) 지금 층만 보여 준다. 위층으로 가면 자물쇠가 흔들리다 터지고 슬롯이 튀어나온다.
// 데스크톱(≥1024px)은 섹션을 고정하고 짧은 스크롤마다 한 층, 그보다 좁은 화면은 보이는 동안 저절로 한 층씩 오른다.
// 오른쪽 층 버튼판으로 바로 갈 수 있다. GSAP 이 없거나 동작 줄이기면 연출 없이 버튼으로만 바꾼다.
import { floorForProgress, bgGroup } from './lib/floors.js';

const STEP_VH = 0.18;  // 데스크톱: 한 층 올라가는 데 필요한 스크롤(화면 높이의 18%)
const RIDE_MS = 2200;  // 좁은 화면: 저절로 한 층씩 오르는 간격

export function initElevator(root, { reduced = false } = {}) {
  const stage = root.querySelector('[data-elevator]');
  if (!stage) return null;
  const section = stage.closest('section') ?? stage;
  const floors = [...stage.querySelectorAll('.floor')];
  const count = floors.length;
  const buttons = [...stage.querySelectorAll('.floor-btn')];
  const bgs = [...stage.querySelectorAll('.floors__bg img')];
  const { gsap, ScrollTrigger } = window;
  const animated = !reduced && !!gsap;
  let current = 0;
  let tl = null;
  let trigger = null;   // 데스크톱 고정 스크롤
  let rideTimer = 0;
  let picked = false;   // 사용자가 층을 고르면 저절로 오르기를 멈춘다

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
    buttons.forEach((b) => {
      const go = Number(b.dataset.go);
      b.setAttribute('aria-pressed', String(go === next));
      b.classList.toggle('is-open', go <= next);
    });
    const group = bgGroup(next);
    bgs.forEach((img) => img.classList.toggle('is-active', Number(img.dataset.bg) === group));
    const el = floors[next - 1];
    if (!animate || prev === 0) el.classList.add('is-open');
    else unlock(el, next > prev);
  }

  function go(n) {
    picked = true;
    stopRide();
    if (trigger) {
      // 고정 스크롤 중이면 그 층에 해당하는 스크롤 위치로 옮긴다(스크롤이 층을 바꾼다)
      const y = trigger.start + ((n - 1) / (count - 1)) * (trigger.end - trigger.start) + 1;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.6 });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    } else {
      show(n);
    }
  }

  function startRide() {
    if (picked || rideTimer) return;
    rideTimer = setInterval(() => show((current % count) + 1), RIDE_MS);
  }
  function stopRide() {
    clearInterval(rideTimer);
    rideTimer = 0;
  }

  buttons.forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.go))));
  show(1, { animate: false });
  stage.classList.add('is-ready');
  if (!animated) return { show };

  const mm = gsap.matchMedia();
  if (ScrollTrigger) {
    mm.add('(min-width: 1024px)', () => {
      trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.round((count - 1) * window.innerHeight * STEP_VH)}`,
        pin: true,
        onUpdate: (self) => show(floorForProgress(self.progress, count)),
      });
      return () => { trigger = null; };
    });
  }
  mm.add('(max-width: 1023px)', () => {
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? startRide() : stopRide()), { threshold: 0.5 });
    io.observe(stage);
    return () => { io.disconnect(); stopRide(); };
  });
  return { show };
}
