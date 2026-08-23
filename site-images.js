(() => {
  document.querySelectorAll('[data-image-bg]').forEach(el => {
    const src = WD_IMAGES[el.dataset.imageBg];
    if (src) el.style.backgroundImage = `url("${src}")`;
  });
  document.querySelectorAll('[data-image-src]').forEach(el => {
    const src = WD_IMAGES[el.dataset.imageSrc];
    if (src) el.src = src;
  });
})();
