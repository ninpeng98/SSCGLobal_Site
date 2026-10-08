// 층 섹션의 계산(DOM 없음).

/** 로비 표기처럼 칩을 줄여 쓴다: 50000 → '50K', 1200000 → '1.2M', 7500000000 → '7.5B' */
export function shortChips(n) {
  for (const [unit, size] of [['B', 1e9], ['M', 1e6], ['K', 1e3]]) {
    if (n >= size) return `${Number((n / size).toFixed(1))}${unit}`;
  }
  return String(n);
}

/** 스크롤 진행도(0~1)를 층 번호(1~count)로 */
export function floorForProgress(progress, count) {
  const p = Math.min(1, Math.max(0, progress));
  return 1 + Math.round(p * (count - 1));
}

/** 게임과 같은 배경 묶음: 1–3층 1, 4–6층 2, 7–9층 3, 10층 4 */
export function bgGroup(floor) {
  return Math.min(4, Math.floor((floor - 1) / 3) + 1);
}
