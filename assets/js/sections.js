// 메인 페이지 섹션 연출: 제목·블록 등장, 슬롯 넘김, 잭팟 숫자, 층 엘리베이터(floors.js), 보너스, 버튼 누름.
// 라이브러리가 없거나 동작 줄이기면 모든 블록을 최종 상태로 둔다.
import { DUR, EASE } from './motion.js';
import { initSlotRing } from './slots-ring.js';
import { toGlyphs, digitOffsetPercent, forwardRow, nextJackpot } from './lib/odometer.js';
import { initElevator } from './floors.js';

const TICK_MS = 1600;

export function initSections(root = document, { reduced = false } = {}) {
  const animated = !reduced && Boolean(window.gsap && window.ScrollTrigger);
  initSlotRing(root.querySelector('[data-slots]'), { reduced });
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
    for (let d = 0; d < 20; d += 1) {
      const n = document.createElement('span');
      n.textContent = String(d % 10);
      column.append(n);
    }
    column.dataset.digit = '0';
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
      const col = columns[i];
      const to = Number(g);
      const row = forwardRow(Number(col.dataset.digit), to);
      col.dataset.digit = String(to);
      gsap.to(col, {
        yPercent: digitOffsetPercent(row), duration, ease: 'power3.out', delay: duration ? i * 0.04 : 0, overwrite: true,
        onComplete: () => gsap.set(col, { yPercent: digitOffsetPercent(to) }),
      });
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

// 콜렉트 보너스(가상의 로비 한 조각): 2시간 타이머가 빨리 감기로 0 이 되고(wait) → 판이 빛나고(ready) → 누르고(tap)
// → +5,000,000 과 칩이 잔액으로 날아가 잔액이 오른다(paid). 보이는 동안 세 번 보여 주고 받은 순간에서 멈춘다.
// 동작 줄이기면 처음부터 받은 순간 그림. GSAP 없이도 돈다(시간은 setTimeout).
const COLLECT = { wait: 2200, ready: 1200, tap: 450, paid: 2600, rounds: 3, gain: 5000000, hours: 2 };

const hms = (sec) => [sec / 3600, (sec % 3600) / 60, sec % 60].map((v) => String(Math.floor(v)).padStart(2, '0')).join(':');

function initBonus(root, { reduced }) {
  const el = root.querySelector('[data-collect]');
  if (!el) return;
  const timer = el.querySelector('[data-timer]');
  const balanceEl = el.querySelector('[data-balance]');
  let balance = Number(balanceEl.textContent.replace(/,/g, ''));
  const full = COLLECT.hours * 3600;
  if (reduced) {
    el.dataset.state = 'paid';
    balanceEl.textContent = (balance + COLLECT.gain).toLocaleString('en-US');
    return;
  }
  let timeouts = [];
  let ticker = 0;
  let rounds = 0;
  const later = (fn, ms) => timeouts.push(setTimeout(fn, ms));
  const clearAll = () => { timeouts.forEach(clearTimeout); timeouts = []; clearInterval(ticker); };
  // 타이머 빨리 감기: 02:00:00 → 00:00:00 (처음엔 빠르게, 끝에서 느리게)
  const fastForward = (ms) => {
    const t0 = performance.now();
    clearInterval(ticker);
    ticker = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      timer.textContent = hms(Math.round(full * (1 - p) ** 2));
      if (p >= 1) clearInterval(ticker);
    }, 40);
  };
  const countUp = (from, to, ms) => {
    const t0 = performance.now();
    const step = () => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      balanceEl.textContent = Math.round(from + (to - from) * (1 - (1 - p) ** 3)).toLocaleString('en-US');
      if (p < 1) later(step, 30);
    };
    step();
  };
  const round = () => {
    if (rounds >= COLLECT.rounds) {
      el.dataset.state = 'paid';
      io.disconnect();
      return;
    }
    rounds += 1;
    el.dataset.state = 'wait';
    timer.textContent = hms(full);
    fastForward(COLLECT.wait - 300);
    later(() => { el.dataset.state = 'ready'; }, COLLECT.wait);
    later(() => { el.dataset.state = 'tap'; }, COLLECT.wait + COLLECT.ready);
    later(() => {
      el.dataset.state = 'paid';
      timer.textContent = hms(full);
      const from = balance;
      balance += COLLECT.gain;
      later(() => countUp(from, balance, 900), 600); // 칩이 잔액에 닿을 즈음 오르기 시작
    }, COLLECT.wait + COLLECT.ready + COLLECT.tap);
    later(round, COLLECT.wait + COLLECT.ready + COLLECT.tap + COLLECT.paid);
  };
  const io = new IntersectionObserver(([entry]) => {
    clearAll();
    if (entry.isIntersecting) round();
    else if (rounds < COLLECT.rounds && el.dataset.state !== 'paid') el.dataset.state = 'wait';
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
