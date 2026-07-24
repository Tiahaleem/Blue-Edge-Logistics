/**
 * dashboard.js
 * Loads the real logged-in admin's name, the 5 most recent real
 * shipments, and real stat counts (total/in-transit/delivered/
 * pending) — all from the actual backend now. Self-contained
 * (doesn't depend on the public site's animations.js) since the
 * admin area is treated as a separate app.
 */

(function () {
  'use strict';

  const API_BASE_URL = '';

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /**
   * Loads the real logged-in admin's profile to replace the
   * static "Welcome back, Admin" placeholder and the plain "A"
   * avatar with the actual name — this page never had a reason
   * to know who was logged in until the Settings/profile system
   * existed, so it was left as a placeholder until now.
   */
  async function loadWelcomeName() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        credentials: 'include',
      });

      if (!res.ok) return;

      const { admin } = await res.json();
      const name = admin.full_name || 'Admin';

      const titleEl = document.querySelector('.admin-topbar__title');
      const avatarEl = document.querySelector('.admin-topbar__avatar');

      if (titleEl) titleEl.textContent = `Welcome back, ${name}`;
      if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    } catch (err) {
      // Non-fatal — the static placeholder just stays as-is.
    }
  }

  /**
   * Loads the 5 most recent real shipments for the dashboard
   * preview table. Reuses the same GET /api/shipments endpoint
   * the full "All Shipments" page uses — just asks for a smaller
   * page size and takes whatever the default sort (most recent
   * first) already gives it.
   */
  async function loadRecentShipments() {
    const tbody = document.querySelector('#recent-shipments-table tbody');
    if (!tbody) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/shipments?page=1&limit=5`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        window.location.href = 'login.html';
        return;
      }

      if (!res.ok) {
        tbody.innerHTML = `<tr><td colspan="5">Could not load recent shipments.</td></tr>`;
        return;
      }

      const { shipments } = await res.json();

      if (!shipments || shipments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">No shipments yet. Create your first one to see it here.</td></tr>`;
        return;
      }

      tbody.innerHTML = shipments
        .map(
          (shipment) => `
        <tr>
          <td class="admin-table__code">${shipment.tracking_code}</td>
          <td>${shipment.customer_name}</td>
          <td>${shipment.destination}</td>
          <td>
            <span class="admin-status-badge admin-status-badge--${shipment.current_status}">
              <span class="admin-status-badge__dot"></span>
              ${STATUS_LABELS[shipment.current_status] || shipment.current_status}
            </span>
          </td>
          <td>${formatDate(shipment.estimated_delivery)}</td>
        </tr>
      `
        )
        .join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5">Could not reach the server.</td></tr>`;
    }
  }

  const STATUS_LABELS = {
    pending: 'Processing',
    'in-transit': 'In Transit',
    delivered: 'Delivered',
  };

  function formatDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Real stat counts. There's no dedicated "stats" endpoint —
   * instead this reuses GET /api/shipments with limit=1 for each
   * status filter, since the endpoint already returns a `total`
   * count alongside the (mostly-ignored, here) actual rows. Four
   * small requests rather than a new backend endpoint, since the
   * data this needs already exists.
   */
  async function loadStatCounts() {
    const STAT_QUERIES = {
      total: '',
      transit: '&status=in-transit',
      delivered: '&status=delivered',
      pending: '&status=pending',
    };

    try {
      const results = await Promise.all(
        Object.entries(STAT_QUERIES).map(async ([key, query]) => {
          const res = await fetch(`${API_BASE_URL}/api/shipments?page=1&limit=1${query}`, {
            credentials: 'include',
          });
          if (!res.ok) return [key, 0];
          const { total } = await res.json();
          return [key, total || 0];
        })
      );

      const counts = Object.fromEntries(results);

      setStatValue('total', counts.total);
      setStatValue('transit', counts.transit);
      setStatValue('delivered', counts.delivered);
      setStatValue('pending', counts.pending);
    } catch (err) {
      // Leave whatever the HTML's default data-count-to values
      // are — better than showing nothing at all.
    }

    runStatCounters();
  }

  function setStatValue(key, value) {
    const card = document.querySelector(`.admin-stat-card__icon--${key}`)?.closest('.admin-stat-card');
    const numberEl = card?.querySelector('[data-count-to]');
    if (numberEl) numberEl.dataset.countTo = String(value);
  }

  /**
   * Simple count-up for the stat cards. Kept self-contained here
   * rather than importing the public site's animations.js, since
   * the admin area doesn't share that script bundle.
   */
  function runStatCounters() {
    const counters = document.querySelectorAll('[data-count-to]');
    if (counters.length === 0) return;

    if (prefersReducedMotion) {
      counters.forEach((el) => {
        el.textContent = el.dataset.countTo;
      });
      return;
    }

    counters.forEach((el) => {
      const target = parseInt(el.dataset.countTo, 10);
      const duration = 1200;
      const start = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased).toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = target.toLocaleString();
        }
      }

      requestAnimationFrame(tick);
    });
  }

  // Logout is now handled by the shared js/auth-guard.js, which
  // calls the real POST /api/auth/logout endpoint before
  // redirecting — included on this page alongside this script.

  loadRecentShipments();
  loadStatCounts();
  loadWelcomeName();
})();
