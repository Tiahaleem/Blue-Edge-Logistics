/**
 * main.js
 * Global site behavior shared across every public page:
 * the slide-out panel (mobile nav + desktop info panel).
 *
 * Kept dependency-free on purpose — no framework, no build
 * step, so any page can just <script src="assets/js/main.js">
 * and get this behavior for free.
 */

(function () {
  'use strict';

  const toggleBtn = document.getElementById('panel-toggle');
  const closeBtn = document.getElementById('side-panel-close');
  const panel = document.getElementById('side-panel');
  const overlay = document.getElementById('panel-overlay');

  // Guard: pages that don't include the panel markup simply skip this.
  if (!toggleBtn || !panel || !overlay) return;

  let lastFocusedElement = null;

  function openPanel() {
    lastFocusedElement = document.activeElement;

    overlay.hidden = false;
    // Force a reflow so the opacity transition actually plays
    // instead of jumping straight to the end state.
    void overlay.offsetWidth;
    overlay.classList.add('is-visible');

    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    toggleBtn.setAttribute('aria-expanded', 'true');

    document.body.style.overflow = 'hidden';

    // Move focus into the panel for keyboard/screen-reader users.
    closeBtn.focus();

    document.addEventListener('keydown', handleKeydown);
  }

  function closePanel() {
    overlay.classList.remove('is-visible');
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    toggleBtn.setAttribute('aria-expanded', 'false');

    document.body.style.overflow = '';

    document.removeEventListener('keydown', handleKeydown);

    // Wait for the close transition before hiding the overlay
    // from the accessibility tree / layout entirely.
    const onTransitionEnd = () => {
      overlay.hidden = true;
      overlay.removeEventListener('transitionend', onTransitionEnd);
    };
    overlay.addEventListener('transitionend', onTransitionEnd);

    // Return focus to whatever triggered the panel.
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closePanel();
      return;
    }

    // Basic focus trap: keep Tab cycling within the panel while open.
    if (event.key === 'Tab') {
      const focusable = panel.querySelectorAll(
        'a[href], button:not([disabled])'
      );
      if (focusable.length === 0) return;

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

  toggleBtn.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
})();

/**
 * Promo banner slider. Auto-rotates every 5s, no visible
 * prev/next controls. Pauses on hover so the message can
 * actually be read. A discrete timed swap (not a continuous
 * marquee) since this is short text meant to be read, not
 * glanced at mid-motion.
 */
(function () {
  'use strict';

  const banner = document.querySelector('.promo-banner');
  const slides = document.querySelectorAll('.promo-slide');

  if (!banner || slides.length < 2) return;

  const intervalMs = 5000;
  let activeIndex = 0;
  let timer = null;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
    });
  }

  function next() {
    activeIndex = (activeIndex + 1) % slides.length;
    showSlide(activeIndex);
  }

  function start() {
    if (timer) return;
    timer = setInterval(next, intervalMs);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  showSlide(activeIndex);
  start();

  banner.addEventListener('mouseenter', stop);
  banner.addEventListener('mouseleave', start);
})();

/**
 * Newsletter form. Client-side validation only for now — no
 * backend exists yet, so this just confirms the email looks
 * valid and shows an inline message. Swap the TODO block for
 * a real fetch() call to the subscribe endpoint once the
 * Express API is live.
 */
(function () {
  'use strict';

  const form = document.getElementById('newsletter-form');
  const emailInput = document.getElementById('newsletter-email');
  const message = document.getElementById('newsletter-message');

  if (!form || !emailInput || !message) return;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();

    if (!emailPattern.test(email)) {
      message.textContent = 'Please enter a valid email address.';
      return;
    }

    // TODO: replace with a real request once the backend exists, e.g.
    // fetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) })
    message.textContent = `Thanks — we'll send updates to ${email}.`;
    form.reset();
  });
})();

/**
 * Back-to-top button. Appears once the user has scrolled past
 * roughly one viewport height, so it doesn't show up while
 * they're still looking at the hero.
 */
(function () {
  'use strict';

  const button = document.getElementById('back-to-top');
  if (!button) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  function toggleVisibility() {
    button.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
  }

  toggleVisibility();
  window.addEventListener('scroll', toggleVisibility, { passive: true });

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  });
})();

/**
 * Copyright year — one less thing to remember to update by hand.
 */
(function () {
  'use strict';

  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();