// index.html 의 층 섹션 무대(<!-- floors:start --> ~ <!-- floors:end -->)를 scripts/floors.mjs 에서 만든다.
// 사용: node scripts/render-floors.mjs  (index.html 을 고쳐 쓴다. 단위 테스트가 둘이 같은지 본다)
import { readFileSync, writeFileSync } from 'node:fs';
import { FLOORS, GAMES, slugOf } from './floors.mjs';
import { shortChips } from '../assets/js/lib/floors.js';

export const FLOORS_START = '<!-- floors:start -->';
export const FLOORS_END = '<!-- floors:end -->';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
const I = '          '; // 들여쓰기(무대가 놓이는 자리)

function floorItem({ floor, minChip, minBet, games }) {
  const req = minChip === 0 ? 'Open from the start' : `Unlocks at <b>${shortChips(minChip)}</b> chips`;
  const slots = games.map((id) => {
    const { name } = GAMES[id];
    return `${I}      <li><img src="assets/img/slots/${slugOf(name)}.webp" alt="" width="273" height="282" loading="lazy" decoding="async"><span class="floor__name">${esc(name)}</span></li>`;
  });
  return [
    `${I}  <li class="floor${floor === 1 ? ' is-current' : ''}" id="floor-${floor}" data-floor="${floor}">`,
    `${I}    <p class="floor__plate"><span class="floor__label">Floor</span> <span class="floor__no">${floor}</span> <span class="floor__bet">Min bet <b>${shortChips(minBet)}</b></span></p>`,
    `${I}    <p class="floor__req">${req}</p>`,
    `${I}    <ul class="floor__slots">`,
    ...slots,
    `${I}    </ul>`,
    `${I}  </li>`,
  ].join('\n');
}

export function renderFloors() {
  const bg = [1, 2, 3, 4].map((i) => `${I}  <img data-bg="${i}" src="assets/img/bg/aurora-${i}-960.webp" srcset="assets/img/bg/aurora-${i}-960.webp 960w, assets/img/bg/aurora-${i}-1920.webp 1920w" sizes="(min-width: 1024px) 760px, 100vw" alt="" width="1920" height="720" loading="lazy" decoding="async">`);
  const dots = FLOORS.map(({ floor }) => `${I}  <li data-dot="${floor}"${floor === 1 ? ' class="is-current"' : ''}></li>`);
  return [
    FLOORS_START,
    `${I}<div class="floors__stage" data-elevator data-current="1" tabindex="0" role="region" aria-label="Lobby floors. Swipe, or use the left and right arrow keys, to change floors.">`,
    `${I}<div class="floors__bg" aria-hidden="true">`,
    ...bg,
    `${I}</div>`,
    `${I}<ol class="elevator" aria-label="The ten floors of the lobby">`,
    ...FLOORS.map(floorItem),
    `${I}</ol>`,
    `${I}<ol class="floors__dots" aria-hidden="true">`,
    ...dots,
    `${I}</ol>`,
    `${I}</div>`,
    `${I}${FLOORS_END}`,
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const html = readFileSync('index.html', 'utf8');
  const a = html.indexOf(FLOORS_START);
  const b = html.indexOf(FLOORS_END);
  if (a < 0 || b < a) throw new Error('floors markers missing in index.html');
  writeFileSync('index.html', html.slice(0, a) + renderFloors() + html.slice(b + FLOORS_END.length));
  console.log('index.html floors updated');
}
