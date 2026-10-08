import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FLOORS, GAMES } from '../../scripts/floors.mjs';
import { renderFloors, FLOORS_START, FLOORS_END } from '../../scripts/render-floors.mjs';
import { shortChips, floorForProgress, bgGroup } from '../../assets/js/lib/floors.js';

test('shortChips writes chip amounts the way the lobby does', () => {
  assert.equal(shortChips(0), '0');
  assert.equal(shortChips(50000), '50K');
  assert.equal(shortChips(1200000), '1.2M');
  assert.equal(shortChips(5000000), '5M');
  assert.equal(shortChips(250000000), '250M');
  assert.equal(shortChips(7500000000), '7.5B');
  assert.equal(shortChips(10000000000), '10B');
});

test('floorForProgress spreads ten floors over the scroll', () => {
  assert.equal(floorForProgress(0, 10), 1);
  assert.equal(floorForProgress(1, 10), 10);
  assert.equal(floorForProgress(0.05, 10), 1); // 0.45 칸 → 1층
  assert.equal(floorForProgress(0.12, 10), 2);
  assert.equal(floorForProgress(-0.2, 10), 1);
  assert.equal(floorForProgress(1.3, 10), 10);
});

test('bgGroup follows the game: 1–3F, 4–6F, 7–9F, 10F', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(bgGroup), [1, 1, 1, 2, 2, 2, 3, 3, 3, 4]);
});

test('the client floor data has 10 floors, 47 slots, and chip marks that only go up', () => {
  assert.equal(FLOORS.length, 10);
  assert.equal(FLOORS.flatMap((f) => f.games).length, 47);
  for (let i = 1; i < FLOORS.length; i += 1) assert.ok(FLOORS[i].minChip > FLOORS[i - 1].minChip);
  for (const f of FLOORS) for (const id of f.games) assert.ok(GAMES[id], `game ${id}`);
});

test('index.html carries the floors exactly as rendered from the client data', () => {
  const html = readFileSync('index.html', 'utf8');
  const a = html.indexOf(FLOORS_START);
  const b = html.indexOf(FLOORS_END);
  assert.ok(a > 0 && b > a, 'floors markers missing');
  assert.equal(html.slice(a, b + FLOORS_END.length), renderFloors());
});

test('every floor lists its real slots by name, in lobby order', () => {
  const blocks = renderFloors().split('<li class="floor"').slice(1);
  assert.equal(blocks.length, FLOORS.length);
  for (const [i, f] of FLOORS.entries()) {
    const block = blocks[i];
    assert.ok(block.includes(`data-floor="${f.floor}"`));
    const names = [...block.matchAll(/<span class="floor__name">([^<]+)<\/span>/g)].map((m) => m[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&'));
    assert.deepEqual(names, f.games.map((id) => GAMES[id].name), `floor ${f.floor}`);
  }
});
