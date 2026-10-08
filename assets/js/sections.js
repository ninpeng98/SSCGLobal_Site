// 메인 페이지 섹션 연출: 제목·블록 등장, 슬롯 넘김, 잭팟 숫자, 층 엘리베이터(floors.js), 보너스, 버튼 누름.
// 라이브러리가 없거나 동작 줄이기면 모든 블록을 최종 상태로 둔다.
import { DUR, EASE } from './motion.js';
import { ringPose } from './lib/ring.js';
import { toGlyphs, digitOffsetPercent, nextJackpot } from './lib/odometer.js';
import { initElevator } from './floors.js';

const TICK_MS = 1600;

export function initSections(root = document, { reduced = false } = {}) {
  const animated = !reduced && Boolean(window.gsap && window.ScrollTrigger);
  initSlots(root, { reduced });
  initOdometer(root, { animated });
  initElevator(root, { reduced });
  initBonus(root, { reduced });
  if (animated) {
    initReveals(root);
    initPressFeedback(root);
  }
}

/* 화면 아래쪽에 있는 블록만 숨겼다가 보일 때 올린다(이미 보이거나 지나간 블록은 그대로). */
function initReveals(root) {
  const { gsap, ScrollTrigger, SplitText } = window;
  const below = (el) => el.getBoundingClientRect().top > window.innerHeight;
  if (SplitText) {
    root.querySelectorAll('h2.gold-title').forEach((title) => {
      const split = SplitText.create(title, { type: 'words', wordsClass: 'gw' });
      title.classList.add('is-split');
      if (!below(title)) return;
      gsap.from(split.words, {
        yPercent: 60, opacity: 0, duration: DUR.reveal, ease: EASE.out, stagger: 0.04,
        scrollTrigger: { trigger: title, start: 'top 88%', once: true },
      });
    });
  }
  const items = [...root.querySelectorAll('[data-reveal]')].filter(below);
  if (!items.length) return;
  gsap.set(items, { opacity: 0, y: 32 });
  const show = (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: DUR.reveal, ease: EASE.out, stagger: 0.08, overwrite: true });
  // 링크 이동·스크롤 위치 복원처럼 한 번에 건너뛰어 지나간 블록(onLeave)도 보이게 한다
  ScrollTrigger.batch(items, { start: 'top 90%', onEnter: show, onLeave: show, onEnterBack: show });
}

// 슬롯 넘김: 볼록한 원통(가운데가 가장 가깝다). Swiper 는 끌기·키보드·무한 반복만 맡고,
// 카드 위치는 lib/ring.js 가 정한다(virtualTranslate: 줄 전체를 옮기지 않고 카드마다 놓는다).
const RING_RADIUS = 2.45; // 원통 반지름 = 카드 폭 × 이 값

function placeRing(swiper) {
  const width = swiper.width;
  for (const slide of swiper.slides) {
    const size = slide.swiperSlideSize;
    const pose = ringPose(slide.progress, { radius: size * RING_RADIUS });
    const x = -slide.swiperSlideOffset + (width - size) / 2 + pose.x;
    slide.style.transform = `translate3d(${x}px, 0, ${pose.z}px) rotateY(${pose.rotateY}deg)`;
    slide.style.opacity = String(pose.opacity);
    slide.style.zIndex = String(pose.zIndex);
    slide.style.visibility = pose.opacity === 0 ? 'hidden' : '';
  }
}

function initSlots(root, { reduced }) {
  const el = root.querySelector('[data-slots]');
  if (!el || !window.Swiper) return;
  el.classList.add('is-ring');
  new window.Swiper(el, {
    slidesPerView: 'auto',
    centeredSlides: true,
    loop: true,
    grabCursor: true,
    speed: reduced ? 0 : 700,
    virtualTranslate: true,
    watchSlidesProgress: true,
    keyboard: { enabled: true, onlyInViewport: true },
    navigation: { prevEl: root.querySelector('.slots__prev'), nextEl: root.querySelector('.slots__next') },
    // 사용자가 한 번이라도 넘기면 자동 넘김을 멈춘다(키보드·터치 포함)
    autoplay: reduced ? false : { delay: 4000, pauseOnMouseEnter: true, disableOnInteraction: true },
    a11y: { enabled: true, prevSlideMessage: 'Previous slot', nextSlideMessage: 'Next slot' },
    on: {
      setTranslate: placeRing,
      progress: placeRing,
      resize: placeRing,
      setTransition(swiper, ms) {
        for (const slide of swiper.slides) slide.style.transitionDuration = `${ms}ms`;
      },
    },
  });
}

function buildOdometer(el, glyphs) {
  el.replaceChildren(...glyphs.map((g) => {
    if (!/\d/.test(g)) {
      const sep = document.createElement('span');
      sep.className = 'odo__sep';
      sep.textContent = g;
      return sep;
    }
    const digit = document.createElement('span');
    digit.className = 'odo__digit';
    const column = document.createElement('span');
    column.className = 'odo__reel';
    for (let d = 0; d <= 9; d += 1) {
      const n = document.createElement('span');
      n.textContent = String(d);
      column.append(n);
    }
    digit.append(column);
    return digit;
  }));
}

function initOdometer(root, { animated }) {
  const el = root.querySelector('[data-odometer]');
  if (!el || !animated) return;
  const { gsap, ScrollTrigger } = window;
  let value = Number(el.dataset.start);
  let glyphCount = toGlyphs(value).length;
  let timer = null;
  let rolled = false;
  buildOdometer(el, toGlyphs(value));
  el.dataset.value = '0';

  const render = (n, duration) => {
    const glyphs = toGlyphs(n);
    if (glyphs.length !== glyphCount) {
      buildOdometer(el, glyphs);
      glyphCount = glyphs.length;
    }
    const columns = el.querySelectorAll('.odo__reel');
    glyphs.filter((g) => /\d/.test(g)).forEach((g, i) => {
      gsap.to(columns[i], { yPercent: digitOffsetPercent(g), duration, ease: 'power3.out', delay: duration ? i * 0.04 : 0, overwrite: true });
    });
    el.dataset.value = String(n);
  };

  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    end: 'bottom 15%',
    onToggle: (self) => {
      clearInterval(timer);
      timer = null;
      if (!self.isActive) return;
      if (!rolled) {
        rolled = true;
        render(value, 1.4);
      }
      timer = setInterval(() => {
        value = nextJackpot(value);
        render(value, 0.8);
      }, TICK_MS);
    },
  });
}

// 콜렉트 보너스: 보이는 동안 "받기 전 → (누름) → 받은 순간"을 되풀이한다. 동작 줄이기면 받은 순간 그림에 멈춘다.
const COLLECT_READY_MS = 2200;
const COLLECT_TAP_MS = 450;
const COLLECT_PAID_MS = 2600;

function initBonus(root, { reduced }) {
  const el = root.querySelector('[data-collect]');
  if (!el) return;
  if (reduced) {
    el.dataset.state = 'paid';
    return;
  }
  let timer = 0;
  const step = (state, ms, next) => {
    el.dataset.state = state;
    timer = setTimeout(next, ms);
  };
  const loop = () => step('ready', COLLECT_READY_MS, () => step('tap', COLLECT_TAP_MS, () => step('paid', COLLECT_PAID_MS, loop)));
  const io = new IntersectionObserver(([entry]) => {
    clearTimeout(timer);
    if (entry.isIntersecting) loop();
    else el.dataset.state = 'ready';
  }, { threshold: 0.4 });
  io.observe(el);
}

/* 사탕 버튼 누름: 0.94배로 눌렸다가 튕겨 돌아온다(클라이언트 값). 설치 배지는 그림을 바꾸지 않기 위해 제외. */
function initPressFeedback(root) {
  const { gsap } = window;
  root.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('pointerdown', () => gsap.to(btn, { scale: 0.94, duration: DUR.press, ease: 'power2.out' }));
    const release = () => gsap.to(btn, { scale: 1, duration: DUR.release, ease: EASE.press });
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
  });
}
