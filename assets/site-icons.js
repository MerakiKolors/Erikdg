(() => {
  const paths = {
    '↗': 'M4 20 20 4M4 4h16v16',
    '→': 'M3 12h18M14 5l7 7-7 7',
    '←': 'M21 12H3m7-7-7 7 7 7',
    '↓': 'M12 3v18m-7-7 7 7 7-7',
    '↑': 'M12 21V3m-7 7 7-7 7 7',
    '▷': 'M7 4v16l13-8z',
    'Ⅱ': 'M9 5v14m6-14v14',
    '♡': 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z',
    '♥': 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z',
    '◇': 'M12 3l9 9-9 9-9-9z',
    '✧': 'M12 2c0 7 3 10 10 10-7 0-10 3-10 10 0-7-3-10-10-10 7 0 10-3 10-10z',
    '⌂': 'M3 11l9-8 9 8M6 9v12h12V9m-8 12v-6h4v6',
    '×': 'M6 6l12 12M18 6 6 18'
  };
  const ns = 'http://www.w3.org/2000/svg';
  const symbols = /([↗→←↓↑▷Ⅱ♡♥◇✧⌂]|×(?=\s*$))(?:(?:\uFE0E|\uFE0F))?/u;
  const excluded = 'script,style,svg,textarea,option,[contenteditable=true],.chat-bubble.user';

  function makeIcon(symbol) {
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', /[↗→←↓↑]/.test(symbol) ? 'site-icon text-arrow' : 'site-icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', paths[symbol]);
    if (symbol === '♥') path.setAttribute('fill', 'currentColor');
    svg.append(path);
    return svg;
  }

  function replaceIcons(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest(excluded) || !symbols.test(node.data)) return;
    if (node.data.trim() === '×' && parent.matches('button') && !parent.hasAttribute('aria-label')) {
      parent.setAttribute('aria-label', document.documentElement.lang === 'es' ? 'Cerrar' : 'Close');
    }
    const output = document.createDocumentFragment();
    const textNodes = [];
    for (const part of node.data.split(symbols)) {
      if (!part) continue;
      if (paths[part]) output.append(makeIcon(part));
      else {
        const text = document.createTextNode(part);
        textNodes.push(text);
        output.append(text);
      }
    }
    document.dispatchEvent(new CustomEvent('site-icons:split', {
      detail: { source: node, textNodes, splitText: value => value.split(symbols).filter(part => part && !paths[part]) }
    }));
    node.replaceWith(output);
  }

  function scan(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      replaceIcons(root);
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const candidates = [];
    while (walker.nextNode()) {
      if (symbols.test(walker.currentNode.data)) candidates.push(walker.currentNode);
    }
    candidates.forEach(replaceIcons);
  }

  scan(document.body);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') scan(record.target);
      else for (const node of record.addedNodes) {
        if (node.isConnected) scan(node);
      }
    }
  }).observe(document.body, { childList: true, characterData: true, subtree: true });
})();
