// 슬롯 넘김(볼록한 원통): 계속 천천히 돈다. 끄는(스와이프) 동안만 멈춰 손을 따라가고, 놓으면 가까운 카드에
// 맞춘 뒤 다시 돈다. 키보드 좌우 화살표로 한 장씩. 카드 위치는 lib/ring.js 가 정한다(라이브러리 없음).
// 화면 밖이거나 탭이 숨겨지면 그리기를 멈춘다. 동작 줄이기면 저절로 돌지 않는다(끌기·화살표는 된다).
import { ringPose, ringOffset } from './lib/ring.js';

const SPEED = 0.2;         // 저절로 도는 빠르기(초당 카드 장수: 5초에 한 장)
const RADIUS = 3.6;        // 원통 반지름 = 카드 폭 × 이 값
const DRAG_PER_CARD = 0.9; // 카드 폭의 90%를 끌면 한 장
const SETTLE = 0.16;       // 놓은 뒤 가까운 카드로 맞춰 가는 비율(프레임마다)

export function initSlotRing(el, { reduced = false } = {}) {
  if (!el) return null;
  const track = el.querySelector('.ring__track');
  const slides = [...el.querySelectorAll('.ring__slide')];
  const count = slides.length;
  let theta = 0;
  let target = null;   // 맞춰 가는 중인 위치(놓은 뒤·화살표)
  let drag = null;     // { x, theta }
  let paused = false;  // 시험·측정용
  let visible = false;
  let raf = 0;
  let last = 0;
  let activeIndex = -1;

  function layout() {
    const width = el.clientWidth;
    const size = slides[0].offsetWidth;
    track.style.height = `${slides[0].offsetHeight}px`;
    let nearest = 0;
    let best = Infinity;
    slides.forEach((slide, i) => {
      const p = ringOffset(i, theta, count);
      const pose = ringPose(p, { radius: size * RADIUS });
      slide.style.transform = `translate3d(${(width - size) / 2 + pose.x}px, 0, ${pose.z}px) rotateY(${pose.rotateY}deg)`;
      slide.style.opacity = String(pose.opacity);
      slide.style.zIndex = String(pose.zIndex);
      slide.style.visibility = pose.opacity === 0 ? 'hidden' : '';
      if (Math.abs(p) < best) { best = Math.abs(p); nearest = i; }
    });
    if (nearest !== activeIndex) {
      slides[activeIndex]?.classList.remove('is-active');
      slides[nearest].classList.add('is-active');
      activeIndex = nearest;
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!drag && !paused) {
      if (target !== null) {
        theta += (target - theta) * SETTLE;
        if (Math.abs(target - theta) < 0.002) { theta = target; target = null; }
      } else if (!reduced) {
        theta += SPEED * dt;
      }
    }
    layout();
    raf = requestAnimationFrame(frame);
  }
  const start = () => {
    if (raf || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  // 끌기(손가락·마우스): 왼쪽으로 끌면 다음 카드가 가운데로
  el.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, theta };
    target = null;
    el.classList.add('is-dragging');
    el.setPointerCapture?.(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    theta = drag.theta - (e.clientX - drag.x) / (slides[0].offsetWidth * DRAG_PER_CARD);
    if (reduced || !raf) layout();
  });
  const release = () => {
    if (!drag) return;
    drag = null;
    target = Math.round(theta);
    el.classList.remove('is-dragging');
    if (reduced && !raf) { theta = target; target = null; layout(); }
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('dragstart', (e) => e.preventDefault());
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    target = Math.round(target ?? theta) + (e.key === 'ArrowRight' ? 1 : -1);
    if (!raf) { theta = target; target = null; layout(); }
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start(); else stop();
  }).observe(el);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  new ResizeObserver(() => layout()).observe(el);

  // 시험·측정용 손잡이
  Object.defineProperty(el, 'ringTheta', { get: () => theta });
  el.ringPause = (on) => { paused = on; };
  el.ringSnap = () => { theta = Math.round(theta); target = null; layout(); };

  el.classList.add('is-ring');
  layout();
  return { layout };
}
