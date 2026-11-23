(() => {
  const storageKey = 'erik-listing-favorites';
  const local = (spanish, english) => document.documentElement.lang === 'en' ? english : spanish;
  const cards = [...document.querySelectorAll('.listing-card[data-listing]')];
  const readFavorites = () => {
    try {
      const ids = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return new Set(Array.isArray(ids) ? ids : []);
    } catch {
      return new Set();
    }
  };
  let favorites = readFavorites();

  function updateSaveButtons() {
    const english = document.documentElement.lang === 'en';
    for (const card of cards) {
      const button = card.querySelector('.listing-save');
      const saved = favorites.has(card.dataset.listing);
      const label = english
        ? (saved ? 'Remove from saved listings' : 'Save listing')
        : (saved ? 'Quitar de favoritos' : 'Guardar unidad');
      button.setAttribute('aria-pressed', String(saved));
      if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label);
    }
  }

  for (const card of cards) {
    const id = card.dataset.listing;
    const media = card.querySelector('.listing-media');
    const photos = media.dataset.photos.split('|');
    const image = media.querySelector('img');
    const dots = [...media.querySelectorAll('[data-photo-index]')];
    let index = 0;

    function showPhoto(target) {
      index = (target + photos.length) % photos.length;
      image.src = photos[index];
      dots.forEach((dot, position) => dot.setAttribute('aria-pressed', String(position === index)));
    }

    media.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.matches('[data-slide]')) showPhoto(index + Number(button.dataset.slide));
      if (button.matches('[data-photo-index]')) showPhoto(Number(button.dataset.photoIndex));
      if (button.matches('.listing-save')) {
        if (favorites.has(id)) favorites.delete(id);
        else favorites.add(id);
        try { localStorage.setItem(storageKey, JSON.stringify([...favorites])); } catch {}
        updateSaveButtons();
      }
    });
  }

  const filters = document.querySelector('.listing-filters');
  const listingSection = filters?.closest('section');
  const listingCards = cards.filter(card => listingSection?.contains(card));
  function updateListings() {
    if (!filters) return;
    const data = new FormData(filters);
    const normalize = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    const query = normalize(data.get('search'));
    const market = data.get('market');
    const location = data.get('location');
    const kind = data.get('kind');
    const bedrooms = Number(data.get('bedrooms'));
    const maxPrice = Number(data.get('maxPrice'));
    const sort = data.get('sort');
    const ordered = [...listingCards];
    if (sort) ordered.sort((a, b) => {
      const first = Number(a.dataset.price) || 0;
      const second = Number(b.dataset.price) || 0;
      if (!first || !second) return Number(!first) - Number(!second);
      return sort === 'low' ? first - second : second - first;
    });
    let count = 0;
    ordered.forEach((card, index) => {
      const {market: offer, neighborhood, kind: type, bedrooms: beds, price} = card.dataset;
      const name = normalize(card.querySelector('h3').textContent + ' ' + neighborhood + ' Miami');
      const matches = (!query || name.includes(query))
        && (!market || market === offer)
        && (!location || location === neighborhood)
        && (!kind || kind === type)
        && (!bedrooms || Number(beds) >= bedrooms)
        && (!maxPrice || (Number(price) > 0 && Number(price) <= maxPrice));
      card.hidden = !matches;
      card.style.order = String(index);
      if (matches) count++;
    });
    listingSection.querySelector('.listing-count').textContent = count + ' ' + (count === 1 ? local('unidad', 'listing') : local('unidades', 'listings'));
    listingSection.querySelector('.listing-empty').hidden = count > 0;
  }
  if (filters) {
    const query = new URLSearchParams(location.search);
    for (const name of ['market', 'location', 'kind']) {
      const value = query.get(name);
      const candidates = name === 'market'
        ? [...filters.querySelectorAll('[name="market"]')]
        : [...filters.elements[name].options];
      if (candidates.some(option => option.value === value)) filters.elements[name].value = value;
    }
    const budget = Number(query.get('maxPrice'));
    if (Number.isFinite(budget) && budget > 0) filters.elements.maxPrice.value = String(budget);
    filters.addEventListener('input', updateListings);
    filters.addEventListener('submit', event => event.preventDefault());
    filters.addEventListener('reset', () => queueMicrotask(updateListings));
  }

  let renderedLanguage;
  function updateLanguage() {
    const language = document.documentElement.lang;
    if (language === renderedLanguage) return;
    renderedLanguage = language;
    updateSaveButtons();
    updateListings();
  }
  new MutationObserver(updateLanguage).observe(document.documentElement, {
    attributes:true,
    attributeFilter:['lang']
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey) return;
    favorites = readFavorites();
    updateSaveButtons();
  });
  updateLanguage();
})();
