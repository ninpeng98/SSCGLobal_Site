// Google Analytics 4 초기화. CSP 때문에 인라인 스크립트 대신 파일로 둔다.
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
window.gtag = gtag;
gtag('js', new Date());
gtag('config', 'G-0JJDZ3R7EH');

// data-track 이 붙은 링크·버튼을 누르면 이벤트를 보낸다. 예: 설치 배지 → play_store_click(location: hero)
document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-track]');
  if (!el) return;
  gtag('event', el.dataset.track, { location: el.dataset.trackLocation || 'unknown' });
});
