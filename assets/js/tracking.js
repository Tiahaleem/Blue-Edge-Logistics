/**
 * tracking.js
 * Powers the public tracking page — calls the real backend now
 * that it exists.
 */

(function () {
  'use strict';

  const API_BASE_URL = '';

  const form = document.getElementById('tracking-form');
  const input = document.getElementById('tracking-code-input');
  const resultsEl = document.getElementById('tracking-results');

  if (!form || !input || !resultsEl) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const STATUS_LABELS = {
    pending: 'Processing',
    'in-transit': 'In Transit',
    delivered: 'Delivered',
  };

  async function findShipment(code) {
    const normalized = code.trim().toUpperCase();

    const res = await fetch(`${API_BASE_URL}/api/track/${encodeURIComponent(normalized)}`);

    if (res.status === 404) return null;

    if (!res.ok) {
      throw new Error('Server error while looking up this tracking code.');
    }

    return await res.json();
  }

  function formatDate(dateLike) {
    const date = new Date(dateLike);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function renderNotFound(code) {
    resultsEl.innerHTML = `
      <div class="tracking-not-found">
        <iconify-icon icon="ph:magnifying-glass-bold" aria-hidden="true"></iconify-icon>
        <h3>Tracking Number Not Found</h3>
        <p>
          We couldn't find a shipment matching <strong>${escapeHtml(code)}</strong>.
          Please double-check the code and try again.
        </p>
      </div>
    `;
    revealResults();
  }

  function renderShipment(shipment) {
    const historyItems = shipment.history
      .map(
        (entry, index) => `
        <li class="tracking-timeline__item reveal-up" style="transition-delay:${index * 80}ms">
          <span class="tracking-timeline__dot" aria-hidden="true"></span>
          <div class="tracking-timeline__content">
            <span class="tracking-timeline__date">${formatDate(entry.createdAt)}</span>
            <span class="tracking-timeline__label">${escapeHtml(entry.status)}</span>
            <span class="tracking-timeline__location">${escapeHtml(entry.location || '')}</span>
            ${entry.note ? `<p class="tracking-timeline__note">${escapeHtml(entry.note)}</p>` : ''}
          </div>
        </li>
      `
      )
      .join('');

    const statusLabel = STATUS_LABELS[shipment.currentStatus] || shipment.currentStatus;

    resultsEl.innerHTML = `
      <div class="tracking-result-card">
        <div class="tracking-result-card__header">
          <div>
            <span class="tracking-result-card__label">Tracking Number</span>
            <span class="tracking-result-card__code">${escapeHtml(shipment.trackingCode)}</span>
          </div>
          <span class="tracking-status-badge tracking-status-badge--${shipment.currentStatus}">
            <span class="tracking-status-badge__dot"></span>
            ${escapeHtml(statusLabel)}
          </span>
        </div>

        <div class="tracking-result-card__grid">
          <div class="tracking-result-card__field">
            <span class="tracking-result-card__field-label">Origin</span>
            <span class="tracking-result-card__field-value">${escapeHtml(shipment.origin)}</span>
          </div>
          <div class="tracking-result-card__field">
            <span class="tracking-result-card__field-label">Destination</span>
            <span class="tracking-result-card__field-value">${escapeHtml(shipment.destination)}</span>
          </div>
          <div class="tracking-result-card__field">
            <span class="tracking-result-card__field-label">Current Location</span>
            <span class="tracking-result-card__field-value">${escapeHtml(shipment.currentLocation)}</span>
          </div>
          <div class="tracking-result-card__field">
            <span class="tracking-result-card__field-label">Estimated Delivery</span>
            <span class="tracking-result-card__field-value">${formatDate(shipment.estimatedDelivery)}</span>
          </div>
          <div class="tracking-result-card__field">
            <span class="tracking-result-card__field-label">Description</span>
            <span class="tracking-result-card__field-value">${escapeHtml(shipment.description)}</span>
          </div>
        </div>

        <div class="tracking-timeline-wrap">
          <h3 class="tracking-timeline-wrap__title">Tracking History</h3>
          <ul class="tracking-timeline">
            ${historyItems}
          </ul>
        </div>
      </div>
    `;
    revealResults();
  }

  function revealResults() {
    resultsEl.hidden = false;
    resultsEl.classList.remove('is-visible');
    void resultsEl.offsetWidth;
    resultsEl.classList.add('is-visible');

    resultsEl.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });

    if (window.reinitScrollReveal) {
      window.reinitScrollReveal();
    }
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }

  function renderError(message) {
    resultsEl.innerHTML = `
      <div class="tracking-not-found">
        <iconify-icon icon="ph:warning-bold" aria-hidden="true"></iconify-icon>
        <h3>Something Went Wrong</h3>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
    revealResults();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const code = input.value.trim();
    if (!code) return;

    try {
      const shipment = await findShipment(code);

      if (shipment) {
        renderShipment(shipment);
      } else {
        renderNotFound(code);
      }
    } catch (err) {
      renderError('Could not reach the server right now. Please try again in a moment.');
    }
  });
})();
