# 계정 삭제 페이지 — 새 앱(auth v2) 출시 때 바꿀 초안

지금 공개된 `delete-account.html` 은 현재 앱 기준이다. 앱 안 삭제가 없고, 손님은 MEMBER ID 를 볼 수 없다.
새 앱이 출시되면 아래처럼 바꾼다. `{GRACE_DAYS}`(유예 일수)와 "유예 중 취소 방법"은 서버 계정 삭제 설계에서 정한다
(2026-10-08 기준 미정, 정해지면 서버 세션 "인증 배포 준비"가 알려 주기로 함).

## 바뀌는 사실 (사용자 결정 2026-10-08)

- 손님도 처음부터 MEMBER ID(공개 ID, 16자, 화면에는 4자씩 하이픈)를 받고, 설정 화면에서 볼 수 있다.
- 설정에 [Delete account] → 확인 창 한 번 → 삭제 "요청" → 유예 기간 뒤 서버가 지운다.
- 웹 삭제 요청(이 페이지와 이메일)은 계속 둔다.

## 초안 (영문, `<article>` 안을 이것으로 바꾼다)

### Delete Your Golden Hour Account

You can ask Vglobal Co., Ltd., the developer of **Golden Hour – Slots Casino** on Google Play, to delete your Golden Hour account and the data linked to it, either in the app or by email.

#### Delete in the app

1. Open Golden Hour and go to **Settings**.
2. Tap **Delete account**, then confirm.
3. Your account is scheduled for deletion and deleted after {GRACE_DAYS} days. {유예 중 취소 방법 — 예: "If you sign in again before then, the request is cancelled."}

#### Request by email

1. In **Settings**, tap your **MEMBER ID** to copy it. Guest accounts have one too.
2. Email vglobalcs24@gmail.com with the subject “Account deletion request” and paste your MEMBER ID. (기존 「Email a deletion request」 버튼 유지)
3. We reply to confirm that the request comes from you. Once it is confirmed, we delete your account within 30 days and let you know when it is done.

If you have already uninstalled the app, email us anyway with your display name, your device model and roughly when you started playing, and we will do our best to find your account.

#### What we delete

- Your account and profile: username, avatar, country and level
- Your virtual chips, purchased items, VIP status and game progress
- Friends, gifts, messages, rankings and Peerage titles
- The link to your Google account, if you signed in with Google
- Device and notification identifiers linked to your account

#### What we keep, and for how long

(지금과 같음: 결제 기록은 법이 정한 기간 동안 따로 보관, 개인을 알아볼 수 없는 통계)

#### Before you delete

- Deletion is permanent. Virtual chips, purchased items and VIP benefits can’t be restored afterwards.
- Uninstalling the app does not delete your account.

## 함께 바꿀 곳

- 「Playing as a guest?」 절을 뺀다(손님도 위 단계와 같다).
- FAQ "How do I delete my account?" 답과 FAQPage 구조화 데이터: "In Settings, tap Delete account, or email us your MEMBER ID …"
- `tests/e2e/legal.spec.mjs` 의 삭제 페이지 테스트: 단계 수, `#guests`, REGISTER 문구 기대값.
