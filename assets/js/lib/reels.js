// 데일리 잭팟 기계 릴의 계산(DOM 없음). 심볼 id 는 jackpot.js 의 그림 경로 표와 같다.
// 등급과 심볼: 클라이언트 JackpotModel(GRAND 스페이드, MAJOR 하트, MINOR 다이아몬드, MINI 클로버, 체리는 작은 상금)
export const JACKPOT_SYMBOLS = ['spade', 'heart', 'diamond', 'clover', 'cherry'];
export const TIERS = { grand: 'spade', major: 'heart', minor: 'diamond', mini: 'clover', cherry: 'cherry' };
// 릴 창 높이 ÷ 칸 높이(웹 시안: 창 262, 칸 90). 위아래 칸이 조금 잘려 보인다
export const VISIBLE_ROWS = 262 / 90;
// 다시 돌리기 결과의 비율(데모): 네 등급과 체리가 고르게 나온다
const TIER_WEIGHTS = [['grand', 0.16], ['major', 0.18], ['minor', 0.2], ['mini', 0.2], ['cherry', 0.26]];

export function shuffle(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const other = (symbols, not, rng) => {
  const pool = symbols.filter((s) => s !== not);
  return pool[Math.floor(rng() * pool.length) % pool.length];
};

/**
 * 릴 띠의 심볼 순서. 처음 세 칸은 지금 보이는 [위, 가운데, 아래](from),
 * 가운데는 모든 심볼을 섞어 loops 바퀴, 마지막 세 칸은 [위, 결과, 아래](위아래는 결과와 다른 심볼).
 */
export function buildStrip(symbols, loops, target, { from, rng = Math.random } = {}) {
  const strip = [...(from ?? [other(symbols, target, rng), target, other(symbols, target, rng)])];
  for (let i = 0; i < loops; i += 1) strip.push(...shuffle(symbols, rng));
  strip.push(other(symbols, target, rng), target, other(symbols, target, rng));
  return strip;
}

/** 릴 i(0부터)의 회전 시간(초): 1.4, 1.85, 2.3 */
export function spinDurations(count, base = 1.4, step = 0.45) {
  return Array.from({ length: count }, (_, i) => Number((base + i * step).toFixed(2)));
}

/** index 번 칸을 창 가운데 두는 띠의 yPercent(띠 높이 = 칸 수 × 칸 높이 기준) */
export function stripYPercent(index, length, rows = VISIBLE_ROWS) {
  return (((rows - 1) / 2 - index) / length) * 100;
}

/** 다시 돌리기 결과 등급 */
export function pickTier(rng = Math.random) {
  let r = rng();
  for (const [tier, w] of TIER_WEIGHTS) {
    if (r < w) return tier;
    r -= w;
  }
  return TIER_WEIGHTS.at(-1)[0];
}
