(() => {
  const gallery = document.querySelector('[data-neighborhood-gallery]');
  const photos = Array.from(gallery.querySelectorAll('figure'));
  const controls = gallery.querySelector('.gallery-controls');
  const counter = controls.querySelector('output');
  let current = 0;

  function showPhoto(index) {
    current = (index + photos.length) % photos.length;
    const previous = (current - 1 + photos.length) % photos.length;
    const next = (current + 1) % photos.length;

    for (const [position, photo] of photos.entries()) {
      photo.dataset.position = position === current ? 'current'
        : position === previous ? 'previous'
        : position === next ? 'next'
        : 'offscreen';
      photo.inert = position !== current;
    }

    counter.textContent = (current + 1) + ' / ' + photos.length;
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-step]');
    if (button) showPhoto(current + Number(button.dataset.step));
  });

  controls.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    showPhoto(current + (event.key === 'ArrowRight' ? 1 : -1));
  });

  gallery.classList.add('gallery-ready');
  showPhoto(current);
  controls.hidden = false;
})();
