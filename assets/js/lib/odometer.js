// 잭팟 숫자 표시 계산(DOM 없음). 단위는 가상 칩이고 통화 기호를 쓰지 않는다.
export function formatChips(n) {
  return Math.max(0, Math.floor(n)).toLocaleString('en-US');
}

export function toGlyphs(n) {
  return [...formatChips(n)];
}

// 자리 칸에는 0~9 를 두 번(20줄) 쌓는다. 숫자가 작아지는 자리(7 -> 2)는 두 번째 줄로 앞으로 굴러간 뒤
// 같은 숫자의 첫 번째 줄로 순간 이동한다 — 금액이 거꾸로 줄어드는 것처럼 보이지 않게.
export const ODO_ROWS = 20;

/** 칸을 몇 % 올려야 row 번째 줄(0~19)이 보이는지 */
export function digitOffsetPercent(row) {
  return 0 - (Number(row) * 100) / ODO_ROWS;
}

/** 지금 숫자 from 에서 to 로 앞으로만 굴러갈 때 멈출 줄 */
export function forwardRow(from, to) {
  return to >= from ? to : to + 10;
}

/** 다음 값: 매 틱마다 min 이상 max 미만만큼 늘어난다(장식용, 실제 값이 아님). */
export function nextJackpot(current, rng = Math.random, min = 1200, max = 9800) {
  return current + Math.floor(min + rng() * (max - min));
}
