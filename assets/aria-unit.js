(() => {
  const dialog = document.querySelector('#photo-dialog');
  const image = dialog.querySelector('img');
  const caption = dialog.querySelector('#photo-caption');
  const count = dialog.querySelector('#photo-count');
  const photos = [...document.querySelectorAll('.aria-unit-gallery [data-header-photo] img')];
  const filters = document.querySelector('.gallery-filters');
  let current = 0;

  filters?.addEventListener('click', event => {
    const selected = event.target.closest('[data-gallery-filter]');
    if (!selected) return;
    const category = selected.dataset.galleryFilter;
    filters.querySelectorAll('[data-gallery-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button === selected));
    });
    document.querySelectorAll('[data-gallery-category]').forEach(figure => {
      figure.hidden = category !== 'all' && figure.dataset.galleryCategory !== category;
    });
  });

  function show(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    const label = photo.alt;
    image.src = photo.getAttribute('src');
    image.alt = label;
    caption.textContent = label;
    count.textContent = (current + 1) + ' / ' + photos.length;
  }

  document.querySelector('main').addEventListener('click', event => {
    const button = event.target.closest('[data-header-photo]');
    if (!button) return;
    show(Number(button.dataset.headerPhoto));
    dialog.showModal();
  });
  dialog.querySelector('#photo-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('#photo-prev').addEventListener('click', () => show(current - 1));
  dialog.querySelector('#photo-next').addEventListener('click', () => show(current + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
})();

const rentalForm = document.querySelector('.rental-form');
if (rentalForm) {
  const fields = [...rentalForm.querySelectorAll('input')];
  const monthlyOutput = document.querySelector('[data-rental-total="monthly"]');
  const initialOutput = document.querySelector('[data-rental-total="initial"]');

  function updateRentalEstimate() {
    const hasEstimate = rentalForm.checkValidity() && fields.some(field => field.value !== '');
    const [rent, fees, deposit, moveIn] = fields.map(field => field.valueAsNumber || 0);
    const monthly = rent + fees;
    const money = new Intl.NumberFormat(document.documentElement.lang === 'en' ? 'en-US' : 'es-CL', {
      minimumFractionDigits:2, maximumFractionDigits:2
    });
    monthlyOutput.textContent = hasEstimate ? 'US$' + money.format(monthly) : '—';
    initialOutput.textContent = hasEstimate ? 'US$' + money.format(monthly + deposit + moveIn) : '—';
  }

  rentalForm.addEventListener('input', updateRentalEstimate);
  rentalForm.addEventListener('submit', event => event.preventDefault());
  document.querySelectorAll('[data-project-lang]').forEach(button => {
    button.addEventListener('click', updateRentalEstimate);
  });
}
