// 잭팟 숫자 표시 계산(DOM 없음). 단위는 가상 칩이고 통화 기호를 쓰지 않는다.
export function formatChips(n) {
  return Math.max(0, Math.floor(n)).toLocaleString('en-US');
}

export function toGlyphs(n) {
  return [...formatChips(n)];
}

/** 0~9 가 세로로 쌓인 칸(높이 10줄)을 몇 % 올려야 숫자 d 가 보이는지. */
export function digitOffsetPercent(d) {
  return 0 - Number(d) * 10;
}

/** 다음 값: 매 틱마다 min 이상 max 미만만큼 늘어난다(장식용, 실제 값이 아님). */
export function nextJackpot(current, rng = Math.random, min = 1200, max = 9800) {
  return current + Math.floor(min + rng() * (max - min));
}
