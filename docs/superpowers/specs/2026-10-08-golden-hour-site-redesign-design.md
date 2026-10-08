# Golden Hour 홍보 사이트 리뉴얼 설계

- 작성일: 2026-10-08
- 브랜치: `claude/slot-game-site-redesign-9f68ce`
- 상태: 구현 완료. 구현 중 바뀐 점은 14절, 사용자 검토 후 2차 수정은 15절(15절이 앞 절보다 우선)

## 1. 배경과 목표

앱 이름이 "Social Casino2"에서 **"Golden Hour - Slots Casino"** 로 바뀌었다(Google Play 패키지 `site.vglobal.android.casinog`, 개발사 표기 Vglobal Co. Ltd.). 게임 클라이언트(`mazynga_unity_global`)도 다음 업데이트에서 UI를 새 디자인으로 바꾸는 중이다. 그런데 홍보 사이트(`sscgl.vglobal.site`, 이 저장소)는 아직 옛 이름과 옛 로고 이미지를 쓴다. 디자인도 2025년 초의 단순한 다크 테마 그대로다.

이 리뉴얼의 목표는 세 가지다.

1. 사이트 전체를 새 브랜드(이름·로고·색)로 바꾼다.
2. 요즘 모바일 슬롯 게임 홍보 사이트 수준의 연출을 넣는다. 화면을 꽉 채운 키 아트, 코인·빛 연출, 스크롤에 맞춘 연출이 여기에 해당한다.
3. 디자인 언어를 리뉴얼된 게임 클라이언트 UI와 맞춘다. 사이트에서 게임으로 넘어갔을 때 같은 제품으로 보여야 한다.

사이트가 하는 일은 그대로다. Play 스토어 설치로 이어지는 랜딩 페이지 역할을 하고, Play 스토어 등록에 필요한 개인정보처리방침·이용약관 페이지를 호스팅한다.

## 2. 결정 사항

### 사용자가 정한 것

| 항목 | 결정 |
|---|---|
| 도메인 | 당분간 `sscgl.vglobal.site`를 유지한다. 서브도메인은 바뀔 수 있으므로 쉽게 바꿀 수 있는 구조로 만든다 |
| 언어 | 영어만 쓴다(지금과 같음) |
| 게임 이미지 | 클라이언트 작업 세션("칭호 포인트 시안 작업")에 스펙을 주고 스크린샷·소재를 받는다 |
| 디자인 참고 | 슬롯을 뺀 UI는 `mazynga_unity_global`의 `develop` 브랜치를 참고한다 |
| 페이지 범위 | 퀄리티가 좋기만 하면 어느 쪽이든 괜찮다고 했고, 아래 기본값을 승인했다 |
| 디자인 방향 | **C안: 게임 UI형 + 첫 화면 슬롯 릴 연출** |
| JS 플러그인 | 보안 문제가 없으면 써도 된다고 했다. 조사 결과는 7.3절에 있다 |
| 설계 ①②③ | 페이지 구성, 시각·연출, 기술·소재·검증 모두 승인했다 |

### 내가 정한 기본값

| 항목 | 기본값 | 이유 |
|---|---|---|
| 페이지 범위 | 랜딩 한 페이지와 정책 페이지 3개(개인정보처리방침·이용약관·404) | 운영 중 갱신할 거리가 없다. 연출을 한 페이지에 집중할 수 있다 |
| 호스팅 | GitHub Pages 정적 사이트, 빌드 도구 없음 | 지금 구조(`CNAME`, `ninpeng98/SSCGLobal_Site`)와 같아서 배포 방식이 바뀌지 않는다 |
| 화면 테마 | 어두운 화면 하나로 고정한다(밝은 화면 없음) | 카지노 브랜드의 톤이다. 섹션마다 밝고 어두움이 뒤바뀌지 않게 한다 |
| taste-skill | 설치하지 않는다. 맞는 규칙만 골라 12절의 점검 목록으로 쓴다 | 기본 기술 구성(React·Tailwind)이 우리 구조와 맞지 않는다 |

## 3. 범위

**포함**

- `index.html`을 처음부터 다시 만든다.
- `privacy-policy.html`, `terms-of-service.html`, `404.html`에 새 디자인을 입힌다.
- 메타 태그, 구조화 데이터, 사이트맵, 파비콘·앱 아이콘을 바꾼다.
- 외부 라이브러리를 저장소에 직접 넣는다(vendoring). 글꼴은 직접 호스팅한다.
- CSP(Content-Security-Policy, 브라우저가 실행·로드할 수 있는 출처를 제한하는 규칙)를 적용한다.
- 도메인 일괄 교체 스크립트와 점검 스크립트를 만든다.

**제외**

- 다국어 지원
- iOS 앱 스토어 배지(아직 iOS 출시 없음)
- 슬롯 목록 별도 페이지, 뉴스·이벤트 페이지
- 법률 문서 조항 변경. 앱 이름과 회사명만 바꾼다(10절)
- 배포(push·PR 생성). 사용자가 요청할 때 진행한다

## 4. 페이지 구성

### 4.1 메인 페이지(`index.html`)

섹션은 위에서 아래 순서다. 같은 배치를 두 번 쓰지 않는다. 설치 버튼 문구는 **"Get it on Google Play"**(공식 배지) 하나로 통일한다.

| # | 섹션(id) | 내용 | 배치 |
|---|---|---|---|
| 0 | 상단 메뉴 | 앱 아이콘 + "Golden Hour", 메뉴(Slots · Features · FAQ), 작은 공식 배지 | 스크롤해도 따라오는 막대. 높이 64~72px |
| 1 | 첫 화면 `#top` | 키 아트 배경, 그림 속 777 릴 자리에 실제로 도는 릴을 겹침, 제목, 한 줄 설명(20단어 이하), 공식 배지, 18+ 표시 | 화면 꽉 채움(`min-height: 100dvh`) |
| 2 | 60+ 3D 슬롯 `#slots` | 대표 슬롯 카드 8~12장을 3D로 넘겨 보기. 각 카드에 슬롯 이름과 테마 태그(Classic·Fantasy·Adventure·Seasonal·Character) | 가로 넘김(coverflow) |
| 3 | 럭키 타임 & 잭팟 `#lucky-time` | 빛이 스치는 잭팟 간판, 자릿수별로 굴러 올라가는 숫자, 럭키 타임 배지·설명 | 좌우 분할 |
| 4 | 층 잠금 해제 `#floors` | 1층→5층으로 올라가는 엘리베이터식 그림. 층마다 자물쇠가 열림 | 세로 진행. 데스크톱은 화면 고정 |
| 5 | 랭킹 & 소셜 `#social` | Top 25, 친구, 선물, 메시지를 실제 스크린샷으로 | 크기가 다른 칸을 섞은 격자. 칸 수는 내용 수(4개)와 같게 |
| 6 | 4시간 칩 보너스 `#bonus` | 4시간 타이머 원이 차오르고 칩이 튀어나옴 | 가운데 강조 |
| 7 | 제작팀 | "10년 이상 소셜 카지노 게임을 만들어 온 팀" 한 줄과 Vglobal 로고 | 얇은 띠 |
| 8 | FAQ `#faq` | 아래 4.3절의 질문 6개 | 접었다 펴는 목록(`<details>`) |
| 9 | 마지막 설치 유도 `#download` | 키 아트와 큰 공식 배지 | 화면 폭 전체 |
| 10 | 하단 | 정책 링크, 지원 이메일, 중요 공지 문구(10절), © 2026 Vglobal Co., Ltd. | 다단, 모바일은 한 단 |

### 4.2 문구 초안(영어)

Play 스토어 설명에 있는 사실만 쓴다. 지금 사이트의 "Join millions of players"는 실제 다운로드 수(1만+)와 맞지 않으므로 뺀다. 최종 문구는 구현 단계에서 다듬는다.

| 위치 | 초안 |
|---|---|
| 첫 화면 H1 | `Golden Hour – Slots Casino`. 키 아트의 로고 그림을 쓰는 경우 `<h1>` 안의 `<img alt>`로 넣는다 |
| 첫 화면 설명 | `Spin 60+ unique 3D slot machines, catch Lucky Time boosts and chase jackpots. Free to play.` |
| 슬롯 | `60+ Unique 3D Slots` / `From classic sevens to fantasy, adventure and seasonal themes.` |
| 럭키 타임 | `Lucky Time & Jackpots` / `Limited-time boosts and bonus chances. Feel the rush when the Major Jackpot lands.` |
| 층 | `Level Up. Unlock New Floors.` / `Climb higher to open new slot machines and new challenges.` |
| 소셜 | `Rankings & Social Play` / `Top Win, Daily Top 25, friends, messages and gifts.` |
| 보너스 | `Bonus Chips Every 4 Hours` |
| 제작팀 | `Crafted by a team with 10+ years in social casino games.` |
| 마지막 | `Your Golden Hour starts now.` |

### 4.3 FAQ 질문

1. Is Golden Hour real-money gambling? No. 오락 목적이고 현금이나 상품을 얻을 수 없다.
2. Is it free? 무료이고, 인앱 구매가 있다.
3. Who can play? 만 18세 이상이다.
4. Which devices are supported? Android(Google Play)다.
5. How do I contact support? 지원 이메일 `vglobalinfo24@gmail.com`이다.
6. How do I delete my data? 개인정보처리방침 페이지로 연결한다.

FAQ 구조화 데이터(FAQPage)는 넣지 않는다. 2023년부터 Google이 이 형식의 검색 결과 강조를 정부·보건 사이트로 제한해서 효과가 없다.

### 4.4 정책·404 페이지

- 메인과 같은 상단 메뉴와 하단을 쓴다. 본문은 어두운 판 위에 읽기 편한 글자 크기(17~18px, 줄 높이 1.7, 한 줄 최대 70자)로 놓는다.
- 404는 릴 하나가 덜컥거리며 멈추는 짧은 연출과 "Back to home" 버튼을 둔다. `noindex`를 건다.

## 5. 시각 시스템

모든 값은 클라이언트 웹 시안 `mazynga_unity_global/docs/tools/popup-lab/kit.js`(develop)와 확정 설계 문서(`docs/superpowers/specs/2026-09-30-popup-redesign-phase1-design.md` 등)에서 가져왔다. 웹에 맞게 바꾼 값은 "웹 조정"이라고 표시했다. 값은 `assets/css/tokens.css`에 CSS 변수로 모은다.

### 5.1 색

| 역할 | 값 |
|---|---|
| 페이지 바탕 | `#150830`. 섹션 구분용 한 단계 밝은 톤은 `#1d0c40`(웹 조정) |
| 판 안쪽 그라데이션 | `#45197d → #27104b(45%) → #150830` |
| 판 빛 번짐 | `rgba(200,120,255,.36)` 방사형 |
| 점무늬 | `rgba(255,255,255,.035)`, 반지름 1.5px, 간격 13px |
| 금테 | `#fff5c6 → 5% #ffd257 → 45% #c26d0e → 55% #a95a08 → 95% #ffcf4a → #8a4a06`, 바깥 어두운 선 `#3a1500` |
| 짧은 금 그라데이션(작은 테두리) | `#fff5c6 → 50% #c26d0e → #ffcf4a` |
| 금 글자 채움(GOLD) | `#ffffff → #fff1a6 → #ffc53a → #e27d00 → #ffd358` |
| 본문 글자 | `#f3ecff` |
| 보조 글자 | `#b9a8e8` |
| 어둡게 덮기(딤) | `#07020f` 66% + 가장자리 `rgba(0,0,0,.55)` |
| 색종이 | `#ffd84d #ff5fd2 #5fe3ff #ffffff #7dff9a #ff8a3d #b58cff` |

### 5.2 글꼴

| 용도 | 글꼴 | 출처·라이선스 |
|---|---|---|
| 제목·라벨·숫자 | Noto Sans KR Black(900)에서 영문 글자만 잘라 woff2로 만든 파일 | 클라이언트 `Assets/font/NotoSansKR-Black.otf`, SIL OFL 1.1 |
| 본문 | Source Sans 3 400·600 영문 woff2 | Noto Sans KR의 영문 글자는 Source Sans 디자인이라 같은 계열이다. `@fontsource/source-sans-3`, SIL OFL 1.1 |

- `font-display: swap`을 쓰고, 제목 글꼴만 미리 불러온다(preload).
- 글자를 자르는 작업은 fontTools(`pyftsubset`)로 한다. 이 도구는 스크래치 패드에 만든 Python 가상 환경에서 쓴다.

### 5.3 제목 글자

클라이언트의 `title` 스타일(38px GOLD, 외곽선 5 `#3d1200`, 안쪽 밝은 선 1.5 `#fff0b8`)을 CSS로 옮긴다.

- 금 그라데이션은 `background-clip: text`로 칠한다.
- 외곽선은 `-webkit-text-stroke`와 `paint-order: stroke fill`로 글자 바깥에 둔다.
- 그림자는 `text-shadow` 대신 뒤에 겹친 가상 요소에 `filter: drop-shadow`를 준다. `background-clip: text`와 `text-shadow`를 같이 쓰면 그림자가 글자 위에 칠해지기 때문이다.

### 5.4 모서리 규칙(하나로 고정)

| 요소 | 둥글기 |
|---|---|
| 큰 판 | 32px, 모바일 24px(웹 조정. 클라이언트는 40) |
| 안쪽 상자 | 16px |
| 목록 줄 | 18px |
| 버튼·배지·알약 | 높이의 절반(완전한 알약 모양) |

### 5.5 부품

- **공식 Google Play 배지**: Google 배지 가이드라인을 따라 그림은 바꾸지 않는다. 배지를 감싸는 틀에 짧은 금 그라데이션 테두리와 빛 스침만 더한다.
- **보라 사탕 버튼(보조)**: `#b996ff → 48% #7c4ee6 → 52% #6536d0 → #7a4ae6`, 아래 입술(그림자처럼 보이는 두께) 5px `#36167e`, 위쪽 46%에 광택. 글자는 흰색, 외곽선 2.5 `#5530b8`.
- **주황 사탕 버튼**: `#ffd88a → 48% #ff9d2e → 52% #f47a18 → #ff9a34`, 입술 `#b4440a`. 404의 "Back to home"에 쓴다.
- **배지**: 금색 `#ffeb8a → #ffa812`(숫자 외곽선 `#b06400`), 빨강 `#ff7090 → #ff1c48`.
- **안쪽 상자**: 채움 `rgba(10,3,26,.62)`, 1.5px 선 `rgba(190,150,255,.28)`.
- **그림자**: 판 `0 16px 40px rgba(0,0,0,.75)`, 버튼 `0 5px 10px rgba(0,0,0,.55)`.
- **아이콘**: Font Awesome을 빼고, 필요한 아이콘(메뉴, 닫기, 펼침 화살표, 메일)만 Lucide(ISC 라이선스)의 SVG를 HTML에 직접 넣는다. 칩, 왕관, 자물쇠, 트로피처럼 게임 느낌의 아이콘은 클라이언트 소재(9절)를 쓴다.

## 6. 연출

라이브러리 버전과 선택 이유는 7.3절에 있다.

### 6.1 첫 화면 릴 연출(`hero-reels.js`)

1. 키 아트가 0.6초 동안 서서히 나타나고 1.04배에서 1배로 줄어든다.
2. 키 아트 속 777 릴 자리에 DOM으로 만든 릴 창 3개를 정확히 겹친다. 위치는 그림 크기에 대한 백분율 좌표로 정하고, 가로 그림과 세로 그림의 좌표를 따로 둔다.
3. 릴이 돈다. 각 릴의 회전 시간은 1.4초, 1.85초, 2.3초이고, 마지막에 살짝 튕기며 멈춘다(`back.out`). 결과는 그림과 같은 7·7·7이다.
4. 세 번째 릴이 멈추면 코인이 쏟아지고(`particles.js`, 클라이언트 회전 코인 그림 사용) 색종이가 터진다(canvas-confetti, 5.1의 색종이 색).
5. 공식 배지 틀에 빛이 스치고 금빛 맥동이 두 번 지나간다.
6. 릴 아래 SPIN 버튼을 누르면 다시 돌릴 수 있다. 결과는 같은 심볼 세 개가 무작위로 나온다. **베팅, 칩, 당첨 금액 표시는 없다.**
7. 페이지를 열 때마다 매번 같은 연출을 보여 준다. 다시 볼 때 생략하는 기능은 넣지 않는다.

### 6.2 그 밖의 연출

| 위치 | 연출 | 값 |
|---|---|---|
| 첫 화면 배경 | 반짝이와 작은 코인이 떠다닌다(최대 40개). 스크롤하면 배경이 앞 요소보다 느리게 움직인다 | ScrollTrigger의 `scrub`(스크롤 위치에 애니메이션 진행을 묶는 방식) |
| 로고·잭팟 간판 빛 스침 | 기울어진 빛 띠가 지나간다 | 0.75초 `power2.inOut`, 4.5초마다(클라이언트 확정값) |
| 섹션 제목 | 단어 단위로 아래에서 떠오른다 | SplitText, 0.6초, 단어 간격 0.04초 |
| 카드 묶음 | 차례로 나타난다 | `ScrollTrigger.batch`, 간격 0.08초 |
| 슬롯 넘김 | 3D 기울기, 끌기·키보드, 4초 자동 넘김(마우스를 올리면 멈춤) | Swiper `effect: 'coverflow'` |
| 잭팟 숫자 | 보이면 자릿수별로 굴러 올라가고, 이후 조금씩 계속 늘어난다 | GSAP. 칩 아이콘을 쓰고 `$`는 쓰지 않는다. 실시간 값처럼 보이게 하는 "LIVE" 같은 표시도 쓰지 않는다 |
| 층 잠금 해제 | 데스크톱(1024px 이상): 화면을 고정하고 스크롤에 맞춰 1층→5층이 열린다. 모바일: 고정 없이 차례로 나타난다 | ScrollTrigger의 `pin`(스크롤 중 요소를 화면에 고정)과 `scrub`, `matchMedia` |
| 4시간 보너스 | 타이머 원이 차오른 뒤 칩이 튀어나온다 | SVG `stroke-dashoffset` 1.2초, `back.out(2)` |
| 버튼 누름 | 0.94배로 줄었다가 튕겨 돌아온다 | 누를 때 0.08초, 뗄 때 `back.out(3)` 0.25초(클라이언트 값) |
| 버튼 광택 | 기울어진 흰 띠가 지나간다 | 0.6초 `power2.inOut`(클라이언트 값) |
| 페이지 스크롤 | 부드러운 스크롤 | Lenis. `lenis.on('scroll', ScrollTrigger.update)`로 연결한다 |

### 6.3 동작 줄이기와 성능

- `motion.js` 한 곳에서 `prefers-reduced-motion: reduce`(OS의 "동작 줄이기" 설정)를 판단한다. 켜져 있으면 다음처럼 동작한다.
  - 릴은 처음부터 777로 멈춰 있고 SPIN 버튼을 숨긴다.
  - 입자, 빛 스침 반복, 화면 고정(pin), 자동 넘김, 부드러운 스크롤을 모두 끄고 콘텐츠를 바로 보여 준다.
- 애니메이션은 `transform`과 `opacity`만 바꾼다.
- 입자 canvas는 화면 밖에 있거나(IntersectionObserver) 탭이 숨겨지면(`visibilitychange`) 그리기를 멈춘다. 기기 화소 배율은 최대 2로 제한한다.
- 성능 목표: LCP(첫 화면의 가장 큰 요소가 그려지는 시간) 2.5초 이하, CLS(화면 밀림) 0.1 이하. 키 아트는 `<picture>`로 화면 크기별 WebP를 고르고 미리 불러온다(preload).
- JS 예산: 외부 라이브러리 약 106KB와 직접 만든 코드 약 20KB, 압축 후 합계 130KB 이하. 모든 스크립트에 `defer`를 붙인다.
- 스크롤 이벤트(`addEventListener('scroll')`)는 직접 쓰지 않는다. ScrollTrigger와 IntersectionObserver만 쓴다.

## 7. 기술 구조

### 7.1 파일 구조

```
index.html  privacy-policy.html  terms-of-service.html  404.html
CNAME  robots.txt  sitemap.xml  googlea2c3eeb0ef3dbd09.html  favicon.ico
assets/
  css/   tokens.css      색·둥글기·글꼴·간격 변수
         base.css        초기화, 글꼴 선언, 본문, 접근성(포커스 표시, 화면 낭독기 전용 글자)
         components.css  판, 버튼, 배지, 배지 틀, 상단 메뉴, 하단, FAQ
         sections.css    메인 페이지 섹션별 배치
         legal.css       정책·404 본문
  js/    main.js         시작점: 각 모듈 초기화, Lenis–ScrollTrigger 연결
         motion.js       동작 줄이기 판단, 공용 easing·시간 값
         nav.js          모바일 메뉴 열고 닫기, 현재 섹션 표시
         hero-reels.js   첫 화면 릴
         particles.js    코인·반짝이 canvas
         sections.js     제목·카드 등장, 잭팟 숫자, 층, 4시간 원, 버튼 누름·광택
         analytics.js    gtag 초기화(지금의 인라인 코드를 옮김)
  vendor/  gsap-3.15.0/  lenis-1.3.26/  swiper-14.3.0/  canvas-confetti-1.9.4/
           VENDOR.md     버전, 출처 URL, 라이선스, sha384 해시
  fonts/   gh-display-900.woff2  source-sans-3-{400,600}.woff2  OFL.txt
  img/     brand/  hero/  slots/  features/  badges/  og/
scripts/  set-domain.sh   도메인 일괄 교체
          verify.sh       내부 링크·이미지 존재, vendor 해시 점검
          build-images.sh 원본 PNG를 크기별 WebP로 변환(cwebp)
```

**지울 것**

- `styles.css`, `carousel.js`, `images/` 전체(옛 로고)
- Font Awesome CDN 링크
- `.htaccess`. GitHub Pages는 이 파일을 읽지 않는다. 지우기 전에 사용자에게 확인한다.

### 7.2 모듈 경계

- 각 JS 파일은 `init(root)` 하나를 내보낸다. `main.js`가 페이지에 해당 요소가 있을 때만 그 모듈을 부른다.
- 모듈끼리는 서로 부르지 않는다. 공용 값은 `motion.js`에서만 가져온다.
- 라이브러리는 UMD 전역 변수(`gsap`, `ScrollTrigger`, `Lenis`, `Swiper`, `confetti`)로 쓴다. 우리 코드는 `type="module"` 스크립트로 쓴다. 모듈 스크립트는 자동으로 `defer`처럼 동작하고, 앞서 `defer`로 불러온 라이브러리보다 뒤에 실행된다.
- 정책·404 페이지는 `main.js`, `nav.js`, `analytics.js`만 쓰고 라이브러리는 GSAP 코어만 불러온다. 404 연출에 필요하기 때문이다.

### 7.3 외부 라이브러리

2026-10-08에 조사했다. 버전은 npm 레지스트리, 취약점은 OSV, 크기는 직접 내려받아 측정한 값이다.

| 라이브러리 | 버전 | 라이선스 | 쓰는 곳 | 비고 |
|---|---|---|---|---|
| gsap + ScrollTrigger + SplitText | 3.15.0 | GSAP Standard No-Charge | 거의 모든 연출 | 상업 사이트에서 무료이고 모든 플러그인이 무료다. 제한은 Webflow와 경쟁하는 시각 편집 도구를 만드는 경우뿐이다. CVE-2020-28478은 3.6.0에서 수정됐다 |
| lenis | 1.3.26 | MIT | 부드러운 스크롤 | 의존 패키지 없음 |
| swiper(bundle) | 14.3.0 | MIT | 슬롯 넘김 | CVE-2026-27212는 6.5.1~12.1.1에 해당하고 14.3.0은 영향이 없다 |
| canvas-confetti | 1.9.4 | ISC | 색종이 | `useWorker`를 쓰지 않으므로 CSP에 `blob:`이 필요 없다 |

**쓰지 않는 것**

| 라이브러리 | 이유 |
|---|---|
| lottie-web 전체 빌드 | `eval`을 써서 CSP에 `'unsafe-eval'`이 필요하다 |
| dotlottie-web | WASM만 0.5MB다 |
| tsParticles | 장식 하나에 44KB다 |
| Splitting.js | 개발이 멈췄다 |
| countup.js | GSAP와 기능이 겹친다 |
| Font Awesome | 글꼴 파일 전체를 받아야 한다 |

**저장소에 넣는 절차**

1. `npm pack <패키지>@<버전>`으로 받는다.
2. 레지스트리가 알려 주는 `dist.integrity`(sha512)와 대조한다.
3. 필요한 `.min.js`·`.css`와 LICENSE만 `assets/vendor/<이름>-<버전>/`에 복사한다.
4. `VENDOR.md`에 파일별 sha384를 기록한다. `verify.sh`가 이 해시를 다시 확인한다.

### 7.4 보안

`<head>` 맨 위, 모든 `<script>`·`<link>`보다 앞에 아래 CSP를 둔다.

```
default-src 'self';
script-src 'self' https://www.googletagmanager.com;
connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com;
img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com;
style-src 'self' 'unsafe-inline';
font-src 'self';
object-src 'none'; base-uri 'self'; form-action 'none'
```
(`upgrade-insecure-requests`는 뺐다. 14절 참고.)

- 인라인 `<script>`(GA 초기화, 이미지 로딩 코드)와 `onclick` 속성을 모두 없앤다. JSON-LD(`type="application/ld+json"`)는 실행되는 코드가 아니라서 CSP의 차단 대상이 아니다.
- `style-src 'unsafe-inline'`은 Swiper와 GSAP가 요소에 스타일을 직접 쓰는 경우를 대비해 둔다. 스크립트 실행 권한과는 관계가 없어서 위험이 낮다.
- `<meta>` 방식에서는 `frame-ancestors`가 무시된다. GitHub Pages는 응답 헤더를 바꿀 수 없으므로 이 한계를 받아들인다.
- 외부 링크에는 모두 `rel="noopener"`를 붙인다. GA 측정 ID `G-0JJDZ3R7EH`는 그대로 쓴다.

## 8. 검색엔진·메타

- **제목**: `Golden Hour – Slots Casino | 60+ Free 3D Slot Games`
- **설명**: 155자 이내 영어 문장. 제목·설명과 함께 OG 태그(공유 미리보기)와 Twitter 카드 태그도 새 이름으로 바꾼다.
- **공유 이미지**: 1200×630 `assets/img/og/og-golden-hour.jpg`. `splash_wide`를 잘라 만든다.
- **JSON-LD `MobileApplication`**:
  - `name`: Golden Hour - Slots Casino
  - `operatingSystem`: Android
  - `applicationCategory`: GameApplication
  - `contentRating`: 18+
  - `publisher`: Vglobal Co., Ltd.
  - `offers`: price 0
  - `screenshot`: 새 이미지
  - 지울 것: 실제와 다른 `aggregateRating`(4.625 / 100개), 확인되지 않은 `fileSize`·`version`·`datePublished`
- **지울 메타 태그**: 확인되지 않은 `twitter:site`(@SocialCasino2), `twitter:creator`(@VglobalInc). 효과 없는 `keywords`, `revisit-after`, `distribution`.
- **사이트맵**: 중복인 `/index.html`과 404를 빼고, `lastmod`를 배포일로 바꾼다. 404에는 `<meta name="robots" content="noindex">`를 건다.
- **아이콘**: 앱 아이콘으로 `favicon.ico`(16·32·48), `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`(180)를 만든다. `theme-color`는 `#150830`이다.
- **도메인 교체**: 절대 주소는 HTML 4개의 `<head>`, `sitemap.xml`, `robots.txt`, `CNAME`에만 둔다. 본문 링크는 모두 상대 경로로 쓴다. `scripts/set-domain.sh <새 호스트>`가 이 파일들의 `sscgl.vglobal.site`를 바꾸고, 바꾼 파일 목록을 출력한다.

## 9. 소재

### 9.1 클라이언트 저장소에서 바로 가져올 것

| 소재 | 경로(`mazynga_unity_global/` 기준) | 크기 | 쓰는 곳 |
|---|---|---|---|
| 가로 키 아트 | `output/promo-video-kit/01_brand/splash_wide_1914x822.png` | 1914×822 | 첫 화면(가로 화면), 공유 이미지 |
| 정사각 키 아트 | `output/promo-video-kit/01_brand/title_keyart_1254.png` | 1254×1254 | 첫 화면(세로 화면) |
| 16:9 키 아트 | `output/promo-video-kit/01_brand/title_keyart_16x9_lastframe.png` | 1920×1080 | 마지막 설치 유도 배경 후보 |
| 앱 아이콘 | `output/promo-video-kit/01_brand/app_icon_round_1024.png` | 1024×1024 | 상단 메뉴, 파비콘 |
| 회사 로고 | `output/promo-video-kit/01_brand/company_logo.png` | 2048×1536 | 제작팀 띠. 검은 글자라 흰색으로 바꿔 쓴다 |
| 럭키 타임 배지 | `output/promo-video-kit/03_ui_elements/lucky_time_badge.png` | 384×98 | 럭키 타임 섹션 |
| 잭팟 슬롯 UI | `output/promo-video-kit/03_ui_elements/jackpot_slot_ui.png` | 1812×1388 | 럭키 타임 섹션 후보 |
| 회전 코인 | `Assets/AtlasImage/coin_effect/Texture/coin10.png` | 320×128 | 코인 입자 |

- `output/`은 git이 추적하지 않는 로컬 파일이다. 원본은 이 저장소에 넣지 않고, WebP로 변환한 결과만 넣는다.
- `lobby_bg.png`(옛 라스베이거스 배경)와 `Assets/ExtractedSprites/casino_logo.png`(옛 로고)는 쓰지 않는다.

### 9.2 "칭호 포인트 시안 작업" 세션에 요청할 것

받을 곳은 이 작업 트리의 `assets/img/_incoming/`이다(git 제외).

| # | 소재 | 형식 |
|---|---|---|
| 1 | 대표 슬롯 8~12종. 테마별 1~2개. 로비 타일 그림이나 게임 화면 | PNG, 투명 배경 타일이면 512px 이상, 화면이면 1600×900 이상. 슬롯 영문 이름과 테마를 목록으로 같이 받는다 |
| 2 | 게임 화면 7장: 로비 층 화면, 럭키 타임 켜진 화면, 메이저 잭팟 당첨, 층 해제(레벨업), Daily Top 25, 친구·선물·메시지, 4시간 칩 보너스 받기 | PNG 1920×1080 가로. 영문 UI, 가짜 닉네임, 디버그 표시 없음 |
| 3 | 투명 배경 아이콘: 칩, 왕관(A3), 자물쇠 닫힘·열림, 트로피, 선물 상자 | PNG 256px 이상 |
| 4 | 키 아트에 나오는 릴 심볼: 빨간 7, 체리, 오렌지, 포도, 종, 다이아몬드 | PNG 투명 배경 256px 이상 |
| 5 | 회전 코인 고해상도 프레임(`coin10` 원본이나 128px 이상) | PNG 시트 또는 프레임별 PNG |
| 6 | (있으면) `splash_wide`의 레이어 분리본: 하늘·해, 야자수 좌우, 로고, 심볼 더미, 777 릴 | 레이어별 PNG |
| 7 | (있으면) "Golden Hour" 로고만 있는 투명 PNG | PNG 1600px 폭 이상 |

**소재가 늦거나 없을 때**

- 1·2번이 오기 전에는 Play 스토어 스크린샷 자리에 같은 비율의 빈 판을 두고 나머지를 먼저 만든다. 배포 전까지 모두 실제 소재로 바꾼다. 판을 `div`로 꾸며 가짜 게임 화면처럼 만들지는 않는다.
- 4번이 없으면 릴 심볼은 키 아트에서 777을 잘라 쓰고, SPIN 결과를 777로만 고정한다.
- 6번이 없으면 키 아트 한 장 전체에 패럴랙스를 적용한다.
- 7번이 없으면 키 아트에 들어 있는 로고를 그대로 쓴다.

## 10. 표시 문구와 법률 문서

- **하단 중요 공지**: Play 스토어 "Important notice"를 따른다. Golden Hour는 오락 목적의 소셜 카지노 게임이다. 실제 현금 도박이 아니고, 현금·상품을 얻을 수 없으며, 가상 칩에는 현금 가치가 없다. 이 문장을 영어로 쓴다.
- 첫 화면과 하단에 `18+` 알약 배지를 둔다. 사이트 어디에도 `$` 같은 통화 기호를 칩·잭팟 숫자에 붙이지 않는다.
- **개인정보처리방침·이용약관 본문**: `Social Casino2`를 `Golden Hour - Slots Casino`로, `Vglobal Inc.`를 `Vglobal Co., Ltd.`로만 바꾼다. 다른 문장, 조항, 시행일은 손대지 않는다.

## 11. 검증

**자동 점검(`scripts/verify.sh`)**

- HTML 4개의 내부 링크와 이미지 경로가 모두 존재하는지 확인한다.
- `VENDOR.md`의 해시와 실제 파일이 일치하는지 확인한다.
- HTML에 인라인 이벤트 속성(`on*=`)과 인라인 `<script>`(JSON-LD 제외)가 없는지 확인한다.

**브라우저 확인**: 로컬 정적 서버(`.claude/launch.json`에 `python3 -m http.server`를 등록)를 띄우고 브라우저 창에서 확인한다.

| 확인 항목 | 기준 |
|---|---|
| 화면 크기 | 375×812, 768×1024, 1440×900에서 각 섹션 캡처 |
| 가로 스크롤 | 없음 |
| 콘솔 | 오류 0건, CSP 위반 0건 |
| 동작 줄이기 | 켠 상태에서 연출이 꺼지고 내용이 모두 보임 |
| 첫 화면 | 릴이 그림의 777 자리에 맞게 겹침(가로·세로 그림 모두) |
| 키보드 | Tab으로 메뉴, 배지, SPIN, 슬롯 넘김, FAQ에 닿고 포커스 표시가 보임 |
| LCP | `PerformanceObserver`로 측정해 2.5초 이하 |
| 대비 | 본문 4.5:1 이상, 큰 글자 3:1 이상 |

## 12. 품질 점검 목록

taste-skill(`Leonxlnx/taste-skill`, MIT)에서 이 사이트에 맞는 규칙만 골랐다.

- [ ] 첫 화면에서 제목, 설명(20단어 이하), 설치 배지가 스크롤 없이 보인다(375×667 포함).
- [ ] 첫 화면 글자 요소는 4개 이하다. 제목, 설명, 배지, 18+이다.
- [ ] 같은 목적의 버튼 문구는 하나다. 설치는 공식 배지 하나다.
- [ ] 같은 섹션 배치를 두 번 쓰지 않았다. 그림과 글을 좌우로 나눈 섹션이 3번 연속 나오지 않는다.
- [ ] 섹션 제목 위의 작은 대문자 라벨은 섹션 3개당 1개 이하다.
- [ ] 모서리 규칙(5.4)을 모든 요소가 따른다.
- [ ] 격자 칸 수가 내용 수와 같다. 빈 칸이 없다.
- [ ] 가짜 화면(div로 꾸민 스크린샷), 가짜 수치·후기·평점이 없다.
- [ ] 상단 메뉴가 데스크톱에서 한 줄이고 높이 72px 이하다.
- [ ] 각 다단 배치에 모바일(768px 미만) 배치가 명시되어 있다.
- [ ] 동작 줄이기, transform·opacity만 애니메이션, 스크롤 이벤트 직접 사용 없음.
- [ ] 문구에 `!` 남발, "seamless·unlock·leverage" 같은 빈말이 없다.

## 13. 위험과 열린 문제

- **서브도메인 변경**: 정해지면 `set-domain.sh`를 실행하고, GitHub Pages 설정과 DNS를 바꾸고, Search Console에 다시 등록해야 한다. DNS와 Search Console은 사용자가 직접 한다.
- **소재 일정**: 클라이언트 세션의 소재가 늦어지면 9.2절의 대체 방식으로 먼저 완성한다. 배포는 실제 소재가 들어온 뒤에 한다.
- **GSAP 라이선스**: OSI 승인 오픈소스 라이선스가 아니라 Webflow가 조건을 정한다. 현재 조건으로는 문제가 없다. 다음에 버전을 올릴 때 조건을 다시 확인한다.
- **릴 겹침 정렬**: 키 아트가 바뀌면 백분율 좌표도 다시 맞춰야 한다. 좌표는 `hero-reels.js` 맨 위 상수 한 곳에 둔다.
- **Google Play 배지**: 공식 배지 그림을 받아 쓴다(Google Play 배지 생성 페이지, 영어). 배지 둘레 장식이 가이드라인의 여백 규칙을 침범하지 않게 한다.

## 14. 구현 중 바뀐 점(2026-10-08)

구현하면서 이 문서와 다르게 정한 것이다. 이 절이 앞 절들보다 우선한다. 근거와 판단 기록은 실행 기록(ledger)의 `Ruling:` 줄에 있다.

| 절 | 바뀐 점 | 이유 |
|---|---|---|
| 4.1, 6.2 | 럭키 타임 & 잭팟 섹션의 그림을 "왕관 + MAJOR JACKPOT 글자 판"에서 **데일리 잭팟 기계 그림 + 등급 카드 4장**으로 바꿨다. 등급은 GRAND 스페이드, MAJOR 하트, MINOR 다이아몬드, MINI 클로버이고, 굴러가는 숫자는 GRAND 카드에 있다 | 사용자가 새 데일리 보너스 잭팟 슬롯 디자인이 잘 나왔다고 알려 줬다. 클라이언트 리뉴얼 UI를 그대로 보여 줄 수 있다 |
| 4.3 | FAQ 6번을 "How is my data handled?"로 바꾸고 정책 페이지로 안내한다 | 개인정보처리방침에 삭제 절차가 없다. 법률 내용을 지어내지 않기 위해서다 |
| 5.3 | 금색 제목은 본문 글자가 갈색 외곽선을 맡고, `::after`가 금 그라데이션을 위에 덮는다 | 요소 배경으로 칠하면 쌓임 순서상 외곽선 층에 가려진다 |
| 5.5 | 주황 사탕 버튼을 쓰지 않는다. 404도 보라 버튼이다 | 흰 글자와의 대비가 2.8:1로 기준 미달이다 |
| 5.5 | 설치 배지 장식은 배지 **뒤쪽**의 빛만 쓴다(테두리, 위로 지나가는 빛 없음) | Google 배지 가이드라인 때문이다 |
| 5.5 | 회사 로고는 흰 캔버스에서 로고 부분만 잘라 `invert + screen`으로 흰 글자로 보인다 | 원본이 투명 배경이 아니다 |
| 6.2 | 로고 빛 스침은 생략했다(잭팟 간판 글자 스침도 빠짐) | 로고가 키 아트 그림에 포함되어 있고, 잭팟 간판은 기계 그림이 대신한다 |
| 6.3 | 첫 화면 그림은 품질 76으로 줄이고 750px 크기를 더했다. 연출 라이브러리 `<script>`에는 `fetchpriority="low"`를 붙였다 | 느린 4G 모바일 LCP를 3.5초에서 약 2.0초로 줄였다 |
| 7.1 | 점검 스크립트는 `scripts/verify.mjs`(Node)다. 테스트는 `tests/`, 개발 도구 설정은 `package.json`·`playwright.config.mjs`·`_config.yml`이다 | 링크·해시·예산 점검을 셸로 쓰기 어렵다 |
| 7.4 | CSP에서 `upgrade-insecure-requests`를 뺐다 | 로컬 http 서버에서 자원이 https로 바뀌어 깨진다. 외부 자원은 이미 모두 https다 |
| 7.4 | GA `gtag.js`에는 SRI를 붙이지 않는다 | Google이 수시로 바꾸는 파일이라 해시를 고정하면 GA가 멈춘다. CSP로 출처만 제한한다 |
| 9.1 | 릴의 7 그림은 244×435로 잘랐다 | 양옆 금색 칸막이를 빼기 위해서다 |
| 9.2 | 팝업 계열 새 UI(잭팟, Top 25, 선물함, 메시지함, 보상)는 웹 시안(Popup Lab)에서 직접 캡처하기로 했다. 클라이언트 세션에는 인게임 2장(로비 층 화면, 럭키 타임)만 요청했다 | 사용자가 새 UI는 모두 웹 시안에 있다고 알려 줬다 |
| 10 | 지원 이메일은 `vglobalinfo24@gmail.com`으로 통일한다. 개인정보처리방침 본문의 `vglobalinfo2024@gmail.com`도 바꿨다 | 사용자가 결정했다 |


## 15. 2차 수정(2026-10-08, 사용자 검토 반영)

사용자가 첫 결과물을 보고 요청한 수정과, 그 과정에서 고른 것이다. 이 절이 앞 절들(14절 포함)보다 우선한다.
클라이언트 자료는 원격 `origin/develop` 기준이다(로컬 develop 은 256커밋 뒤처져 있었다).

**사용자 결정**: 첫 화면 스핀은 데일리 잭팟 기계로 옮긴다 / 제목은 B(샴페인 골드) / 콜렉트 보너스는 2시간 / 슬롯 수는 "45+"

| 대상 | 바뀐 점 | 이유·근거 |
|---|---|---|
| 첫 화면 | 키 아트 위 릴·SPIN 버튼을 없애고 그림을 그대로 보여 준다(반짝이·패럴랙스만) | 키 아트 속 기계가 비스듬해서 2D 릴이 맞지 않았다 |
| 슬롯 넘김 | 볼록한 원통(가운데가 가장 가깝고 옆 카드는 바깥으로 돌며 멀어짐), 좌우 약 3장씩만. 카드 14장은 실제 층에 있는 슬롯이고 꼬리표는 층 번호 | 전에는 오목하게 보였고, 넓은 화면에서 왼쪽으로 쏠리고 먼 카드가 뒤집혀 보였다. 서비스하지 않는 Cash Fever 를 뺐다 |
| 럭키 타임 | 일반 슬롯 이야기만: 럭키 타임(보너스 게임·프리 스핀 확률 상승) + 일반 슬롯 누적 잭팟(GRAND 숫자, MAJOR·MINOR·MINI) + 새 로비 럭키 타임 캡처 | 럭키 타임은 일반 슬롯에만 적용되고 데일리 잭팟 기계와 무관하다(클라이언트 `UI_JACKPOT`·`JackpotModel` 에 럭키 타임 없음) |
| 데일리 잭팟(새 섹션) | 웹 시안에서 배경·빛살 없이 투명하게 뽑은 기계(빈 릴 창) + 유리 덮개 + 그 사이 DOM 릴 3개. 등급 판은 게임처럼 좌우. 화면에 들어오면 GRAND 로 한 번, 기계 그림의 SPIN 자리를 누르면 다시 돈다 | 정면 그림이라 릴이 정확히 맞는다. 액자 없이 기계만 보인다 |
| 층 | 실제 10개 층·47개 슬롯·개방 칩·최소 베팅(운영 DB 값, `scripts/floors.mjs` → `scripts/render-floors.mjs`). 엘리베이터식: 큰 화면(가로 1024·세로 700 이상)은 CSS sticky 로 섹션을 붙여 두고 화면 높이 18%마다 한 층(스크롤 공간은 `.floors-track` 이 처음부터 가져서 화면 밀림이 없다), 자물쇠 흔들림·터짐·빛·아이콘 튀어나옴, 층 묶음마다 로비 배경 교체. 작은 화면은 보이는 동안 10층까지 한 번 저절로 오르고(만지면 멈춤), 층 버튼판으로 바로 이동 | 층은 레벨이 아니라 보유 칩으로 열린다("No more level limit"). 문구도 칩 기준으로 고쳤다 |
| 제목 | 외곽선 없는 샴페인 금색 + 짧은 진한 금빛 그림자. 칠하는 상자를 위아래로 넓혀 g·y 꼬리까지 금색 | 갈색 외곽선이 촌스럽고, 단어로 나눈 뒤 g·y 아래가 갈색만 보이던 버그 |
| 콜렉트 보너스 | 2시간마다, 룰렛 없이 바로 지급. 새 로비 COLLECT BONUS(받기 전 ↔ 받은 순간) 캡처를 세 번 번갈아 보여 주고 받은 순간에서 멈춘다. 최대 15M, VIP ×2 | 운영 DB `collect_bonus_required_times` = 120분, 새 로비는 바로 지급 |
| 18+ | 금색 배지 → 흐린 작은 테두리 글자(첫 화면·꼬리말) | 지나치게 눈에 띄었다 |
| peerage | 랭킹 섹션에 사이트 전용 방패 계단(6등급 × 레벨 5) + 등급별 데일리 잭팟 보너스(Bronze 0–40%, Silver 60–120%, Sapphire 150–230%, Ruby 270–350%, Royal Gold 390–470%, Diamond 520–600%). 1등을 해야 포인트 | 사용자가 준 등급·레벨별 상승률 표(최대 +600%) |
| 바탕 | 새 로비 배경(빛 물결, bg_1)을 어둡게 깔아 페이지 전체 바탕으로 고정 | 사용자가 준 추가 소재 |
| 소재 | 웹 시안 캡처는 `scripts/lab-capture.mjs`(시안 파일·bake 폴더에 쓰지 않음), 배경·방패는 `build-images.sh` 가 `CLIENT_REF`(기본 origin/develop)에서 `git show` 로 꺼낸다 | 다시 만들 수 있게 |
| 섹션 순서 | 첫 화면 → 슬롯 → 럭키 타임 → 층 → 데일리 잭팟 → 콜렉트 보너스 → 랭킹 → FAQ(8개, "무료 칩"·"계정 삭제" 추가) → 설치 | 무료 칩 기능을 한데 모았다 |

### 15.1 3차 수정(사용자 검토)

| 대상 | 바뀐 점 |
|---|---|
| 슬롯 넘김 | Swiper 대신 직접 만든 원통(`assets/js/slots-ring.js`): 계속 천천히 돌고(5초에 한 장) 끄는 동안만 멈춘다. 카드는 원통 각도의 55%만 돈다. 화살표 버튼 없음 |
| 잭팟 숫자 | 자리 숫자가 늘 앞으로 굴러간다(줄어드는 것처럼 보이지 않게) |
| 럭키 타임 | 로비 캡처를 빼고 슬롯 안 화면 두 장을 같은 크기로 어긋나게 겹친다(짙은 액자 + 금테 + 그림자) |
| 층 | 버튼판·로비 캡처·자물쇠 연출 없음. 한 층에 화면 높이 6%. 스와이프·화살표·점 10개. 무대는 보라 테, 층 표시판은 테 없는 짙은 판 |
| 데일리 잭팟 | 시안과 같은 심볼 크기, 등급 판 금액(운영 값: GRAND 200,000,000, MAJOR 150,000,000, MINOR 5,000,000, MINI 1,000,000)·네온·전구·빛 스침·긴장 연출, 고른 확률(16/18/20/20/26%) |
| 콜렉트 보너스 | 스크린샷 대신 게임 판 그림 위 가상 연출(타이머 → 빛남 → 누름 → 칩이 잔액으로) |
| 랭킹·소셜 | 닉네임을 바꿔 다시 찍은 팝업 안쪽 화면으로 같은 크기 카드 3장. peerage 는 위 표 |
| 이메일 | 고객 지원은 `vglobalcs24@gmail.com`(꼬리말·FAQ·구조화 데이터). 정책 본문 연락처는 그대로 |
| 캐시 | 페이지의 로컬 CSS·JS 주소와 JS 모듈의 상대 import 에 내용 버전(`?v=` 해시 8자리)을 붙인다(`npm run stamp`, `verify.mjs` 의 stamps 점검). 브라우저가 캐시한 옛 JS 와 새 HTML 이 섞여 슬롯 넘김 등이 깨지는 일을 막는다 |
| 계정 삭제 | `delete-account.html`(Google Play 계정·데이터 삭제 요청 주소): 설정의 MEMBER ID 를 `vglobalcs24@gmail.com` 으로 보내면 본인 확인 뒤 30일 안에 삭제. 손님은 REGISTER 로 MEMBER ID 를 받은 뒤 요청. 결제 기록만 법이 정한 기간 동안 따로 보관. 꼬리말·FAQ·sitemap·llms.txt 에서 연결. 앱 안 삭제(클라 v2 설정의 [Delete account], 유예 기간 미정)는 출시되면 페이지에 더한다 |
| AI 검색 | FAQPage 구조화 데이터(화면 FAQ 와 같은 문구), `llms.txt`(사이트 요약과 링크) |
| 첫 화면 경계 | 흐린 키 아트 배경은 아래로 갈수록 투명해져(마스크) 다음 섹션과 같은 오로라·점무늬 배경으로 이어진다. 단색으로 끝나면 경계선이 생긴다 |
| peerage 등장 | 블록이 다 나타난 뒤, 방패가 Bronze 부터 0.16초 간격으로 솟아올라 앉고(티어 색 빛 퍼짐 + 방패 모양 빛줄기), 이름·보너스가 뒤따른다. 빛줄기는 6초마다 계단을 타고 다시 지나가고 Diamond 는 숨 쉬듯 빛난다. JS 없음·동작 줄이기면 정지 그림 |
| 섹션 리듬 | 섹션 내용 사이 간격은 모두 섹션 여백 두 번(데스크톱 280px, 휴대폰 144px). 첫 화면도 화면 한 장 고정 대신 내용 + 섹션 여백으로 끝난다. 랭킹과 FAQ 사이 팀 띠는 띠 테두리까지 여백 한 번, 마지막 설치 섹션은 일부러 더 넓다 |
