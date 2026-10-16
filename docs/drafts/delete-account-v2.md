# 계정 삭제 페이지 — 남은 일

2026-10-08 사용자 결정으로 `delete-account.html` 은 새 앱(auth v2) 기준으로 공개했다.
앱 안 [Delete account](확인 → 유예 뒤 삭제), 손님도 MEMBER ID, 이메일 요청 30일, 지우는 데이터에 Google 계정 연결.

서버 계정 삭제 설계가 정해지면(서버 세션 "인증 배포 준비"가 알려 주기로 함) 아래를 고친다.

- 유예 일수: 지금은 "deleted after a waiting period. The app shows how long when you confirm." → 숫자로 바꾼다.
- 유예 중 취소 방법: 지금은 적지 않았다. 정해지면 앱 단계 3에 한 문장 더한다(예: "If you sign in again before then, the request is cancelled.").
- 바꾸면 FAQ "How do I delete my account?" 답과 FAQPage 구조화 데이터, `tests/e2e/legal.spec.mjs` 기대값도 함께 본다.
