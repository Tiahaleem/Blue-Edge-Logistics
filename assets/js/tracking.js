/**
 * tracking.js
 * Powers the public tracking page. Right now it searches a local
 * demo array; once the backend exists, only the `findShipment()`
 * function needs to change to a real fetch() call — everything
 * else (rendering, states, animation) stays exactly the same,
 * because DEMO_SHIPMENTS is shaped identically to what
 * GET /api/track/:trackingCode will eventually return.
 */

(function () {
  'use strict';

  const form = document.getElementById('tracking-form');
  const input = document.getElementById('tracking-code-input');
  const resultsEl = document.getElementById('tracking-results');

  if (!form || !input || !resultsEl) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /**
   * Demo data — shaped to match the real API response documented
   * in the project plan: tracking number, customer, origin,
   * destination, status, current location, estimated delivery,
   * description, and a tracking_history array. Try these codes:
   *   SPW-483920  → in transit
   *   SPW-100234  → delivered
   *   SPW-555777  → processing / early stage
   */
  const DEMO_SHIPMENTS = [
    {
      trackingNumber: 'SPW-483920',
      customerName: 'Adaeze Okafor',
      origin: 'Lagos, Nigeria',
      destination: 'Abuja, Nigeria',
      status: 'in-transit',
      statusLabel: 'In Transit',
      currentLocation: 'Benin City, Nigeria',
      estimatedDelivery: '2026-07-25',
      description: 'Electronics — 2 boxes, 18kg',
      history: [
        { date: '2026-07-19', label: 'Shipment Created', location: 'Lagos, Nigeria' },
        { date: '2026-07-20', label: 'Picked Up', location: 'Lagos, Nigeria' },
        { date: '2026-07-21', label: 'Left Lagos', location: 'Lagos, Nigeria' },
        { date: '2026-07-22', label: 'Arrived Benin', location: 'Benin City, Nigeria' },
        { date: '2026-07-23', label: 'Departed Benin', location: 'Benin City, Nigeria' },
      ],
    },
    {
      trackingNumber: 'SPW-100234',
      customerName: 'Michael Chen',
      origin: 'Port Harcourt, Nigeria',
      destination: 'Kano, Nigeria',
      status: 'delivered',
      statusLabel: 'Delivered',
      currentLocation: 'Kano, Nigeria',
      estimatedDelivery: '2026-07-18',
      description: 'Auto parts — 1 pallet, 120kg',
      history: [
        { date: '2026-07-14', label: 'Shipment Created', location: 'Port Harcourt, Nigeria' },
        { date: '2026-07-15', label: 'Picked Up', location: 'Port Harcourt, Nigeria' },
        { date: '2026-07-16', label: 'In Transit', location: 'Abuja, Nigeria' },
        { date: '2026-07-17', label: 'Arrived Kano', location: 'Kano, Nigeria' },
        { date: '2026-07-18', label: 'Delivered', location: 'Kano, Nigeria' },
      ],
    },
    {
      trackingNumber: 'SPW-555777',
      customerName: 'Grace Adeyemi',
      origin: 'Ibadan, Nigeria',
      destination: 'Enugu, Nigeria',
      status: 'pending',
      statusLabel: 'Processing',
      currentLocation: 'Ibadan, Nigeria',
      estimatedDelivery: '2026-07-29',
      description: 'Documents — envelope',
      history: [
        { date: '2026-07-20', label: 'Shipment Created', location: 'Ibadan, Nigeria' },
      ],
    },
  ];

  /**
   * Stand-in for the real API call. Swap this function's body
   * for something like:
   *   const res = await fetch(`/api/track/${code}`);
   *   if (!res.ok) return null;
   *   return await res.json();
   * Everything calling findShipment() stays async-compatible
   * already (see the submit handler), so that swap is the only
   * change needed later.
   */
  async function findShipment(code) {
    const normalized = code.trim().toUpperCase();
    return DEMO_SHIPMENTS.find((s) => s.trackingNumber === normalized) || null;
  }

  function formatDate(isoDate) {
    const date = new Date(isoDate + 'T00:00:00');
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
            <span class="tracking-timeline__date">${formatDate(entry.date)}</span>
            <span class="tracking-timeline__label">${escapeHtml(entry.label)}</span>
            <span class="tracking-timeline__location">${escapeHtml(entry.location)}</span>
          </div>
        </li>
      `
      )
      .join('');

    resultsEl.innerHTML = `
      <div class="tracking-result-card">
        <div class="tracking-result-card__header">
          <div>
            <span class="tracking-result-card__label">Tracking Number</span>
            <span class="tracking-result-card__code">${escapeHtml(shipment.trackingNumber)}</span>
          </div>
          <span class="tracking-status-badge tracking-status-badge--${shipment.status}">
            <span class="tracking-status-badge__dot"></span>
            ${escapeHtml(shipment.statusLabel)}
          </span>
        </div>

        <div class="tracking-result-card__grid">
          <div class="tracking-result-card__field">
            <span class="tracking-result-card__field-label">Customer</span>
            <span class="tracking-result-card__field-value">${escapeHtml(shipment.customerName)}</span>
          </div>
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

  /**
   * Un-hides the results container and triggers its entrance
   * animation, then scrolls it into view. The reveal-up items
   * inside (timeline entries) are picked up by the same
   * IntersectionObserver in animations.js — since the container
   * was just un-hidden and is already in view, they animate in
   * immediately rather than waiting for scroll.
   */
  function revealResults() {
    resultsEl.hidden = false;
    resultsEl.classList.remove('is-visible');
    void resultsEl.offsetWidth; // force reflow so the transition replays each search
    resultsEl.classList.add('is-visible');

    resultsEl.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });

    // Re-run the scroll-reveal observer for the new timeline items,
    // since they didn't exist in the DOM when animations.js first ran.
    if (window.reinitScrollReveal) {
      window.reinitScrollReveal();
    }
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const code = input.value.trim();
    if (!code) return;

    const shipment = await findShipment(code);

    if (shipment) {
      renderShipment(shipment);
    } else {
      renderNotFound(code);
    }
  });
})();