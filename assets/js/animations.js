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

  // Declared here, before first use below — `let` bindings exist
  // in a temporal dead zone until their declaration line actually
  // runs, so this has to come before runScrollReveal() is called,
  // even though the function that reads it is defined further down.
  let scrollRevealObserver = null;

  runHeroEntrance();
  if (!prefersReducedMotion) runHeroParallax();
  runScrollReveal();
  runStatCounters();

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
      el.style.transform = 'translateY(16px)';
      el.style.transition = `opacity 480ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform 520ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`;
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

  /**
   * Generic scroll-triggered reveal for any element with class
   * "reveal-up" (CSS handles the actual opacity/transform states
   * in style.css — this only toggles .is-visible). Reused across
   * sections instead of writing bespoke reveal logic per section.
   *
   * Siblings within the same parent are staggered by 80ms so a
   * row of cards reveals left-to-right rather than all at once.
   */
  function getScrollRevealObserver() {
    if (scrollRevealObserver) return scrollRevealObserver;

    const groups = new Map();

    scrollRevealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          const parent = el.parentElement;
          const siblingIndex = groups.has(parent)
            ? groups.get(parent)
            : 0;
          groups.set(parent, siblingIndex + 1);

          setTimeout(() => {
            el.classList.add('is-visible');
          }, siblingIndex * 80);

          scrollRevealObserver.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    return scrollRevealObserver;
  }

  /**
   * Scans for .reveal-up/.reveal-left/.reveal-right elements and
   * observes any that aren't already tracked. Safe to call more
   * than once — e.g. after injecting new content dynamically
   * (the tracking page's results, rendered via JS after a search)
   * — since already-processed elements are skipped rather than
   * re-observed. Exposed on window so other scripts can trigger
   * a re-scan without depending on load order.
   */
  function runScrollReveal() {
    const items = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
    if (items.length === 0) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = getScrollRevealObserver();

    items.forEach((el) => {
      if (el.classList.contains('is-visible') || el.dataset.revealObserved) return;
      el.dataset.revealObserved = 'true';
      observer.observe(el);
    });
  }

  window.reinitScrollReveal = runScrollReveal;

  /**
   * Count-up animation for any element with a `data-count-to`
   * attribute. The element's markup already contains the real
   * final value (e.g. "150+") — that's the no-JS fallback. On
   * load we stash the non-numeric suffix, reset the display to
   * 0, then animate up to the target once it scrolls into view.
   * Reduced motion / no observer support: just leave the real
   * value in place, no animation, no risk of it getting stuck.
   */
  function runStatCounters() {
    const counters = document.querySelectorAll('[data-count-to]');
    if (counters.length === 0) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      return;
    }

    counters.forEach((el) => {
      const suffix = el.textContent.replace(/[\d,]/g, '');
      el.dataset.suffix = suffix;
      el.textContent = '0' + suffix;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  function animateCount(el) {
    const target = parseInt(el.dataset.countTo, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic — fast start, gentle settle
      const value = Math.round(target * eased);

      el.textContent = value.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toLocaleString() + suffix;
      }
    }

    requestAnimationFrame(tick);
  }
})();