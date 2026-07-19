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