// 슬롯 넘김의 볼록한 원통 배치(DOM 없음): 가운데 카드가 가장 가깝고, 옆 카드는 원통을 따라 뒤로 물러나며
// 바깥쪽으로 돈다. p 는 가운데로부터의 거리(장): 가운데 0, 왼쪽 양수, 오른쪽 음수.
export const RING_STEP = 19;      // 카드 한 장마다 원통에서 도는 각도(도)
export const RING_TILT = 0.55;    // 카드 자체는 그 각도의 55%만 돈다(양 끝 카드가 옆으로 누워 보이지 않게)
export const RING_VISIBLE = 2.6;  // 이만큼(장)까지는 또렷하게, 그 뒤 0.8장 동안 사라진다
const FADE = 0.8;

const clean = (n) => n + 0; // -0 을 0 으로

/** @returns {{ x: number, z: number, rotateY: number, opacity: number, zIndex: number }} x·z 는 px */
export function ringPose(p, { step = RING_STEP, radius = 620, visible = RING_VISIBLE, tilt = RING_TILT } = {}) {
  const deg = p * step;
  const rad = (Math.max(-90, Math.min(90, deg)) * Math.PI) / 180;
  const d = Math.abs(p);
  const opacity = d <= visible ? 1 : Math.max(0, 1 - (d - visible) / FADE);
  return {
    x: clean(-radius * Math.sin(rad)),
    z: clean(-radius * (1 - Math.cos(rad))),
    rotateY: opacity > 0 ? clean(-deg * tilt) : 0,
    opacity,
    zIndex: 100 - Math.round(d * 10),
  };
}

/** 원통이 theta(장)만큼 돌았을 때 index 번 카드의 p. 모든 카드가 [-count/2, count/2) 안을 돌아간다 */
export function ringOffset(index, theta, count) {
  const v = (((theta - index) % count) + count) % count;
  return clean(v >= count / 2 ? v - count : v);
}
