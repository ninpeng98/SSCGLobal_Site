import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// 리뉴얼 직전 커밋. 법률 문구는 앱 이름·회사명·지원 이메일 외에는 이 커밋과 같아야 한다.
// 지원 이메일은 사용자가 vglobalinfo24@gmail.com 으로 통일하기로 정했다(2026-10-08).
const BASE = '5690ce6';

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
    assert.equal(mainText(readFileSync(page, 'utf8')), expected);
  });
}
