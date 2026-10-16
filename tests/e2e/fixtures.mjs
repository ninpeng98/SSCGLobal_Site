import { test as base, expect } from '@playwright/test';

// 모든 e2e 테스트의 공용 준비.
// - GA 요청은 빈 응답으로 바꾼다(외부 네트워크 없이 돌게).
// - 콘솔 오류·페이지 오류·CSP 위반을 problems 에 모은다. 테스트가 expect(problems).toEqual([]) 로 확인한다.
export const test = base.extend({
  problems: [async ({ page }, use) => {
    const problems = [];
    await page.route(/googletagmanager\.com|google-analytics\.com/, (route) =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    page.on('console', (msg) => { if (msg.type() === 'error') problems.push(`console: ${msg.text()}`); });
    page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => {
        console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`);
      });
    });
    await use(problems);
  }, { auto: true }],
});

export { expect };
