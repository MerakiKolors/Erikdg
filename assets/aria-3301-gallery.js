(() => {
  const dialog = document.querySelector('#photo-dialog');
  const image = dialog.querySelector('img');
  const caption = dialog.querySelector('#photo-caption');
  const count = dialog.querySelector('#photo-count');
  const headerPhotos = [...document.querySelectorAll('[data-header-gallery] img')];
  const galleryPhotos = [...document.querySelectorAll('[data-gallery-photo] img')];
  let photos = headerPhotos;
  let current = 0;
  function show(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    image.src = photo.getAttribute('src');
    image.alt = photo.alt;
    caption.textContent = photo.alt;
    count.textContent = `${current + 1} / ${photos.length}`;
  }
  document.querySelector('main').addEventListener('click', event => {
    const button = event.target.closest('[data-header-photo], [data-gallery-photo]');
    if (!button) return;
    const header = button.hasAttribute('data-header-photo');
    photos = header ? headerPhotos : galleryPhotos;
    show(Number(header ? button.dataset.headerPhoto : button.dataset.galleryPhoto));
    dialog.showModal();
  });
  document.querySelector('.gallery-filters').addEventListener('click', event => {
    const selected = event.target.closest('[data-gallery-filter]');
    if (!selected) return;
    document.querySelectorAll('[data-gallery-filter]').forEach(button => button.setAttribute('aria-pressed', String(button === selected)));
    document.querySelectorAll('[data-gallery-category]').forEach(figure => {
      figure.hidden = selected.dataset.galleryFilter !== 'all' && figure.dataset.galleryCategory !== selected.dataset.galleryFilter;
    });
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
