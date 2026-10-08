#!/usr/bin/env bash
# 사이트 주소(호스트)를 한 번에 바꾼다. 절대 주소는 HTML <head>, sitemap.xml, robots.txt, CNAME 에만 있다.
# 사용: scripts/set-domain.sh new.host.example   (현재 값은 CNAME 에서 읽는다)
# 바꾼 뒤 할 일(사람): GitHub Pages 설정의 Custom domain, DNS CNAME 레코드, Search Console 등록.
set -euo pipefail
cd "$(dirname "$0")/.."
NEW="${1:?usage: scripts/set-domain.sh <new-host>}"
if [[ ! "$NEW" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]]; then
  echo "invalid host: $NEW" >&2
  exit 2
fi
OLD="$(tr -d '[:space:]' < CNAME)"
if [[ "$OLD" == "$NEW" ]]; then
  echo "already $NEW"
  exit 0
fi
for f in index.html privacy-policy.html terms-of-service.html 404.html sitemap.xml robots.txt CNAME; do
  [[ -f "$f" ]] || continue
  if grep -qF "$OLD" "$f"; then
    OLD="$OLD" NEW="$NEW" perl -pi -e 's/\Q$ENV{OLD}\E/$ENV{NEW}/g' "$f"
    echo "updated $f"
  fi
done
