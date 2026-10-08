#!/usr/bin/env bash
# 클라이언트 저장소 원본과 받은 소재(assets/img/_incoming)를 사이트용 WebP·PNG·ICO·JPG 로 만든다.
# 원본 PNG 는 이 저장소에 넣지 않고, 결과만 커밋한다. 원본보다 크게 늘리지 않는다.
# 사용: CLIENT_REPO=/path/to/mazynga_unity_global scripts/build-images.sh
set -euo pipefail
cd "$(dirname "$0")/.."

CLIENT="${CLIENT_REPO:-/Users/ultramaker/Projects/work/mazynga/mazynga_unity_global}"
BRAND="$CLIENT/output/promo-video-kit/01_brand"
STORE="$CLIENT/output/promo-video-kit/02_store_screenshots"
UI="$CLIENT/output/promo-video-kit/03_ui_elements"
TILES="$CLIENT/Assets/Texture/TEST"
IN="assets/img/_incoming"
OUT="assets/img"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"/{hero,brand,slots,features,icons,reels,og,badges}

# webp SRC DST WIDTH [QUALITY]: 폭 WIDTH 로 줄여(비율 유지) WebP 로 저장. 원본이 더 작으면 원본 폭 그대로.
webp() {
  local src="$1" dst="$2" w="$3" q="${4:-82}" sw
  sw=$(sips -g pixelWidth "$src" | awk '/pixelWidth/{print $2}')
  if (( w > sw )); then w=$sw; fi
  cwebp -quiet -q "$q" -m 6 -alpha_q 90 -metadata none -resize "$w" 0 "$src" -o "$dst"
}

# 첫 화면·설치 섹션 키 아트
# 첫 화면 그림은 LCP 라서 품질 76(인코딩 노력 최대)으로 가볍게. 750 은 휴대폰(375px × 2배) 용
for w in 960 1440 1914; do webp "$BRAND/splash_wide_1914x822.png" "$OUT/hero/splash-wide-$w.webp" "$w" 76; done
for w in 600 750 900 1254; do webp "$BRAND/title_keyart_1254.png" "$OUT/hero/keyart-square-$w.webp" "$w" 76; done
for w in 960 1920; do webp "$BRAND/title_keyart_16x9_lastframe.png" "$OUT/hero/keyart-16x9-$w.webp" "$w" 80; done

# 릴: 정사각 키 아트의 가운데 릴 창(7)을 잘라 쓴다. 측정값: x 502, y 535, 244×435(양옆 금색 칸막이 제외, sips 는 y, x 순서)
sips --cropOffset 535 502 --cropToHeightWidth 435 244 "$BRAND/title_keyart_1254.png" --out "$TMP/seven.png" >/dev/null
webp "$TMP/seven.png" "$OUT/reels/seven.webp" 244 88

# 아이콘(받은 소재)
webp "$IN/icon_chip.png" "$OUT/icons/chip.webp" 152 88
webp "$IN/icon_crown_432.png" "$OUT/icons/crown.webp" 216 88
webp "$IN/icon_trophy.png" "$OUT/icons/trophy.webp" 256 85
webp "$IN/icon_gift.png" "$OUT/icons/gift.webp" 256 85
webp "$IN/extra_crown_chip_purple_1024.png" "$OUT/icons/crown-chip.webp" 256 85
webp "$IN/icon_lock_closed.png" "$OUT/icons/lock.webp" 64 90
cwebp -quiet -lossless -metadata none "$IN/coin_spin_sheet.png" -o "$OUT/icons/coin-sheet.webp"

# 슬롯 타일(로비 타일 273×282, 원본 크기 그대로)
while read -r slug src; do
  webp "$TILES/$src.png" "$OUT/slots/$slug.webp" 273 85
done <<'SLOTS'
golden-fruits 04_goldenfruits
cash-fever 18_cashfever
fairy-garden 06_fairygarden
aladdin 26_aladdin
excalibur 31_excalibur
titan 59_titan
treasure-island 01_treasureisland
curse-of-the-pharaohs 38_curseofthepharaohs
halloween-witch 52_halloweenwitch
christmas-miracle 56_christmasmiracle
zombie-hunter 48_zombiehunter
gangsters-poker 03_gangsterspoker
SLOTS

# 기능 화면(스토어 홍보 화면 — 새 UI 촬영본이 오면 Task 11 에서 바꾼다)
while read -r name src; do
  for w in 960 1600; do webp "$STORE/$src.png" "$OUT/features/$name-$w.webp" "$w" 80; done
done <<'SHOTS'
jackpot 01_titan_major_jackpot
floors 04_level_up_floors
lucky-time 05_excalibur_lucky_time
lobby 06_lobby_60_slots
SHOTS
webp "$UI/lucky_time_badge.png" "$OUT/features/lucky-time-badge.webp" 384 88

# 웹 시안(Popup Lab, 새 UI)에서 캡처해 _incoming 에 둔 팝업 화면(Task 11). 2배 해상도로 찍어 2080×1380 / 1400×1360 으로 잘랐다
while read -r name src; do
  for w in 960 1600; do webp "$IN/$src.png" "$OUT/features/$name-$w.webp" "$w" 80; done
done <<'LAB'
ranking shot_top25
gifts shot_gifts
messages shot_messages
LAB
for w in 700 1400; do webp "$IN/shot_time_bonus.png" "$OUT/features/time-bonus-$w.webp" "$w" 80; done

# 데일리 잭팟 기계: 클라이언트 세션의 투명 렌더가 있으면 그것을, 없으면 Popup Lab 캡처에서 기계 부분을 잘라 쓴다(임시)
if [[ -f "$IN/jackpot_machine.png" ]]; then
  webp "$IN/jackpot_machine.png" "$OUT/features/jackpot-machine.webp" 880 88
else
  sips --cropOffset 26 440 --cropToHeightWidth 546 440 "$CLIENT/docs/tools/popup-lab/bake/jp2_grandwin.png" --out "$TMP/jackpot.png" >/dev/null
  webp "$TMP/jackpot.png" "$OUT/features/jackpot-machine.webp" 440 88
fi
# 잭팟 등급 심볼(GRAND 스페이드, MAJOR 하트, MINOR 다이아몬드, MINI 클로버)
for s in spade heart diamond clover; do
  webp "$CLIENT/Assets/Texture/UI/JackpotKit/sym_$s.png" "$OUT/icons/sym-$s.webp" 120 88
done

# 브랜드
webp "$BRAND/app_icon_round_1024.png" "$OUT/brand/app-icon-128.webp" 128 88
# 회사 로고: 2048×1536 흰 캔버스 가운데의 로고 부분만 자른다(x 790, y 630, 500×310). 사이트에서는 CSS 로 색을 뒤집어 흰 글자로 쓴다
sips --cropOffset 630 790 --cropToHeightWidth 310 500 "$BRAND/company_logo.png" --out "$TMP/logo.png" >/dev/null
webp "$TMP/logo.png" "$OUT/brand/vglobal-logo.webp" 500 90
sips -Z 32 "$BRAND/app_icon_round_1024.png" --out "$OUT/brand/favicon-32.png" >/dev/null
sips -Z 192 "$BRAND/app_icon_round_1024.png" --out "$OUT/brand/icon-192.png" >/dev/null
sips -Z 512 "$BRAND/app_icon_round_1024.png" --out "$OUT/brand/icon-512.png" >/dev/null
sips -Z 180 "$BRAND/app_icon_round_1024.png" --out "$OUT/brand/apple-touch-icon.png" >/dev/null
sips -Z 48 -s format ico "$BRAND/app_icon_round_1024.png" --out favicon.ico >/dev/null

# 공유 이미지 1200×630: 가로 키 아트를 높이 630 으로 줄이고 가운데를 자른다
sips --resampleHeight 630 "$BRAND/splash_wide_1914x822.png" --out "$TMP/og.png" >/dev/null
sips --cropToHeightWidth 630 1200 "$TMP/og.png" --out "$TMP/og-crop.png" >/dev/null
sips -s format jpeg -s formatOptions 85 "$TMP/og-crop.png" --out "$OUT/og/og-golden-hour.jpg" >/dev/null

echo "images built into $OUT"
