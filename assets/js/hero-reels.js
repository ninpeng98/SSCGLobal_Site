// 첫 화면 릴: 키 아트의 777 자리에 겹친 릴 3개를 돌린다. 계산은 lib/reels.js.
// 777 로 멈추면 겹침을 투명하게 해서(CSS) 그림 원래의 777 이 보인다.
import { REEL_SYMBOLS, buildStrip, spinDurations, finalYPercent, pickResult } from './lib/reels.js';

const SYMBOL_SRC = {
  seven: 'assets/img/reels/seven.webp',
  chip: 'assets/img/icons/chip.webp',
  crown: 'assets/img/icons/crown.webp',
  trophy: 'assets/img/icons/trophy.webp',
  gift: 'assets/img/icons/gift.webp',
  'crown-chip': 'assets/img/icons/crown-chip.webp',
};
const LOOPS = 3;         // 띠 하나에 다른 심볼을 몇 바퀴 넣을지
const BLUR_OFF_AT = 0.8; // 회전 시간의 80%가 지나면 흐림을 끈다(멈출 때 그림이 또렷하게)

function renderStrip(strip, ids) {
  strip.replaceChildren(...ids.map((id) => {
    const cell = document.createElement('div');
    cell.className = `reel__cell reel__cell--${id}`;
    const img = document.createElement('img');
    img.src = SYMBOL_SRC[id];
    img.alt = '';
    img.width = 256; // CSS 가 크기를 정한다. 속성은 레이아웃 예약·점검용
    img.height = 256;
    img.decoding = 'async';
    cell.append(img);
    return cell;
  }));
}

/**
 * @returns {{ spin(target: string): Promise<string|null>, ready: Promise<void> } | null}
 *   동작 줄이기이거나 GSAP 이 없으면 null 이고, 릴은 data-state="static"(그림의 777 그대로).
 */
export function initHeroReels(hero, { reduced = false, onLand } = {}) {
  const reels = hero.querySelector('[data-reels]');
  if (!reels) return null;
  const { gsap } = window;
  if (reduced || !gsap) {
    reels.dataset.state = 'static';
    reels.dataset.result = 'seven';
    return null;
  }

  const strips = [...reels.querySelectorAll('.reel__strip')];
  const spinBtn = hero.querySelector('[data-spin]');
  const ready = Promise.all(Object.values(SYMBOL_SRC).map((src) => {
    const img = new Image();
    img.src = src;
    return img.decode().catch(() => {});
  })).then(() => {});
  let current = 'seven';
  let busy = false;
  let spins = 0;

  function spin(target) {
    if (busy) return Promise.resolve(null);
    busy = true;
    spins += 1;
    reels.dataset.spins = String(spins);
    if (spinBtn) spinBtn.disabled = true;

    const durations = spinDurations(strips.length);
    const tl = gsap.timeline();
    strips.forEach((strip, i) => {
      const ids = buildStrip(REEL_SYMBOLS, LOOPS, target, { from: current });
      renderStrip(strip, ids);
      strip.parentElement.classList.remove('is-stopped');
      gsap.set(strip, { yPercent: 0 });
      tl.to(strip, { yPercent: finalYPercent(ids.length), duration: durations[i], ease: 'back.out(0.6)' }, 0);
      tl.call(() => strip.parentElement.classList.add('is-stopped'), null, durations[i] * BLUR_OFF_AT);
    });
    delete reels.dataset.result;
    reels.dataset.state = 'spinning';

    return new Promise((resolve) => {
      tl.eventCallback('onComplete', () => {
        busy = false;
        current = target;
        reels.dataset.state = 'landed';
        reels.dataset.result = target;
        if (spinBtn) spinBtn.disabled = false;
        onLand?.(target, reels.getBoundingClientRect());
        resolve(target);
      });
    });
  }

  spinBtn?.addEventListener('click', () => spin(pickResult(REEL_SYMBOLS)));
  return { spin, ready };
}
