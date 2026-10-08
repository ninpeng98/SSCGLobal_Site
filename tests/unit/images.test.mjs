import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { webpSize, pngSize } from './helpers/image-size.mjs';

// [파일, 기대 폭, 기대 가로/세로 비율]. 높이는 반올림 차이가 있어 비율로 본다(1% 허용).
const WEBP = [
  ['assets/img/hero/splash-wide-960.webp', 960, 1914 / 822],
  ['assets/img/hero/splash-wide-1440.webp', 1440, 1914 / 822],
  ['assets/img/hero/splash-wide-1914.webp', 1914, 1914 / 822],
  ['assets/img/hero/keyart-square-600.webp', 600, 1],
  ['assets/img/hero/keyart-square-750.webp', 750, 1],
  ['assets/img/hero/keyart-square-900.webp', 900, 1],
  ['assets/img/hero/keyart-square-1254.webp', 1254, 1],
  ['assets/img/hero/keyart-16x9-960.webp', 960, 16 / 9],
  ['assets/img/hero/keyart-16x9-1920.webp', 1920, 16 / 9],
  ['assets/img/reels/seven.webp', 244, 244 / 435],
  ['assets/img/icons/chip.webp', 152, 1],
  ['assets/img/icons/crown.webp', 216, 432 / 360],
  ['assets/img/icons/trophy.webp', 256, 1],
  ['assets/img/icons/gift.webp', 256, 1],
  ['assets/img/icons/crown-chip.webp', 256, 1],
  ['assets/img/icons/lock.webp', 64, 128 / 184],
  ['assets/img/icons/coin-sheet.webp', 320, 320 / 128],
  ['assets/img/features/lucky-time-badge.webp', 384, 384 / 98],
  ...['spade', 'heart', 'diamond', 'clover'].map((s) => [`assets/img/icons/sym-${s}.webp`, 120, 1]),
  ['assets/img/brand/app-icon-128.webp', 128, 1],
  ['assets/img/brand/vglobal-logo.webp', 500, 500 / 310],
  ...['jackpot', 'lucky-time', 'floors', 'ranking', 'lobby'].flatMap((n) => [
    [`assets/img/features/${n}-960.webp`, 960, 16 / 9],
    [`assets/img/features/${n}-1600.webp`, 1600, 16 / 9],
  ]),
];

export const SLOTS = [
  'golden-fruits', 'cash-fever', 'fairy-garden', 'aladdin', 'excalibur', 'titan',
  'treasure-island', 'curse-of-the-pharaohs', 'halloween-witch', 'christmas-miracle', 'zombie-hunter', 'gangsters-poker',
];

for (const [file, width, ratio] of WEBP) {
  test(`${file} is ${width}px wide with ratio ${ratio.toFixed(3)}`, () => {
    const size = webpSize(readFileSync(file));
    assert.equal(size.width, width);
    assert.ok(Math.abs(size.width / size.height - ratio) / ratio < 0.01, `${size.width}×${size.height}`);
  });
}

test('12 slot tiles exist at 273×282', () => {
  for (const slug of SLOTS) assert.deepEqual(webpSize(readFileSync(`assets/img/slots/${slug}.webp`)), { width: 273, height: 282 });
});

test('PNG icons have the declared sizes', () => {
  for (const [file, px] of [['favicon-32', 32], ['icon-192', 192], ['icon-512', 512], ['apple-touch-icon', 180]]) {
    assert.deepEqual(pngSize(readFileSync(`assets/img/brand/${file}.png`)), { width: px, height: px });
  }
});

test('the Daily Jackpot machine image exists and is at least 400px wide', () => {
  assert.ok(webpSize(readFileSync('assets/img/features/jackpot-machine.webp')).width >= 400);
});

test('official Google Play badge, social image and favicon exist', () => {
  assert.ok(pngSize(readFileSync('assets/img/badges/google-play-en.png')).width >= 500);
  assert.ok(existsSync('assets/img/og/og-golden-hour.jpg'));
  assert.equal(readFileSync('favicon.ico').readUInt16LE(2), 1); // ICO type 1
});
