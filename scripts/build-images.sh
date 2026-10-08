#!/usr/bin/env bash
# 클라이언트 저장소 원본과 받은 소재(assets/img/_incoming)를 사이트용 WebP·PNG·ICO·JPG 로 만든다.
# 원본 PNG 는 이 저장소에 넣지 않고, 결과만 커밋한다. 원본보다 크게 늘리지 않는다.
# 사용: CLIENT_REPO=/path/to/mazynga_unity_global [CLIENT_REF=origin/develop] scripts/build-images.sh
# 새 로비 배경·peerage 방패처럼 원격 develop 에만 있는 원본은 CLIENT_REF 에서 git show 로 꺼낸다(작업 폴더는 건드리지 않음).
# 웹 시안 캡처(_incoming/lab_*, jp_*)는 scripts/lab-capture.mjs 로 먼저 만든다.
set -euo pipefail
cd "$(dirname "$0")/.."

CLIENT="${CLIENT_REPO:-/Users/ultramaker/Projects/work/mazynga/mazynga_unity_global}"
REF="${CLIENT_REF:-origin/develop}"
BRAND="$CLIENT/output/promo-video-kit/01_brand"
STORE="$CLIENT/output/promo-video-kit/02_store_screenshots"
UI="$CLIENT/output/promo-video-kit/03_ui_elements"
TILES="$CLIENT/Assets/Texture/TEST"
IN="assets/img/_incoming"
OUT="assets/img"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"/{hero,brand,slots,features,icons,reels,og,badges,jackpot,peerage,bg}

# from_ref PATH: CLIENT_REF 의 파일을 임시 폴더로 꺼내고 그 경로를 출력
from_ref() {
  local dst="$TMP/ref-$(basename "$1")"
  git -C "$CLIENT" show "$REF:$1" > "$dst"
  echo "$dst"
}

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
webp "$IN/icon_lock_closed.png" "$OUT/icons/lock.webp" 64 90
cwebp -quiet -lossless -metadata none "$IN/coin_spin_sheet.png" -o "$OUT/icons/coin-sheet.webp"

# 슬롯 타일(로비 타일 273×282, 원본 크기 그대로): 10개 층에 놓인 47개 전부(scripts/floors.mjs)
while read -r slug src; do
  webp "$TILES/$src.png" "$OUT/slots/$slug.webp" 273 85
done < <(node scripts/floors.mjs)

# 기능 화면(스토어 홍보 화면): 슬롯 안 화면은 이번 UI 개편 대상이 아니라 그대로 쓴다
while read -r name src; do
  for w in 960 1600; do webp "$STORE/$src.png" "$OUT/features/$name-$w.webp" "$w" 80; done
done <<'SHOTS'
jackpot 01_titan_major_jackpot
lucky-time 05_excalibur_lucky_time
SHOTS
webp "$UI/lucky_time_badge.png" "$OUT/features/lucky-time-badge.webp" 384 88

# 웹 시안의 새 UI 팝업(랭킹·선물함·메시지함): 닉네임을 바꿔 찍고 팝업 안쪽만 자른 것(940×506 의 2배)
while read -r name src; do
  for w in 960 1600; do webp "$IN/$src.png" "$OUT/features/$name-$w.webp" "$w" 80; done
done <<'LAB'
ranking lab_top25
gifts lab_gifts
messages lab_messages
LAB
# 웹 시안의 새 로비·콜렉트 보너스·peerage(scripts/lab-capture.mjs 가 2배 해상도로 찍은 것)
while read -r name src sizes; do
  for w in $sizes; do webp "$IN/$src.png" "$OUT/features/$name-$w.webp" "$w" 80; done
done <<'LAB2'
lobby-floors lab_lobby 960 1600
lobby-lucky lab_lucky 960 1600
LAB2

# 데일리 잭팟 기계: 웹 시안에서 배경·빛살 없이 투명하게 뽑은 빈 릴 창 기계와, 릴 위에 덮는 유리·가운데 줄
# 움직이는 부분은 층을 나눠 뽑았다: 켜진 전구(세 박자), JACKPOT 글자 모양(빛 스침 가림), 등급 판 네온 테
while read -r name src; do
  for w in 600 1200; do webp "$IN/$src.png" "$OUT/jackpot/$name-$w.webp" "$w" 86; done
done <<'JP'
machine jp_machine_base
glass jp_machine_glass
bulbs-0 jp_bulbs_0
bulbs-1 jp_bulbs_1
bulbs-2 jp_bulbs_2
jack-mask jp_jack_mask
JP
for n in grand major minor mini; do
  webp "$IN/jp_meter_$n.png" "$OUT/jackpot/meter-$n.webp" 360 86
  webp "$IN/jp_neon_$n.png" "$OUT/jackpot/neon-$n.webp" 360 86
  webp "$IN/jp_pill_$n.png" "$OUT/jackpot/pill-$n.webp" 360 88
done
# 잭팟 심볼(GRAND 스페이드, MAJOR 하트, MINOR 다이아몬드, MINI 클로버, 작은 상금 체리): 웹 시안 릴과 같은 252×252 그림
# (둘레 여백이 시안 그대로라 같은 칸 크기에서 시안과 같은 크기로 보인다)
for s in Spade Heart Diamond Clover Cherry; do
  webp "$(from_ref "docs/tools/popup-lab/src/jackpot/Icon$s.png")" "$OUT/jackpot/sym-$(echo "$s" | tr '[:upper:]' '[:lower:]').webp" 160 88
done

# 콜렉트 보너스 연출: 새 로비의 COLLECT BONUS 판(빈 판, 글자는 사이트가 얹는다)과 로비 칩
mkdir -p "$OUT/collect"
webp "$(from_ref docs/tools/popup-lab/src/lobby/collect_plate_purple.png)" "$OUT/collect/plate.webp" 732 88
webp "$(from_ref docs/tools/popup-lab/src/lobby/collect_plate_purple_wait.png)" "$OUT/collect/plate-wait.webp" 732 88
webp "$(from_ref docs/tools/popup-lab/src/lobby/chip_crown_front.png)" "$OUT/collect/chip.webp" 112 90

# peerage 방패(6등급의 1단계)
for t in bronze silver sapphire ruby royalgold diamond; do
  webp "$(from_ref "Assets/Texture/UI/Peerage/peer_${t}1.png")" "$OUT/peerage/$t.webp" 160 88
done

# 새 로비 배경(몽환적인 빛 물결). 게임은 층 묶음 1–3F, 4–6F, 7–9F, 10F 마다 bg_1~4 를 쓴다
for i in 1 2 3 4; do
  src="$(from_ref "Assets/Resources/Lobby/bg_$i.jpg")"
  for w in 960 1920; do webp "$src" "$OUT/bg/aurora-$i-$w.webp" "$w" 70; done
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
