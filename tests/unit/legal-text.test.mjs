import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// 리뉴얼 직전 커밋. 법률 문구는 앱 이름·회사명·지원 이메일 외에는 이 커밋과 같아야 한다.
// 지원 이메일은 사용자가 vglobalinfo24@gmail.com 으로 통일하기로 정했다(2026-10-08).
// 나중에 더한 문단은 data-revision 을 단다. 그 문단을 뺀 나머지가 원문과 같아야 한다.
const BASE = '5690ce6';

const stripRevisions = (html) => html.replace(/<(h[1-6]|p|ul|section)\b[^>]*\bdata-revision\b[^>]*>[\s\S]*?<\/\1>/gi, '');

function mainText(html) {
  const m = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  assert.ok(m, 'no <main>');
  return m[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

for (const page of ['privacy-policy.html', 'terms-of-service.html']) {
  test(`${page} keeps the legal text except the app name, company name and support email`, () => {
    const before = execFileSync('git', ['show', `${BASE}:${page}`], { encoding: 'utf8' });
    const expected = mainText(before)
      .replaceAll('Social Casino2', 'Golden Hour - Slots Casino')
      .replaceAll('Vglobal Inc.', 'Vglobal Co., Ltd.')
      .replaceAll('vglobalinfo2024@gmail.com', 'vglobalinfo24@gmail.com');
    assert.equal(mainText(stripRevisions(readFileSync(page, 'utf8'))), expected);
  });
}

// Google 로그인 OAuth 동의 화면·Play 심사: 수정일과 Google 로그인 때 다루는 정보(서버 세션이 알려 준 사실, 2026-10-08)
test('privacy policy shows when it was last updated', () => {
  const html = readFileSync('privacy-policy.html', 'utf8');
  assert.match(mainText(html), /^Privacy Policy Last updated: 2026\. 10\. 08 /);
});

test('privacy policy explains Google Sign-In: only the Google account identifier, why, and what happens on deletion', () => {
  const section = readFileSync('privacy-policy.html', 'utf8').match(/<section\b[^>]*id="google-sign-in"[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(section, 'no #google-sign-in section');
  const text = mainText(`<main>${section[1]}</main>`);
  for (const fact of [
    'ID token issued by Google',
    'only the unique identifier of your Google account',
    'do not store or use your Google email address, name or profile photo',
    'do not store or log the ID token',
    'to sign you in and to restore your account',
    'not use it for advertising or marketing',
    'only one game account',
    'deleted with it',
  ]) assert.ok(text.includes(fact), `missing: ${fact}`);
});
