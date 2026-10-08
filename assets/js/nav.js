// 상단 메뉴: 첫 화면을 지나면 배경을 채우고(.is-solid), 모바일에서는 메뉴를 열고 닫는다(.is-open).
export function initNav(root = document) {
  const nav = root.querySelector('[data-nav]');
  if (!nav) return;
  const toggle = nav.querySelector('[data-nav-toggle]');
  const menu = nav.querySelector('#site-menu');
  const sentinel = root.querySelector('[data-nav-sentinel]');

  if (sentinel) {
    new IntersectionObserver(([entry]) => nav.classList.toggle('is-solid', !entry.isIntersecting)).observe(sentinel);
  } else {
    nav.classList.add('is-solid');
  }

  if (!toggle || !menu) return;
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (event) => { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
}
