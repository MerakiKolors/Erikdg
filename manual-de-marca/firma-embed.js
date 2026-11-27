// Loads the real email signature from /firma.html (single source of truth)
// and lets people copy it as rich HTML for Gmail.
(function () {
  const box = document.getElementById('signature');
  const btn = document.getElementById('copy-signature');
  const status = document.getElementById('signature-status');
  if (!box || !btn) return;

  fetch('/firma.html', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const sig = doc.getElementById('signature');
      if (!sig) throw new Error('missing');
      box.innerHTML = sig.innerHTML;
      btn.disabled = false;
    })
    .catch(() => {
      box.innerHTML = '<p>No se pudo cargar la firma. Ábrela en <a href="/firma.html" target="_blank" rel="noopener">erikdavidg.com/firma.html</a>.</p>';
    });

  const done = ok => {
    status.textContent = ok ? 'Firma copiada. Pégala en Gmail.' : 'No se pudo copiar. Selecciónala con el ratón y copia.';
  };
  const fallback = () => {
    const range = document.createRange();
    range.selectNodeContents(box);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    sel.removeAllRanges();
    done(ok);
  };
  btn.addEventListener('click', () => {
    if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
      navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([box.innerHTML], { type: 'text/html' }),
        'text/plain': new Blob([box.innerText], { type: 'text/plain' }),
      })]).then(() => done(true), fallback);
    } else {
      fallback();
    }
  });
})();
