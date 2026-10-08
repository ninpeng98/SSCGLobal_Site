// 데일리 잭팟 기계: 정면 기계 그림의 빈 릴 창 위에 릴 3개를 얹어 돌린다. 계산은 lib/reels.js.
// 화면에 들어오면 한 번 돌아 GRAND(스페이드 3개)에 멈추고, 그 뒤로는 기계의 SPIN 버튼으로 다시 돌린다.
import { JACKPOT_SYMBOLS, TIERS, buildStrip, spinDurations, stripYPercent, pickTier } from './lib/reels.js';

const SYMBOL_SRC = Object.fromEntries(JACKPOT_SYMBOLS.map((s) => [s, `assets/img/jackpot/sym-${s}.webp`]));
const LOOPS = 3;         // 띠 하나에 심볼을 몇 바퀴 넣을지
const BLUR_OFF_AT = 0.8; // 회전 시간의 80%가 지나면 흐림을 끈다
const RESULT_SHOWN_MS = 2600;
const RESULT_TEXT = { grand: 'GRAND JACKPOT!', major: 'MAJOR JACKPOT!', minor: 'MINOR JACKPOT!', mini: 'MINI JACKPOT!', cherry: 'YOU WON!' };
// 릴마다 [위, 가운데, 아래]. 처음에는 섞인 모습, 동작 줄이기면 GRAND 줄
const IDLE_ROWS = [['heart', 'cherry', 'diamond'], ['clover', 'spade', 'cherry'], ['diamond', 'heart', 'clover']];
const GRAND_ROWS = [['heart', 'spade', 'cherry'], ['cherry', 'spade', 'diamond'], ['clover', 'spade', 'heart']];

function renderStrip(strip, ids) {
  strip.replaceChildren(...ids.map((id) => {
    const cell = document.createElement('div');
    cell.className = 'machine__cell';
    cell.dataset.symbol = id;
    const img = document.createElement('img');
    img.src = SYMBOL_SRC[id];
    img.alt = '';
    img.width = 160; // CSS 가 크기를 정한다. 속성은 레이아웃 예약·점검용
    img.height = 160;
    img.decoding = 'async';
    cell.append(img);
    return cell;
  }));
}

const centre = (strip, index, length) => { strip.style.transform = `translateY(${stripYPercent(index, length)}%)`; };

/**
 * @param {{ reduced?: boolean, onWin?: (tier: string, windowRect: DOMRect) => void }} opts
 * @returns {{ spin(tier: string): Promise<string|null> } | null} 동작 줄이기이거나 GSAP 이 없으면 null(GRAND 줄로 멈춘 그림)
 */
export function initDailyJackpot(section, { reduced = false, onWin } = {}) {
  const machine = section?.querySelector('[data-machine]');
  if (!machine) return null;
  const strips = [...machine.querySelectorAll('.machine__strip')];
  const spinBtn = machine.querySelector('[data-machine-spin]');
  const resultEl = machine.querySelector('[data-machine-result]');
  const meters = new Map([...section.querySelectorAll('.meter')].map((m) => [m.dataset.tier, m]));
  const { gsap } = window;
  const still = reduced || !gsap;
  let rows = still ? GRAND_ROWS : IDLE_ROWS;
  strips.forEach((strip, i) => { renderStrip(strip, rows[i]); centre(strip, 1, 3); });

  let hideTimer = 0;
  function showWin(tier, animate) {
    meters.get(tier)?.classList.add('is-hit');
    resultEl.textContent = RESULT_TEXT[tier];
    if (!animate) return;
    resultEl.classList.add('is-shown');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => resultEl.classList.remove('is-shown'), RESULT_SHOWN_MS);
  }
  function clearWin() {
    meters.forEach((m) => m.classList.remove('is-hit'));
    clearTimeout(hideTimer);
    resultEl.classList.remove('is-shown');
    resultEl.textContent = '';
  }

  if (still) {
    // 멈춘 그림: GRAND 줄과 GRAND 판 빛만(보이지 않는 결과 문구는 넣지 않는다 — 화면 낭독기가 읽지 않게)
    machine.dataset.state = 'static';
    machine.dataset.result = 'grand';
    meters.get('grand')?.classList.add('is-hit');
    return null;
  }

  // disabled 대신 aria-disabled: 키보드로 누른 뒤에도 포커스가 버튼에 남는다(겹침은 busy 가 막는다)
  const setLocked = (locked) => spinBtn.setAttribute('aria-disabled', String(locked));
  let busy = false;
  let spins = 0;
  function spin(tier) {
    if (busy) return Promise.resolve(null);
    busy = true;
    spins += 1;
    machine.dataset.spins = String(spins);
    setLocked(true);
    clearWin();

    const target = TIERS[tier];
    const durations = spinDurations(strips.length);
    const next = [];
    const tl = gsap.timeline();
    strips.forEach((strip, i) => {
      const ids = buildStrip(JACKPOT_SYMBOLS, LOOPS, target, { from: rows[i] });
      renderStrip(strip, ids);
      next.push(ids.slice(-3));
      strip.parentElement.classList.remove('is-stopped');
      strip.style.transform = '';
      gsap.set(strip, { yPercent: stripYPercent(1, ids.length) });
      tl.to(strip, { yPercent: stripYPercent(ids.length - 2, ids.length), duration: durations[i], ease: 'back.out(0.6)' }, 0);
      tl.call(() => strip.parentElement.classList.add('is-stopped'), null, durations[i] * BLUR_OFF_AT);
    });
    delete machine.dataset.result;
    machine.dataset.state = 'spinning';

    return new Promise((resolve) => {
      tl.eventCallback('onComplete', () => {
        busy = false;
        rows = next;
        machine.dataset.state = 'landed';
        machine.dataset.result = tier;
        setLocked(false);
        showWin(tier, true);
        onWin?.(tier, machine.querySelector('.machine__window').getBoundingClientRect());
        resolve(tier);
      });
    });
  }

  spinBtn.addEventListener('click', () => {
    if (spinBtn.getAttribute('aria-disabled') !== 'true') spin(pickTier());
  });

  // 처음 화면에 들어올 때 한 번: 심볼 그림을 다 받은 뒤, 그때도 기계가 보이면 GRAND 로 돌린다
  // (빠르게 지나쳐 화면 밖에 있으면 다음에 보일 때 돈다)
  const ready = Promise.all(Object.values(SYMBOL_SRC).map((src) => {
    const img = new Image();
    img.src = src;
    return img.decode().catch(() => {});
  }));
  let visible = false;
  let queued = false;
  const firstSpin = () => {
    if (spins > 0 || queued || !visible) return;
    queued = true;
    ready.then(() => gsap.delayedCall(0.3, () => {
      queued = false;
      if (visible && spins === 0) {
        io.disconnect();
        spin('grand');
      }
    }));
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    firstSpin();
  }, { threshold: 0.5 });
  io.observe(machine);

  return { spin };
}
