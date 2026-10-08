import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ringPose } from '../../assets/js/lib/ring.js';

// Swiper 의 slide.progress: 가운데 0, 왼쪽 카드가 양수, 오른쪽 카드가 음수
test('the centre card sits at the front, facing the viewer', () => {
  const p = ringPose(0);
  assert.equal(p.x, 0);
  assert.equal(p.z, 0);
  assert.equal(p.rotateY, 0);
  assert.equal(p.opacity, 1);
});

test('side cards move back and turn outward (convex ring: centre nearest)', () => {
  const left = ringPose(1);
  const right = ringPose(-1);
  assert.ok(left.x < 0 && right.x > 0, 'left card on the left, right card on the right');
  assert.ok(left.z < 0 && right.z < 0, 'side cards are farther than the centre');
  assert.ok(left.rotateY < 0, 'left card faces left-front (outward)');
  assert.ok(right.rotateY > 0, 'right card faces right-front (outward)');
  assert.ok(ringPose(2).z < left.z, 'cards get farther the further out they are');
});

test('both sides are mirror images', () => {
  for (const p of [0.5, 1, 2, 3]) {
    const a = ringPose(p);
    const b = ringPose(-p);
    assert.equal(a.x, -b.x);
    assert.equal(a.z, b.z);
    assert.equal(a.rotateY, -b.rotateY);
    assert.equal(a.opacity, b.opacity);
  }
});

test('no visible card is ever turned past 90 degrees (no mirrored backs)', () => {
  for (let p = -8; p <= 8; p += 0.25) {
    const pose = ringPose(p);
    if (pose.opacity > 0) assert.ok(Math.abs(pose.rotateY) < 90, `p=${p} rotateY=${pose.rotateY}`);
  }
});

test('only about three cards each side are shown; farther ones fade out', () => {
  assert.equal(ringPose(2).opacity, 1);
  assert.ok(ringPose(3).opacity > 0 && ringPose(3).opacity < 1);
  assert.equal(ringPose(4).opacity, 0);
  assert.equal(ringPose(-4).opacity, 0);
});

test('nearer cards stack on top', () => {
  assert.ok(ringPose(0).zIndex > ringPose(1).zIndex);
  assert.ok(ringPose(1).zIndex > ringPose(2).zIndex);
  assert.equal(ringPose(1).zIndex, ringPose(-1).zIndex);
});
