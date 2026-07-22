/**
 * admin-nav.js
 * Mobile sidebar drawer — shared across every admin page
 * (dashboard, shipments, shipment-form, settings). Same
 * accessible pattern as the public site's mobile nav panel:
 * focus moves in on open, Escape closes it, clicking the
 * overlay closes it, Tab is trapped inside while open.
 */

(function () {
  'use strict';

  const toggleBtn = document.getElementById('admin-menu-toggle');
  const closeBtn = document.getElementById('admin-sidebar-close');
  const sidebar = document.getElementById('admin-sidebar');
  const overlay = document.getElementById('admin-sidebar-overlay');

  if (!toggleBtn || !sidebar || !overlay) return;

  let lastFocusedElement = null;

  function openSidebar() {
    lastFocusedElement = document.activeElement;

    overlay.hidden = false;
    void overlay.offsetWidth;
    overlay.classList.add('is-visible');

    sidebar.classList.add('is-open');
    toggleBtn.setAttribute('aria-expanded', 'true');

    document.body.style.overflow = 'hidden';

    if (closeBtn) closeBtn.focus();

    document.addEventListener('keydown', handleKeydown);
  }

  function closeSidebar() {
    overlay.classList.remove('is-visible');
    sidebar.classList.remove('is-open');
    toggleBtn.setAttribute('aria-expanded', 'false');

    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKeydown);

    const onTransitionEnd = () => {
      overlay.hidden = true;
      overlay.removeEventListener('transitionend', onTransitionEnd);
    };
    overlay.addEventListener('transitionend', onTransitionEnd);

    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeSidebar();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = sidebar.querySelectorAll('a[href], button:not([disabled])');
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

  toggleBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  // If the viewport is resized past the mobile breakpoint while
  // the drawer is open, reset it — otherwise it could stay
  // "open" (transform: translateX(0)) but invisible/misplaced
  // once the desktop sidebar layout takes over.
  const mobileQuery = window.matchMedia('(max-width: 768px)');
  mobileQuery.addEventListener('change', (event) => {
    if (!event.matches) {
      overlay.classList.remove('is-visible');
      overlay.hidden = true;
      sidebar.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
})();