// 클라이언트 웹 시안(Popup Lab)에서 사이트용 그림을 뽑아 assets/img/_incoming/ 에 PNG 로 저장한다.
// 시안 파일과 시안의 bake 폴더에는 아무것도 쓰지 않는다(브라우저 안에서 그려 받은 그림만 저장).
//
// 준비: 클라이언트 레포의 최신 시안 서버를 8767 포트로 띄운다.
//   PORT=8767 node <클라이언트 레포 또는 작업 트리>/docs/tools/popup-lab/server.js
// 실행: node scripts/lab-capture.mjs [이름 ...]   (이름을 주지 않으면 전부)
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const LAB = process.env.LAB_URL || 'http://127.0.0.1:8767/';
const OUT = new URL('../assets/img/_incoming/', import.meta.url);

// 장면 전체·일부를 정해진 시각에 멈춰 2배 해상도로 자른다. rect 는 1600×720 무대 좌표.
// film: 움직이는 장면(보너스 받기)은 lab.film 이 찍은 그림을 쓴다. 왼쪽 위 시각 글자가 찍히므로 위로 20만큼 더 찍고 잘라 낸다.
const SHOTS = {
  'lab_lobby': { key: 'nlHome', t: 2.5, rect: [0, 0, 1600, 720] },
  'lab_lucky': { key: 'nlLucky', t: 2.5, rect: [0, 0, 1600, 720] },
  'lab_collect_ready': { key: 'nlReady', t: 2.5, rect: [400, 380, 800, 340] },
  'lab_collect_paid': { key: 'nlCollect', t: 2.5, rect: [400, 380, 800, 340], film: true },
  'lab_peerage': { key: 'rankPeerage', t: 2.5, rect: [328, 68, 944, 604] },
};

// 데일리 잭팟 기계를 배경·빛살 없이 투명하게 뽑는다.
// base: 릴 창을 비운 기계 / glass: 릴 위에 덮이는 유리 반사와 가운데 줄 / meter-*: 등급 판(상금 숫자 제외)
const MACHINE_FRAME = [-300, -368, 600, 740];
const METER_FRAME = [-180, -152, 360, 304];

async function shot(page, { key, t, rect, film }) {
  return page.evaluate(async ({ key, t, rect, film }) => {
    if (film) {
      const [x, y, w, h] = rect, PAD = 20;
      const sheet = await window.lab.film(key, [t], [x, y - PAD, w, h + PAD], 1, 2);
      window.lab.unzoom();
      window.lab.setSpeed(1);
      const out = Object.assign(document.createElement('canvas'), { width: w * 2, height: h * 2 });
      out.getContext('2d').drawImage(sheet, 0, PAD * 2, w * 2, h * 2, 0, 0, w * 2, h * 2);
      return out.toDataURL('image/png');
    }
    await window.lab.film(key, [t], [0, 0, 1600, 720], 1, 1);
    window.lab.unzoom();
    window.lab.zoom(...rect);
    const url = document.querySelector('#zoomv canvas').toDataURL('image/png');
    window.lab.unzoom();
    window.lab.setSpeed(1);
    return url;
  }, { key, t, rect, film });
}

async function jackpotParts(page) {
  return page.evaluate(async ({ MACHINE_FRAME, METER_FRAME }) => {
    const { lab, PIXI } = window;
    const K = lab.K;
    lab.S.auto = false;
    lab.play('jpGrand');
    await new Promise((r) => setTimeout(r, 1500));
    lab.setSpeed(0);
    const pc = K.sceneLayer.children.at(-1).children[1];
    const meters = pc.children.slice(2, 6);
    const mc = pc.children[6];
    const rw = mc.children[4];
    const grab = (target, [x, y, w, h]) => K.app.renderer.extract.canvas({
      target, frame: new PIXI.Rectangle(x, y, w, h), resolution: 2, clearColor: [0, 0, 0, 0],
    }).toDataURL('image/png');
    const keep = (list, visible) => list.forEach((o) => { o.visible = visible; });
    const out = {};
    // 릴 창을 비운 기계: 심볼(2)·유리(5)·가운데 줄(7)·릴 입자(8)를 숨긴다
    keep([rw.children[2], rw.children[5], rw.children[7], rw.children[8]], false);
    out['jp_machine_base'] = grab(mc, MACHINE_FRAME);
    // 유리 반사와 가운데 줄만: 기계의 나머지와 릴 창 바탕을 숨긴다
    keep(mc.children, false);
    rw.visible = true;
    keep(rw.children, false);
    keep([rw.children[5], rw.children[7]], true);
    out['jp_machine_glass'] = grab(mc, MACHINE_FRAME);
    // 등급 판 4개: 바깥 번짐(0)과 상금 숫자(8)를 숨긴다. 순서는 GRAND, MAJOR, MINOR, MINI
    ['grand', 'major', 'minor', 'mini'].forEach((name, i) => {
      const m = meters[i];
      keep([m.children[0], m.children[8]], false);
      out[`jp_meter_${name}`] = grab(m, METER_FRAME);
    });
    lab.setSpeed(1);
    return out;
  }, { MACHINE_FRAME, METER_FRAME });
}

const only = new Set(process.argv.slice(2));
const want = (name) => only.size === 0 || only.has(name);
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1700, height: 900 } });
await page.goto(LAB);
await page.waitForFunction(() => window.lab && window.PIXI, null, { timeout: 30_000 });
const save = (name, url) => {
  const file = new URL(`${name}.png`, OUT);
  writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  console.log(`saved ${file.pathname}`);
};
for (const [name, spec] of Object.entries(SHOTS)) {
  if (want(name)) save(name, await shot(page, spec));
}
if (want('jackpot')) {
  for (const [name, url] of Object.entries(await jackpotParts(page))) save(name, url);
}
await browser.close();
