import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { webpSize, pngSize } from './helpers/image-size.mjs';
import { SLOT_LIST } from '../../scripts/floors.mjs';

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
  ['assets/img/icons/coin-sheet.webp', 320, 320 / 128],
  ['assets/img/features/lucky-time-badge.webp', 384, 384 / 98],
  // 데일리 잭팟 심볼(GRAND 스페이드, MAJOR 하트, MINOR 다이아몬드, MINI 클로버, 작은 상금 체리)
  ...['spade', 'heart', 'diamond', 'clover', 'cherry'].map((s) => [`assets/img/jackpot/sym-${s}.webp`, 160, 1]),
  // 데일리 잭팟 기계(웹 시안에서 배경·빛살 없이 투명하게 뽑은 600×740 의 2배 그림): 빈 릴 창 기계와 유리 덮개
  // 같은 크기로 겹치는 움직임 층: 켜진 전구 세 박자, JACKPOT 글자 모양
  ...['machine', 'glass', 'bulbs-0', 'bulbs-1', 'bulbs-2', 'jack-mask'].flatMap((n) => [600, 1200].map((w) => [`assets/img/jackpot/${n}-${w}.webp`, w, 600 / 740])),
  // 등급 판(네온·상금 숫자 없음)과 네온 테만: 360×304 의 2배 그림을 360 폭으로
  ...['grand', 'major', 'minor', 'mini'].flatMap((n) => ['meter', 'neon', 'pill'].map((k) => [`assets/img/jackpot/${k}-${n}.webp`, 360, 360 / 304])),
  // 콜렉트 보너스 연출: 게임 로비의 COLLECT BONUS 판(받을 수 있음·기다림)과 로비 칩
  ...['plate', 'plate-wait'].map((n) => [`assets/img/collect/${n}.webp`, 732, 1464 / 512]),
  ['assets/img/collect/chip.webp', 112, 1],
  // peerage 방패(6등급, 1단계)
  ...['bronze', 'silver', 'sapphire', 'ruby', 'royalgold', 'diamond'].map((t) => [`assets/img/peerage/${t}.webp`, 160, 1]),
  // 새 로비 배경(층 묶음 1–3F, 4–6F, 7–9F, 10F) 2880×1080
  ...[1, 2, 3, 4].flatMap((i) => [960, 1920].map((w) => [`assets/img/bg/aurora-${i}-${w}.webp`, w, 2880 / 1080])),
  ['assets/img/brand/app-icon-128.webp', 128, 1],
  ['assets/img/brand/vglobal-logo.webp', 500, 500 / 310],
  // 스토어 홍보 화면(16:9): 슬롯 안 화면(잭팟 당첨, 럭키 타임)
  ...['jackpot', 'lucky-time'].flatMap((n) => [
    [`assets/img/features/${n}-960.webp`, 960, 16 / 9],
    [`assets/img/features/${n}-1600.webp`, 1600, 16 / 9],
  ]),
  // 웹 시안(Popup Lab)의 새 UI 팝업 안쪽(닉네임을 바꿔 찍음, 940×506)
  ...['ranking', 'gifts', 'messages'].flatMap((n) => [960, 1600].map((w) => [`assets/img/features/${n}-${w}.webp`, w, 940 / 506])),
  // 웹 시안의 새 로비(1600×720 무대 전체): 층 화면, 럭키 타임 표시
  ...['lobby-floors', 'lobby-lucky'].flatMap((n) => [960, 1600].map((w) => [`assets/img/features/${n}-${w}.webp`, w, 1600 / 720])),
];


for (const [file, width, ratio] of WEBP) {
  test(`${file} is ${width}px wide with ratio ${ratio.toFixed(3)}`, () => {
    const size = webpSize(readFileSync(file));
    assert.equal(size.width, width);
    assert.ok(Math.abs(size.width / size.height - ratio) / ratio < 0.01, `${size.width}×${size.height}`);
  });
}

test('all 47 floor slots have a 273×282 tile', () => {
  assert.equal(SLOT_LIST.length, 47);
  for (const { slug } of SLOT_LIST) assert.deepEqual(webpSize(readFileSync(`assets/img/slots/${slug}.webp`)), { width: 273, height: 282 }, slug);
});

test('PNG icons have the declared sizes', () => {
  for (const [file, px] of [['favicon-32', 32], ['icon-192', 192], ['icon-512', 512], ['apple-touch-icon', 180]]) {
    assert.deepEqual(pngSize(readFileSync(`assets/img/brand/${file}.png`)), { width: px, height: px });
  }
});

test('the Daily Jackpot machine keeps a transparent background (no rays, no lobby behind it)', () => {
  // 그림 네 귀퉁이가 투명해야 한다: WebP 의 ALPH 덩어리가 있고, 확장 헤더의 알파 표시가 켜져 있다
  const buf = readFileSync('assets/img/jackpot/machine-600.webp');
  assert.ok(buf.includes(Buffer.from('ALPH')), 'machine-600.webp has no alpha chunk');
});

test('official Google Play badge, social image and favicon exist', () => {
  assert.ok(pngSize(readFileSync('assets/img/badges/google-play-en.png')).width >= 500);
  assert.ok(existsSync('assets/img/og/og-golden-hour.jpg'));
  assert.equal(readFileSync('favicon.ico').readUInt16LE(2), 1); // ICO type 1
});
