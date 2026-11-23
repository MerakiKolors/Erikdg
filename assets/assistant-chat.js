(() => {
  const copy = {
    es: {
      launchTitle: '¿En qué te orientamos?',
      launchLabel: 'Asistente virtual',
      title: 'Asistente de Erik',
      status: 'Parsiani Real Estate · Miami',
      close: 'Cerrar chat',
      topics: ['Aria Reserve', 'Busco una propiedad', 'Me mudo a Miami', 'Hablar con Erik'],
      placeholder: 'Escribe tu pregunta…',
      send: 'Enviar',
      question: 'Tu pregunta',
      disclaimer: 'Respuestas a partir de la información publicada en este sitio. Un precio mostrado es el precio publicado; Erik confirma vigencia y disponibilidad. No compartas datos sensibles.',
      greeting: 'Hola, soy el asistente virtual de Erik David. Puedo ayudarte a explorar propiedades, conocer un proyecto o ponerte en contacto con Erik. ¿Qué estás buscando?',
      pending: '…',
      failed: 'No pude responder en este momento. Puedes escribir a Erik por WhatsApp, llamarlo al +1 (305) 902-0139 o enviarle un correo a Erik@Parsiani.com.',
      visit: 'Solicitar visita por WhatsApp',
      browse: 'Explorar propiedades en esta zona',
      talk: 'Hablar con Erik por WhatsApp',
      draft: (context, visit) => visit
        ? `Hola Erik, me gustaría solicitar una visita privada para ${context}.`
        : context ? `Hola Erik, me gustaría recibir orientación sobre ${context}.` : 'Hola Erik, me gustaría recibir orientación inmobiliaria.',
    },
    en: {
      launchTitle: 'How can we guide you?',
      launchLabel: 'Virtual assistant',
      title: "Erik's assistant",
      status: 'Parsiani Real Estate · Miami',
      close: 'Close chat',
      topics: ['Aria Reserve', "I'm looking for a property", "I'm moving to Miami", 'Talk with Erik'],
      placeholder: 'Type your question…',
      send: 'Send',
      question: 'Your question',
      disclaimer: 'Answers use information published on this website. A price shown here is the published asking price; Erik confirms whether it is current and whether the residence is available. Do not share sensitive details.',
      greeting: "Hi, I'm Erik David's virtual assistant. I can help you explore listings, learn about a development, or get in touch with Erik. What are you looking for?",
      pending: '…',
      failed: 'I could not reply just now. You can reach Erik on WhatsApp, call +1 (305) 902-0139, or email Erik@Parsiani.com.',
      visit: 'Request a viewing on WhatsApp',
      browse: 'Explore listings in this area',
      talk: 'Talk with Erik on WhatsApp',
      draft: (context, visit) => visit
        ? `Hi Erik, I'd like to request a private viewing for ${context}.`
        : context ? `Hi Erik, I'd like your guidance on ${context}.` : "Hi Erik, I'd like your real estate guidance.",
    },
  };

  const history = [];
  let links = new Set();
  let busy = false;
  let greetingNode = null;
  let catalog;
  let catalogRequest;

  function pageContext() {
    const page = location.pathname.split('/').pop();
    const legacyUnit = document.body.classList.contains('unit-view');
    const unit = legacyUnit || page === 'aria-reserve-3002.html'
      ? document.querySelector('#residence-page [data-visit-unit]')?.dataset.visitUnit
      : document.querySelector('main [data-visit-unit]:not(#residence-page *)')?.dataset.visitUnit;
    return {
      unit,
      neighborhood: catalog?.neighborhoods?.find(area => area.page === page)?.name,
      project: catalog?.developments?.find(development => development.page === page)?.name,
    };
  }


  function language() {
    return document.documentElement.lang === 'en' ? 'en' : 'es';
  }

  function text(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function ensureWidget() {
    let panel = document.querySelector('#chat-panel');
    if (panel) {
      panel.dataset.noTranslate = '';
      document.querySelector('#chat-launch')?.setAttribute('data-no-translate', '');
      return panel;
    }
    const launch = document.createElement('button');
    launch.className = 'chat-launch';
    launch.id = 'chat-launch';
    launch.type = 'button';
    launch.setAttribute('aria-expanded', 'false');
    launch.setAttribute('aria-controls', 'chat-panel');
    launch.dataset.noTranslate = '';
    launch.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H5l-3 2v-6A8.5 8.5 0 1 1 21 11.5Z"/><path d="M7 11h10M7 15h6"/></svg><span><strong></strong><small></small></span>';
    panel = document.createElement('section');
    panel.className = 'chat-panel';
    panel.id = 'chat-panel';
    panel.hidden = true;
    panel.dataset.noTranslate = '';
    panel.innerHTML = '<div class="chat-header"><div><strong></strong><small></small></div><button id="chat-close" type="button">×</button></div><div class="chat-messages" id="chat-messages" role="log" aria-live="polite" aria-relevant="additions"></div><div class="chat-topics"></div><form class="chat-input" id="chat-form"><input id="chat-question" maxlength="600" required><button type="submit"></button></form><a class="chat-transfer" id="chat-transfer" href="https://wa.me/13059020139" target="_blank" rel="noopener"></a><p class="chat-disclaimer"></p>';
    const topics = panel.querySelector('.chat-topics');
    for (let index = 0; index < 4; index += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      topics.append(button);
    }
    document.body.append(launch, panel);
    return panel;
  }

  const panel = ensureWidget();
  const launch = document.querySelector('#chat-launch');
  const log = document.querySelector('#chat-messages');
  const form = document.querySelector('#chat-form');
  const input = document.querySelector('#chat-question');
  const transfer = document.querySelector('#chat-transfer');
  const topicButtons = [...document.querySelectorAll('.chat-topics button')];

  function applyCopy() {
    const strings = copy[language()];
    text(launch.querySelector('strong'), strings.launchTitle);
    text(launch.querySelector('small'), strings.launchLabel);
    launch.setAttribute('aria-label', strings.launchLabel);
    text(panel.querySelector('.chat-header strong'), strings.title);
    text(panel.querySelector('.chat-header small'), strings.status);
    panel.setAttribute('aria-label', strings.title);
    document.querySelector('#chat-close')?.setAttribute('aria-label', strings.close);
    topicButtons.forEach((button, index) => text(button, strings.topics[index] || button.textContent));
    input.placeholder = strings.placeholder;
    input.setAttribute('aria-label', strings.question);
    text(form.querySelector('button'), strings.send);
    updateDraft();
    text(panel.querySelector('.chat-disclaimer'), strings.disclaimer);
    if (greetingNode && history.length === 0) text(greetingNode, strings.greeting);
  }

  function bubble(kind) {
    const node = document.createElement('div');
    node.className = kind === 'user' ? 'chat-bubble user' : 'chat-bubble';
    log.append(node);
    log.scrollTop = log.scrollHeight;
    return node;
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
  }

  function allowedHref(href) {
    const value = href.trim();
    if (links.has(value)) return value;
    const withoutLanguage = value.replace(/\?lang=(?:en|es)$/, '');
    if (links.has(withoutLanguage)) return withoutLanguage;
    return '';
  }

  function renderAnswer(node, value) {
    const html = escapeHtml(value).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, href) => {
      const safeHref = allowedHref(href);
      if (!safeHref) return label;
      const external = /^(https?:|mailto:|tel:)/.test(safeHref);
      const attributes = external ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${escapeHtml(safeHref)}"${attributes}>${label}</a>`;
    });
    node.innerHTML = html;
    log.scrollTop = log.scrollHeight;
  }

  function updateDraft() {
    const { unit, neighborhood, project } = pageContext();
    const strings = copy[language()];
    const lastQuestion = history.findLast(message => message.role === 'user')?.content || '';
    const words = lastQuestion.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
    const question = ' ' + words.join(' ') + ' ';
    const mentioned = catalog?.residences?.find(residence =>
      [residence.name, ...(residence.alsoCalled || [])].some(alias => question.includes(' ' + alias.toLowerCase() + ' '))
    );
    const subject = mentioned?.name || unit || neighborhood || project;
    const draft = strings.draft(subject, Boolean(unit || mentioned && /\b(visit\w*|viewing|showing)\b/i.test(lastQuestion)));
    transfer.href = `https://wa.me/13059020139?text=${encodeURIComponent(draft)}`;
    text(transfer, unit ? strings.visit : strings.talk);
    text(topicButtons[0], neighborhood ? strings.browse : strings.topics[0]);
  }

  function setOpen(open) {
    panel.hidden = !open;
    launch.setAttribute('aria-expanded', String(open));
    if (open) {
      input.focus();
      window.trackSiteChat?.('open');
    } else {
      launch.focus();
    }
  }

  function ensureLinks() {
    catalogRequest ??= fetch('assets/assistant-catalog.json')
      .then(response => {
        if (!response.ok) throw new Error('Catalog unavailable');
        return response.json();
      })
      .then(value => {
        catalog = value;
        links = new Set(Array.isArray(value.links) ? value.links : []);
        updateDraft();
      })
      .catch(() => { catalogRequest = undefined; });
    return catalogRequest;
  }

  async function ask(question) {
    const textValue = question.trim();
    if (!textValue || busy) return;
    busy = true;
    input.disabled = true;
    form.querySelector('button').disabled = true;
    history.push({ role: 'user', content: textValue.slice(0, 600) });
    bubble('user').textContent = textValue;
    const pending = bubble('assistant');
    pending.classList.add('pending');
    pending.textContent = copy[language()].pending;
    updateDraft();
    try {
      await ensureLinks();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          language: language(),
          page: `${location.pathname.split('/').pop() || 'index.html'}${location.hash}`,
          messages: history,
        }),
      });
      if (!response.ok || !response.body) {
        let message = copy[language()].failed;
        try {
          const payload = await response.json();
          if (payload?.error) message = payload.error;
        } catch { /* keep the local message */ }
        pending.classList.remove('pending');
        pending.textContent = message;
        history.pop();
        window.trackSiteChat?.('error');
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      pending.classList.remove('pending');
      while (true) {
        const step = await reader.read();
        if (step.done) break;
        answer += decoder.decode(step.value, { stream: true });
        renderAnswer(pending, answer);
      }
      answer += decoder.decode();
      if (!answer.trim()) {
        pending.textContent = copy[language()].failed;
        history.pop();
        window.trackSiteChat?.('error');
        return;
      }
      renderAnswer(pending, answer.trim());
      history.push({ role: 'assistant', content: answer.trim().slice(0, 4000) });
      updateDraft();
    } catch {
      pending.classList.remove('pending');
      pending.textContent = copy[language()].failed;
      history.pop();
      window.trackSiteChat?.('error');
    } finally {
      busy = false;
      input.disabled = false;
      form.querySelector('button').disabled = false;
      if (!panel.hidden) input.focus();
    }
  }

  launch.onclick = () => setOpen(panel.hidden);
  document.querySelector('#chat-close').onclick = () => setOpen(false);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });
  form.onsubmit = event => {
    event.preventDefault();
    const question = input.value;
    input.value = '';
    ask(question);
  };
  topicButtons.forEach((button, index) => {
    if (index === 3) {
      button.hidden = true;
      return;
    }
    button.onclick = () => {
      if (index === 0 && pageContext().neighborhood && document.getElementById('listings')) {
        setOpen(false);
        location.hash = 'listings';
      } else {
        ask(button.textContent);
      }
    };
  });
  window.addEventListener('hashchange', updateDraft);
  window.askAssistant = ask;
  window.answerChat = ask;

  if (!log.querySelector('[data-greeting]')) {
    const first = log.querySelector('.chat-bubble');
    if (first && /demostraci[oó]n|demo of Erik/i.test(first.textContent)) first.remove();
    greetingNode = bubble('assistant');
    greetingNode.dataset.greeting = '';
  } else {
    greetingNode = log.querySelector('[data-greeting]');
  }
  applyCopy();
  if (typeof window.applyLanguage === 'function') {
    document.querySelectorAll('[data-lang]').forEach(button => {
      button.addEventListener('click', () => queueMicrotask(applyCopy));
    });
  } else {
    new MutationObserver(applyCopy).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  const footer = document.querySelector('footer');
  if (footer) {
    new IntersectionObserver(entries => {
      launch.classList.toggle('compact-chat', entries[0].isIntersecting);
    }, { threshold: .1 }).observe(footer);
  }
  ensureLinks();
})();
