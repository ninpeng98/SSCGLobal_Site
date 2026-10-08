// 첫 화면 릴의 계산(DOM 없음). 심볼 id 는 hero-reels.js 의 그림 경로 표와 같다.
export const REEL_SYMBOLS = ['seven', 'chip', 'crown', 'trophy', 'gift', 'crown-chip'];

export function shuffle(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 릴 띠의 심볼 순서. 첫 칸은 지금 보이는 심볼(from), 마지막 칸은 멈출 심볼(target), 가운데는 target 을 뺀 심볼을 loops 바퀴. */
export function buildStrip(symbols, loops, target, { from = target, rng = Math.random } = {}) {
  const others = symbols.filter((s) => s !== target);
  const strip = [from];
  for (let i = 0; i < loops; i += 1) strip.push(...shuffle(others, rng));
  strip.push(target);
  return strip;
}

/** 릴 i(0부터)의 회전 시간(초). 설계 6.1: 1.4, 1.85, 2.3 */
export function spinDurations(count, base = 1.4, step = 0.45) {
  return Array.from({ length: count }, (_, i) => Number((base + i * step).toFixed(2)));
}

/** 띠(높이 = 칸 수 × 창 높이)의 마지막 칸이 창에 오도록 옮길 yPercent. */
export function finalYPercent(length) {
  return -((length - 1) / length) * 100;
}

/** 다시 돌리기 결과: 세 릴이 같은 심볼로 멈춘다. */
export function pickResult(symbols, rng = Math.random) {
  return symbols[Math.min(symbols.length - 1, Math.floor(rng() * symbols.length))];
}
