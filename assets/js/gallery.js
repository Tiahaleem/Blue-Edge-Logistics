/**
 * gallery.js
 * Two independent pieces: category filtering, and a custom
 * lightbox (no browser popups, no third-party library). The
 * lightbox reuses the same accessibility pattern as the mobile
 * nav panel in main.js — focus handling, ESC to close, overlay
 * click to close — since that pattern already works well.
 */

(function () {
  'use strict';

  const filterButtons = document.querySelectorAll('.gallery-filter');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (filterButtons.length > 0 && galleryItems.length > 0) {
    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;

        filterButtons.forEach((btn) => {
          btn.classList.toggle('is-active', btn === button);
          btn.setAttribute('aria-selected', btn === button ? 'true' : 'false');
        });

        galleryItems.forEach((item) => {
          const matches = filter === 'all' || item.dataset.category === filter;
          item.classList.toggle('is-hidden', !matches);
        });
      });
    });
  }

  // --- Lightbox ---

  const overlay = document.getElementById('lightbox-overlay');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  if (!overlay || !lightbox || !lightboxImage || !galleryItems.length) return;

  let currentIndex = 0;
  let lastFocusedElement = null;

  function getVisibleItems() {
    return Array.from(galleryItems).filter((item) => !item.classList.contains('is-hidden'));
  }

  function openLightbox(item) {
    const visibleItems = getVisibleItems();
    currentIndex = visibleItems.indexOf(item);
    if (currentIndex === -1) return;

    lastFocusedElement = document.activeElement;
    showImage(visibleItems[currentIndex]);

    overlay.hidden = false;
    void overlay.offsetWidth;
    overlay.classList.add('is-visible');
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');

    document.body.style.overflow = 'hidden';
    closeBtn.focus();

    document.addEventListener('keydown', handleKeydown);
  }

  function closeLightbox() {
    overlay.classList.remove('is-visible');
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');

    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKeydown);

    const onTransitionEnd = () => {
      overlay.hidden = true;
      overlay.removeEventListener('transitionend', onTransitionEnd);
    };
    overlay.addEventListener('transitionend', onTransitionEnd);

    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function showImage(item) {
    const img = item.querySelector('img');
    const captionEl = item.querySelector('.gallery-item__caption');
    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt;
    lightboxCaption.textContent = captionEl ? captionEl.textContent : '';
  }

  function showNext() {
    const visibleItems = getVisibleItems();
    currentIndex = (currentIndex + 1) % visibleItems.length;
    showImage(visibleItems[currentIndex]);
  }

  function showPrev() {
    const visibleItems = getVisibleItems();
    currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
    showImage(visibleItems[currentIndex]);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeLightbox();
    } else if (event.key === 'ArrowRight') {
      showNext();
    } else if (event.key === 'ArrowLeft') {
      showPrev();
    } else if (event.key === 'Tab') {
      // Simple focus trap across the 4 focusable controls.
      const focusable = [prevBtn, nextBtn, closeBtn];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => openLightbox(item));
  });

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', closeLightbox);
  nextBtn.addEventListener('click', showNext);
  prevBtn.addEventListener('click', showPrev);
})();