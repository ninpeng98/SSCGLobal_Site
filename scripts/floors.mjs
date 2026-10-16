// 로비 층 구성. 출처: 클라이언트 레포 origin/develop docs/tools/popup-lab/newlobby/data.js
// (운영 DB floors·floors_games 를 읽어 만든 값, 2026-10-05. 토너먼트 층·포커 층은 빠져 있다)
// 층은 레벨이 아니라 보유 칩(minChip)으로 열린다. 아이콘 원본: 클라이언트 Assets/Texture/TEST/<icon>
export const GAMES = {
  1: { name: 'Treasure Island', icon: '01_treasureisland.png' },
  2: { name: 'Stone Age', icon: '02_stoneage.png' },
  3: { name: 'Gangsters Poker', icon: '03_gangsterspoker.png' },
  4: { name: 'Golden Fruits', icon: '04_goldenfruits.png' },
  5: { name: 'Ranch Story', icon: '05_ranchstory.png' },
  6: { name: 'Fairy Garden', icon: '06_fairygarden.png' },
  7: { name: 'Magical Spin', icon: '07_magicalspin.png' },
  9: { name: 'Head Butt', icon: '09_headbutt.png' },
  10: { name: 'Halloween Party', icon: '10_halloweenparty.png' },
  11: { name: 'Money Fever', icon: '11_moneyfever.png' },
  12: { name: 'Western Ranch Story', icon: '12_westernrancg.png' },
  13: { name: 'New Fairy Garden', icon: '13_newfairygarden.png' },
  15: { name: 'Stone Age 2', icon: '15_stoneage2.png' },
  16: { name: 'Pirate Ship', icon: '16_pirateship.png' },
  17: { name: 'Cookie Pop', icon: '17_cookiepop.png' },
  19: { name: 'Gold Mine', icon: '19_goldmine.png' },
  21: { name: 'Blue Sky', icon: '21_bluesky.png' },
  23: { name: 'UFO Panic', icon: '23_ufopanic.png' },
  24: { name: 'Dancing Robot', icon: '24_dancingrobot.png' },
  25: { name: 'Fire Fighter', icon: '25_firefighter.png' },
  26: { name: 'Aladdin', icon: '26_aladdin.png' },
  27: { name: 'Hola! Amigo', icon: '27_holaamigo.png' },
  29: { name: 'Ghost Town', icon: '29_dghosttown.png' },
  30: { name: 'Beijing Opera', icon: '30_beijingopera.png' },
  31: { name: 'Excalibur', icon: '31_excalibur.png' },
  32: { name: 'Jewelry Fever', icon: '32_jewelryfever.png' },
  33: { name: 'Panorama Japan', icon: '33_panoramajapan.png' },
  34: { name: 'Slots Gang', icon: '34_slotgang.png' },
  35: { name: 'Slot Wars', icon: '35_slotwars.png' },
  36: { name: 'Highway Star', icon: '36_highwaystar.png' },
  38: { name: 'Curse of the Pharaohs', icon: '38_curseofthepharaohs.png' },
  39: { name: 'Joyful Circus', icon: '39_circus.png' },
  40: { name: 'Lady Spy', icon: '40_ladyspy.png' },
  41: { name: "Baker's Oven", icon: '41_bakersoven.png' },
  43: { name: 'Farm Day', icon: '43_farmday.png' },
  46: { name: 'Aloha', icon: '46_aloha.png' },
  47: { name: 'Beer Fest', icon: '47_beerfest.png' },
  48: { name: 'Zombie Hunter', icon: '48_zombiehunter.png' },
  49: { name: 'Blue Hole', icon: '49_bluehall.png' },
  51: { name: 'Princess in Love', icon: '51_princessinlove.png' },
  52: { name: 'Halloween Witch', icon: '52_halloweenwitch.png' },
  54: { name: 'Dancing Robot 2', icon: '54_dancingrobot2.png' },
  55: { name: 'Excalibur 2', icon: '55_excalibur2.png' },
  56: { name: 'Christmas Miracle', icon: '56_christmasmiracle.png' },
  57: { name: 'Space Warp', icon: '57_spacewarp.png' },
  59: { name: 'Titan', icon: '59_titan.png' },
  60: { name: 'Fast Food Holic', icon: '60_fastfoodholic.png' },
};

export const FLOORS = [
  { floor: 1, minChip: 0, minBet: 50000, games: [1, 48, 2, 3, 38, 6, 52] },
  { floor: 2, minChip: 5000000, minBet: 100000, games: [15, 49, 40, 23, 57, 31] },
  { floor: 3, minChip: 10000000, minBet: 200000, games: [24, 60, 55, 46, 51] },
  { floor: 4, minChip: 50000000, minBet: 1000000, games: [21, 59, 30, 33] },
  { floor: 5, minChip: 100000000, minBet: 1200000, games: [29, 34, 35, 25, 12] },
  { floor: 6, minChip: 250000000, minBet: 5000000, games: [27, 36, 39, 41] },
  { floor: 7, minChip: 500000000, minBet: 10000000, games: [47, 26, 56, 17] },
  { floor: 8, minChip: 5000000000, minBet: 100000000, games: [54, 7, 10, 9] },
  { floor: 9, minChip: 7500000000, minBet: 150000000, games: [43, 4, 11, 13] },
  { floor: 10, minChip: 10000000000, minBet: 120000000, games: [5, 16, 19, 32] },
];

/** 'Hola! Amigo' → 'hola-amigo', "Baker's Oven" → 'bakers-oven' */
export function slugOf(name) {
  return name.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** 층에 놓인 모든 슬롯 [{ id, name, slug, icon, floor }] (층 순서대로) */
export const SLOT_LIST = FLOORS.flatMap(({ floor, games }) => games.map((id) => ({ id, ...GAMES[id], slug: slugOf(GAMES[id].name), floor })));

// node scripts/floors.mjs → "slug icon" 줄(빌드 스크립트용)
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const s of SLOT_LIST) console.log(`${s.slug} ${s.icon.replace(/\.png$/, '')}`);
}
