(() => {
  const listings = new Set([
    'aria-reserve-3002', 'aria-reserve-2204', 'aria-reserve-3301',
    'aria-reserve-3407', 'brickell-flatiron-ph5503'
  ]);
  const production = ['www.erikdavidg.com', 'erikdavidg.com'].includes(location.hostname);
  const listingId = url => {
    const slug = url.pathname.split('/').pop().replace(/\.html$/, '');
    if (listings.has(slug)) return slug;
    if (['#residence-3002', '#residence-4602', '#unit-tour'].includes(url.hash)) return 'aria-reserve-3002';
    return '';
  };

  if (production && !navigator.globalPrivacyControl) {
    window.va = window.va || function () {
      (window.vaq = window.vaq || []).push(arguments);
    };
    window.va('beforeSend', event => {
      const url = new URL(event.url, location.origin);
      url.search = '';
      url.hash = '';
      return { ...event, url: url.href };
    });
    const collector = document.createElement('script');
    collector.defer = true;
    collector.src = '/_vercel/insights/script.js';
    document.head.append(collector);
  }

  // Meta Pixel. Pega aquí el ID (solo números) desde Meta Events Manager.
  // Vacío = el Pixel no se carga. Solo corre en producción y respeta Global Privacy Control.
  const metaPixelId = '';
  const metaEnabled = production && !navigator.globalPrivacyControl && /^\d+$/.test(metaPixelId);
  const metaEvents = {
    listing_open: 'ViewContent',
    contact_handoff: 'Contact',
    viewing_request_handoff: 'Schedule'
  };

  if (metaEnabled) {
    const fbq = window.fbq = function () {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    const pixel = document.createElement('script');
    pixel.async = true;
    pixel.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.append(pixel);
    fbq('init', metaPixelId);
    fbq('track', 'PageView');
  }

  function track(event, properties) {
    (window.dataLayer ||= []).push({ event, ...properties });
    if (production && !navigator.globalPrivacyControl) window.va?.('event', { name: event, data: properties });
    if (metaEnabled && metaEvents[event]) {
      const listing = properties?.listing;
      window.fbq('track', metaEvents[event], listing ? { content_ids: [listing], content_type: 'product' } : {});
    }
  }

  function trackContact(channel, placement) {
    track('contact_handoff', { channel, placement });
  }

  window.trackSiteContact = trackContact;
  window.trackSiteChat = action => {
    if (['open', 'error'].includes(action)) track('chat_' + action, { placement: 'widget' });
  };

  function updateVisitLinks() {
    const english = document.documentElement.lang === 'en';
    for (const link of document.querySelectorAll('[data-visit-unit]')) {
      const unit = link.dataset.visitUnit;
      const draft = english
        ? `Hi Erik, I'd like to request a private viewing for ${unit}.`
        : `Hola Erik, me gustaría solicitar una visita privada para ${unit}.`;
      link.href = 'https://wa.me/13059020139?text=' + encodeURIComponent(draft);
    }
  }

  function updateListing() {
    const next = listingId(new URL(location.href));
    if (next && next !== openedListing) track('listing_open', { listing: next });
    openedListing = next;
  }

  let openedListing = '';
  updateListing();
  updateVisitLinks();
  window.addEventListener('hashchange', updateListing);
  new MutationObserver(updateVisitLinks).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang']
  });

  document.addEventListener('submit', event => {
    if (event.target.matches('.finder-form') && !event.target.closest('#residence-page')) {
      track('listings_browse', { entry: 'search' });
    }
  }, true);

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href);
    if (link.hasAttribute('data-visit-unit')) {
      track('viewing_request_handoff', { channel: 'whatsapp', listing: listingId(new URL(location.href)) });
    } else if (url.origin === location.origin && url.hash === '#listings') {
      track('listings_browse', { entry: 'link' });
    } else if (url.origin === location.origin && url.hash === '#contacto') {
      track('contact_section_open', { entry: 'link' });
    } else if (url.protocol === 'tel:' || url.protocol === 'mailto:' || url.hostname === 'wa.me') {
      const channel = { 'tel:': 'phone', 'mailto:': 'email' }[url.protocol] || 'whatsapp';
      trackContact(channel, link.id === 'chat-transfer' ? 'chat' : 'link');
    }
  }, true);
})();
