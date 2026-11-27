// Desktop side rail: once the top header scrolls out of view, a menu button
// appears under the EDG mark and opens a panel with the full site navigation
// (cloned from #nav when opened, so it always matches the current language).
(function () {
  const rail = document.querySelector('.editorial-rail');
  const nav = document.getElementById('nav');
  const header = document.querySelector('.top');
  if (!rail || !nav) return;

  const css = `
    .rail-burger{display:none}
    @media(min-width:1280px){
      .editorial-rail .rail-top{display:flex;flex-direction:column;align-items:center;gap:16px}
      .editorial-rail .rail-burger{display:grid;place-items:center;width:40px;height:40px;margin:0;padding:0;border:1px solid #3a3a3a;background:#0c0c0d;color:#ddd;cursor:pointer;opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .3s,transform .3s,visibility .3s,border-color .2s,color .2s}
      .editorial-rail .rail-burger svg{width:20px;height:20px}
      .editorial-rail .rail-burger:hover,.editorial-rail .rail-burger[aria-expanded=true]{color:#C89733;border-color:#C89733}
      .rail-scrolled .editorial-rail .rail-burger{opacity:1;visibility:visible;transform:none}
      .rail-panel{position:fixed;top:0;bottom:0;left:62px;width:min(360px,calc(100vw - 62px));z-index:24;background:#0c0c0d;border-right:1px solid #303030;padding:34px 36px;display:flex;flex-direction:column;gap:4px;transform:translateX(-102%);transition:transform .35s ease;visibility:hidden;overflow-y:auto}
      .rail-panel.is-open{transform:none;visibility:visible}
      .rail-panel__label{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#C89733;margin:0 0 18px}
      .rail-panel a{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;border-bottom:1px solid #262626;color:#eee;font-size:20px;font-weight:300;letter-spacing:.01em;text-transform:none}
      .rail-panel a:hover,.rail-panel a:focus-visible{color:#C89733}
      .rail-panel a.textlink{border-bottom:1px solid #262626;padding:14px 0}
      .rail-panel a svg{width:16px;height:16px;flex:none}
      .rail-backdrop{position:fixed;inset:0;z-index:23;background:#0007;opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s}
      .rail-backdrop.is-open{opacity:1;visibility:visible}
    }
    @media(prefers-reduced-motion:reduce){.rail-panel,.editorial-rail .rail-burger,.rail-backdrop{transition:none!important}}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const isEnglish = () => (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const t = (es, en) => (isEnglish() ? en : es);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'rail-burger';
  btn.setAttribute('aria-controls', 'rail-panel');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  // Keep the button right under the EDG mark: group them so the rail's
  // space-between layout treats them as one item.
  const mark = rail.querySelector('.rail-mark');
  const top = document.createElement('div');
  top.className = 'rail-top';
  if (mark) { mark.before(top); top.append(mark, btn); } else { rail.prepend(top); top.append(btn); }

  const panel = document.createElement('nav');
  panel.id = 'rail-panel';
  panel.className = 'rail-panel';
  const backdrop = document.createElement('div');
  backdrop.className = 'rail-backdrop';
  document.body.append(backdrop, panel);

  const label = () => {
    btn.setAttribute('aria-label', t('Abrir menú', 'Open menu'));
    panel.setAttribute('aria-label', t('Menú del sitio', 'Site menu'));
  };
  label();

  function build() {
    panel.innerHTML = `<p class="rail-panel__label">${t('Navegación', 'Navigation')}</p>`;
    nav.querySelectorAll('a').forEach(a => {
      const link = a.cloneNode(true);
      link.removeAttribute('id');
      panel.appendChild(link);
    });
  }

  function setOpen(open) {
    if (open) build();
    panel.classList.toggle('is-open', open);
    backdrop.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? t('Cerrar menú', 'Close menu') : t('Abrir menú', 'Open menu'));
    if (open) {
      const first = panel.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    }
  }
  const isOpen = () => panel.classList.contains('is-open');

  btn.addEventListener('click', () => setOpen(!isOpen()));
  backdrop.addEventListener('click', () => setOpen(false));
  panel.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) { setOpen(false); btn.focus(); }
  });

  // Show the button only once the top header is out of view.
  const setScrolled = on => {
    document.documentElement.classList.toggle('rail-scrolled', on);
    if (!on && isOpen()) setOpen(false);
  };
  if (header && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting)).observe(header);
  } else {
    const check = () => setScrolled(window.scrollY > 160);
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  // Keep labels in step with the language switch.
  new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
