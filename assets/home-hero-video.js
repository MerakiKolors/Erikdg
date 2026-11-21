(() => {
  const video = document.querySelector('.home-hero-video');
  if (!video) return;
  const playButton = document.querySelector('.hero-video-play');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let frame;

  function blend() {
    const duration = video.duration;
    if (Number.isFinite(duration) && duration > 0) {
      const fade = Math.min(0.55, duration / 4);
      const opacity = Math.min(1, video.currentTime / fade, (duration - video.currentTime) / fade);
      video.style.opacity = String(Math.max(0, opacity));
    }
    frame = requestAnimationFrame(blend);
  }

  function playVideo() {
    video.muted = true;
    video.play().catch(error => {
      if (error.name === 'NotAllowedError') playButton.hidden = false;
    });
  }

  function syncPlayback() {
    if (visible && !document.hidden && !reducedMotion.matches && !document.body.classList.contains('paused')) {
      playVideo();
    } else {
      video.pause();
      if (reducedMotion.matches) video.style.opacity = '0';
    }
  }

  playButton.addEventListener('click', playVideo);
  video.addEventListener('playing', () => {
    playButton.hidden = true;
    cancelAnimationFrame(frame);
    blend();
  });
  video.addEventListener('pause', () => cancelAnimationFrame(frame));
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  }).observe(video);
  new MutationObserver(syncPlayback).observe(document.body, {attributes:true, attributeFilter:['class']});
  reducedMotion.addEventListener('change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
})();
