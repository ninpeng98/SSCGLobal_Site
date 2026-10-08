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

// 데일리 잭팟 기계를 배경·빛살 없이 투명하게 뽑는다. 움직이는 부분은 층을 나눠 뽑고 사이트에서 CSS 로 움직인다.
// jp_machine_base: 릴 창을 비우고 간판 전구를 모두 끈 기계 / jp_machine_glass: 릴 위에 덮이는 유리 반사와 가운데 줄
// jp_bulbs_0~2: 켜진 전구만(시안처럼 세 개 중 하나씩 켜지며 돈다) / jp_jack_mask: JACKPOT 글자 모양(빛 스침을 글자 안으로 가둔다)
// jp_meter_<등급>: 네온 테·이름표·상금 숫자를 뺀 등급 판 / jp_neon_<등급>: 네온 테만(밝기를 바꿔 숨 쉬게) / jp_pill_<등급>: 이름표만(맨 위)
const MACHINE_FRAME = [-300, -368, 600, 740];
const METER_FRAME = [-180, -152, 360, 304];

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
    const [, , , top, rw] = mc.children;
    const bulbs = top.children.filter((c) => typeof c.set === 'function');
    const jack = top.children[1];
    const shine = top.children.at(-1);
    const grab = (target, [x, y, w, h]) => K.app.renderer.extract.canvas({
      target, frame: new PIXI.Rectangle(x, y, w, h), resolution: 2, clearColor: [0, 0, 0, 0],
    }).toDataURL('image/png');
    const show = (list, visible) => list.forEach((o) => { o.visible = visible; });
    const out = {};
    // 기계: 심볼(2)·유리(5)·가운데 줄(7)·릴 입자(8)를 숨기고 전구는 모두 끈다(빛 스침도 숨김)
    show([rw.children[2], rw.children[5], rw.children[7], rw.children[8], shine], false);
    bulbs.forEach((b) => b.set(false));
    out.jp_machine_base = grab(mc, MACHINE_FRAME);
    // 유리와 가운데 줄만
    show(mc.children, false);
    rw.visible = true;
    show(rw.children, false);
    show([rw.children[5], rw.children[7]], true);
    out.jp_machine_glass = grab(mc, MACHINE_FRAME);
    // 켜진 전구만(시안: (i + phase) % 3 === 0 인 전구가 켜진다)
    rw.visible = false;
    top.visible = true;
    show(top.children, false);
    for (let phase = 0; phase < 3; phase += 1) {
      bulbs.forEach((b, i) => { const on = (i + phase) % 3 === 0; b.visible = on; b.set(on); });
      out[`jp_bulbs_${phase}`] = grab(mc, MACHINE_FRAME);
    }
    // JACKPOT 글자만
    show(top.children, false);
    jack.visible = true;
    out.jp_jack_mask = grab(mc, MACHINE_FRAME);
    // 등급 판(GRAND, MAJOR, MINOR, MINI): 판·이름표·심볼만 / 네온 테만
    ['grand', 'major', 'minor', 'mini'].forEach((name, i) => {
      const m = meters[i];
      show(m.children, true);
      show([m.children[0], m.children[2], m.children[3], m.children[4], m.children[8]], false);
      out[`jp_meter_${name}`] = grab(m, METER_FRAME);
      show(m.children, false);
      m.children[2].visible = true;
      m.children[2].alpha = 1;
      out[`jp_neon_${name}`] = grab(m, METER_FRAME);
      // 이름표(GRAND 등)는 시안처럼 네온 테 위에 놓이도록 따로
      show(m.children, false);
      m.children[4].visible = true;
      out[`jp_pill_${name}`] = grab(m, METER_FRAME);
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
