(() => {
  const carousel = document.querySelector('.listing-header-carousel');
  const photoButton = carousel.querySelector('[data-header-photo]');
  const slides = [...photoButton.querySelectorAll('img')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let visible = false;
  let timer;

  function advance() {
    if (carousel.matches(':hover, :focus-within') || document.querySelector('#photo-dialog').open) return;
    const next = (current + 1) % slides.length;
    if (!slides[next].naturalWidth) return;
    slides[current].setAttribute('aria-hidden', 'true');
    slides[next].setAttribute('aria-hidden', 'false');
    photoButton.dataset.headerPhoto = slides[next].dataset.slideIndex;
    current = next;
  }

  function updatePlayback() {
    clearInterval(timer);
    if (visible && !document.hidden && !motion.matches) {
      timer = setInterval(advance, 6500);
    }
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updatePlayback();
  }).observe(carousel);
  motion.addEventListener('change', updatePlayback);
  document.addEventListener('visibilitychange', updatePlayback);
  updatePlayback();
})();
