// 메인 페이지 섹션 연출: 제목·블록 등장, 슬롯 넘김, 잭팟 숫자, 층 열림, 4시간 원, 버튼 누름.
// 라이브러리가 없거나 동작 줄이기면 모든 블록을 최종 상태로 둔다.
import { DUR, EASE } from './motion.js';
import { toGlyphs, digitOffsetPercent, nextJackpot } from './lib/odometer.js';

const TICK_MS = 1600;

export function initSections(root = document, { reduced = false } = {}) {
  const animated = !reduced && Boolean(window.gsap && window.ScrollTrigger);
  initSlots(root, { reduced });
  initOdometer(root, { animated });
  initFloors(root, { animated });
  initBonus(root, { animated });
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

function initSlots(root, { reduced }) {
  const el = root.querySelector('[data-slots]');
  if (!el || !window.Swiper) return;
  new window.Swiper(el, {
    effect: reduced ? 'slide' : 'coverflow',
    coverflowEffect: { rotate: 28, stretch: 0, depth: 140, modifier: 1, slideShadows: false },
    slidesPerView: 'auto',
    centeredSlides: true,
    loop: true,
    grabCursor: true,
    speed: reduced ? 0 : 600,
    keyboard: { enabled: true, onlyInViewport: true },
    navigation: { prevEl: root.querySelector('.slots__prev'), nextEl: root.querySelector('.slots__next') },
    autoplay: reduced ? false : { delay: 4000, pauseOnMouseEnter: true, disableOnInteraction: false },
    a11y: { enabled: true, prevSlideMessage: 'Previous slot', nextSlideMessage: 'Next slot' },
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

function initFloors(root, { animated }) {
  const section = root.querySelector('[data-floors]');
  const tower = section?.querySelector('[data-tower]');
  if (!tower) return;
  const floors = [...tower.querySelectorAll('.floor')].reverse(); // 1F 부터
  const setUnlocked = (n) => {
    floors.forEach((f, i) => f.classList.toggle('is-unlocked', i < n));
    tower.dataset.unlocked = String(n);
  };
  if (!animated) {
    setUnlocked(floors.length);
    return;
  }
  const { gsap, ScrollTrigger } = window;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => {
    // 데스크톱: 섹션을 화면에 고정하고 스크롤 진행에 맞춰 한 층씩 연다
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=140%',
      pin: true,
      scrub: true,
      onUpdate: (self) => setUnlocked(Math.round(self.progress * floors.length)),
    });
    return () => setUnlocked(0);
  });
  mm.add('(max-width: 1023px)', () => {
    // 모바일: 고정 없이, 탑이 보이면 0.35초 간격으로 차례로 연다
    const calls = [];
    const st = ScrollTrigger.create({
      trigger: tower,
      start: 'top 70%',
      once: true,
      onEnter: () => floors.forEach((_, i) => calls.push(gsap.delayedCall(i * 0.35, () => setUnlocked(i + 1)))),
    });
    return () => { st.kill(); calls.forEach((c) => c.kill()); };
  });
}

function initBonus(root, { animated }) {
  const el = root.querySelector('[data-bonus]');
  if (!el) return;
  if (!animated) {
    el.dataset.state = 'full';
    return;
  }
  const { gsap } = window;
  const progress = el.querySelector('.bonus__progress');
  const chip = el.querySelector('.bonus__chip');
  gsap.set(progress, { strokeDashoffset: 100 });
  gsap.set(chip, { scale: 0, opacity: 0 });
  gsap.timeline({
    scrollTrigger: { trigger: el, start: 'top 70%', once: true },
    onComplete: () => { el.dataset.state = 'full'; },
  })
    .to(progress, { strokeDashoffset: 0, duration: 1.2, ease: EASE.inOut })
    .to(chip, { scale: 1, opacity: 1, duration: 0.5, ease: EASE.pop });
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
