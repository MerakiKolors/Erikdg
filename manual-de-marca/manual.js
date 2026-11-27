// Builds the shared sidebar, mobile bar and page navigation for every manual page.
// Each page sets <body data-page="slug"> and lists its subsections as
// <section class="block" id="..." data-title="...">.
(function () {
  const SECTIONS = [
    ['index', 'Introducción'],
    ['estrategia', 'Estrategia'],
    ['lenguaje', 'Lenguaje y estilo'],
    null,
    ['logotipo', 'Logotipo'],
    ['tipografia', 'Tipografía'],
    ['color', 'Color'],
    ['merch', 'Merch'],
    ['aplicaciones', 'Aplicaciones'],
    null,
    ['retratos', 'Retratos'],
    ['descargas', 'Descargas'],
  ];
  const UPDATED = 'Noviembre 2026';
  const pages = SECTIONS.filter(Boolean);
  const current = document.body.dataset.page || 'index';
  const href = slug => (slug === 'index' ? './' : `${slug}.html`);
  const pad = n => String(n).padStart(2, '0');
  const dl = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M8 2v9M4 7.5 8 11.5l4-4M2.5 14h11"/></svg>';

  const subs = [...document.querySelectorAll('section.block[id][data-title]')];

  // Sidebar
  let n = 0;
  const items = SECTIONS.map(entry => {
    if (!entry) return '<li class="gap" aria-hidden="true"></li>';
    const [slug, title] = entry;
    n += 1;
    const active = slug === current;
    const sub = active && subs.length
      ? `<ul class="sub">${subs.map(s => `<li><a href="#${s.id}">${s.dataset.title}</a></li>`).join('')}</ul>`
      : '';
    return `<li class="${active ? 'is-active' : ''}"><a href="${href(slug)}"${active ? ' aria-current="page"' : ''}><span class="num">${pad(n)}</span>${title}</a>${sub}</li>`;
  }).join('');

  const side = document.createElement('aside');
  side.className = 'side';
  side.id = 'manual-nav';
  side.setAttribute('aria-label', 'Secciones del manual');
  side.innerHTML = `
    <a class="side__brand" href="./"><img src="img/logo-erik-david.png" alt="Erik David, Property Advisor" width="168" height="47"></a>
    <div class="side__meta"><strong>Manual de identidad visual</strong>Actualizado: ${UPDATED}</div>
    <nav><ul class="nav">${items}</ul></nav>
    <div class="side__foot">
      <a class="btn btn--gold" href="descargas.html">Descargar recursos ${dl}</a>
      <a class="salir" href="/api/manual-acceso?salir=1">Cerrar sesión</a>
    </div>`;
  document.body.prepend(side);

  // Mobile bar
  const bar = document.createElement('div');
  bar.className = 'topbar';
  bar.innerHTML = `<a href="./"><img src="img/logo-erik-david.png" alt="Erik David" width="132" height="37"></a><button type="button" aria-controls="manual-nav" aria-expanded="false">Menú</button>`;
  document.body.prepend(bar);
  const toggle = bar.querySelector('button');
  const setOpen = open => {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Cerrar' : 'Menú';
  };
  toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('nav-open')));
  side.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', e => {
    if (document.body.classList.contains('nav-open') && !e.target.closest('.side, .topbar')) setOpen(false);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });

  // Table of contents under the lead, if the page asks for one
  const toc = document.querySelector('[data-toc]');
  if (toc && subs.length) {
    toc.innerHTML = subs.map((s, i) => `<li><a href="#${s.id}"><span class="num">${pad(i + 1)}</span>${s.dataset.title}</a></li>`).join('');
  }

  // Number each block heading
  subs.forEach((s, i) => {
    const h = s.querySelector('h2');
    if (h && !h.querySelector('.num')) h.insertAdjacentHTML('afterbegin', `<span class="num">${pad(i + 1)}</span>`);
  });

  // Previous / next + footer
  const main = document.querySelector('.main');
  const idx = pages.findIndex(p => p[0] === current);
  const prev = pages[idx - 1];
  const next = pages[idx + 1];
  if (main) {
    main.insertAdjacentHTML('beforeend', `
      <nav class="pager" aria-label="Página anterior y siguiente">
        ${prev ? `<a href="${href(prev[0])}"><span class="label">← Anterior</span><b>${prev[1]}</b></a>` : '<span></span>'}
        ${next ? `<a href="${href(next[0])}"><span class="label">Siguiente →</span><b>${next[1]}</b></a>` : '<span></span>'}
      </nav>
      <footer class="foot"><span>Erik David · Property Advisor</span><span>Uso interno · No distribuir</span></footer>`);
  }

  // Highlight the subsection in view
  const links = [...side.querySelectorAll('.sub a')];
  if (links.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    subs.forEach(s => io.observe(s));
  }

  // Copy-to-clipboard buttons (colour codes)
  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const text = btn.dataset.copy;
    const fallback = () => {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      if (!ok) throw new Error('copy failed');
    };
    try {
      try { await navigator.clipboard.writeText(text); } catch { fallback(); }
      const old = btn.textContent;
      btn.textContent = 'Copiado';
      btn.classList.add('is-done');
      setTimeout(() => { btn.textContent = old; btn.classList.remove('is-done'); }, 1400);
    } catch { /* clipboard blocked: leave the code visible to copy by hand */ }
  });
})();
