(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');

  for (const slideshow of document.querySelectorAll('[data-photo-fade]')) {
    const photos = [...slideshow.querySelectorAll('[data-fade-image]')];
    let active = 0;
    let visible = false;
    let timer;

    function advance() {
      if (document.body.classList.contains('paused')) return;
      const following = photos.map((_, offset) => (active + offset + 1) % photos.length)
        .find(index => index !== active && photos[index].naturalWidth > 0);
      if (following === undefined) return;

      photos[active].setAttribute('data-inactive', '');
      photos[active].setAttribute('aria-hidden', 'true');
      photos[following].removeAttribute('data-inactive');
      photos[following].removeAttribute('aria-hidden');
      active = following;
    }

    function updatePlayback() {
      clearInterval(timer);
      if (visible && !document.hidden && !motion.matches) {
        timer = setInterval(advance, 6200);
      }
    }

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    }).observe(slideshow);
    motion.addEventListener('change', updatePlayback);
    document.addEventListener('visibilitychange', updatePlayback);
    updatePlayback();
  }
})();
