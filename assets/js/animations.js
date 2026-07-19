/**
 * animations.js
 * Page-load and pointer-driven motion. Kept separate from
 * main.js (interaction logic) so animation concerns stay
 * isolated — easy to strip out or extend per-page later.
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  runHeroEntrance();
  if (!prefersReducedMotion) runHeroParallax();

  /**
   * Orchestrated hero entrance. One deliberate sequence —
   * eyebrow/title/subtext/actions, then the image, then the
   * tracking card lands last, like it's "reporting in" once
   * the shipment photo has settled. Staggered, not simultaneous:
   * that reads as a single considered moment rather than
   * everything popping in at once.
   */
  function runHeroEntrance() {
    const sequence = [
      { el: document.querySelector('.eyebrow'), delay: 0 },
      { el: document.querySelector('.hero__title'), delay: 90 },
      { el: document.querySelector('.hero__subtext'), delay: 160 },
      { el: document.querySelector('.hero__actions'), delay: 230 },
      { el: document.querySelector('.hero__media'), delay: 120 },
      { el: document.querySelector('.tracking-preview'), delay: 420 },
    ].filter((item) => item.el);

    if (sequence.length === 0) return;

    if (prefersReducedMotion) {
      // Skip the animation entirely, but still reveal content —
      // reduced motion means no movement, not no content.
      sequence.forEach(({ el }) => {
        el.style.opacity = '1';
      });
      return;
    }

    sequence.forEach(({ el, delay }) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = `opacity 640ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform 640ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sequence.forEach(({ el }) => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
      });
    });
  }

  /**
   * Subtle pointer-driven tilt on the hero image, desktop only.
   * Deliberately small (max ~4deg) — this is ambient texture,
   * not the signature move, so it stays quiet.
   */
  function runHeroParallax() {
    const media = document.getElementById('hero-media');
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    if (!media || isTouchDevice) return;

    const maxTilt = 4;
    let frame = null;

    media.addEventListener('mousemove', (event) => {
      if (frame) cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const rect = media.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        media.style.transform = `perspective(1000px) rotateY(${x * maxTilt}deg) rotateX(${-y * maxTilt}deg)`;
      });
    });

    media.addEventListener('mouseleave', () => {
      if (frame) cancelAnimationFrame(frame);
      media.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    });
  }
})();