/**
 * shipment-form.js
 * Real backend version — replaces the local demo-data version.
 * Same two modes as before, driven by ?id=:
 *   - No id  → Create mode: POST /api/shipments.
 *   - id=X   → Edit mode: GET /api/shipments/:id to load real
 *             data + real history, PUT /api/shipments/:id to
 *             save changes.
 */

(function () {
  'use strict';

  const API_BASE_URL = '';

  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');
  const isEditMode = Boolean(editId);

  const form = document.getElementById('shipment-form');
  const statusEl = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');
  const trackingCodeDisplay = document.getElementById('tracking-code-display');
  const generateCodeBtn = document.getElementById('generate-code-btn');
  const historyPanel = document.getElementById('tracking-history-panel');
  const historyList = document.getElementById('tracking-history-list');

  function formatDate(dateLike) {
    const date = new Date(dateLike);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function showStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle('admin-form__status--error', isError);
  }

  function renderHistory(history) {
    if (!isEditMode || !historyList) return;

    historyList.innerHTML = (history || [])
      .slice()
      .reverse()
      .map(
        (entry) => `
      <li class="admin-history__item">
        <span class="admin-history__dot" aria-hidden="true"></span>
        <span class="admin-history__date">${formatDate(entry.created_at)}</span>
        <span class="admin-history__label">${entry.status}</span>
        <span class="admin-history__location">${entry.location || ''}</span>
        ${entry.note ? `<p class="admin-history__note">"${entry.note}"</p>` : ''}
      </li>
    `
      )
      .join('');
  }

  function populateForm(shipment) {
    form.querySelector('#customer-name').value = shipment.customer_name || '';
    form.querySelector('#customer-phone').value = shipment.phone || '';
    form.querySelector('#customer-email').value = shipment.email || '';
    form.querySelector('#origin').value = shipment.origin || '';
    form.querySelector('#destination').value = shipment.destination || '';
    form.querySelector('#weight').value = shipment.weight ?? '';
    form.querySelector('#estimated-delivery').value = shipment.estimated_delivery || '';
    form.querySelector('#current-status').value = shipment.current_status;
    form.querySelector('#current-location').value = shipment.current_location || '';
    form.querySelector('#description').value = shipment.description || '';
  }

  async function loadShipment() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/shipments/${editId}`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        window.location.href = 'login.html';
        return;
      }

      if (!res.ok) {
        showStatus('Could not load this shipment. It may have been deleted.', true);
        form.hidden = true;
        return;
      }

      const shipment = await res.json();

      document.title = `Edit ${shipment.tracking_code} | SkyBridge Logistics Admin`;
      document.getElementById('form-eyebrow').textContent = shipment.tracking_code;
      document.getElementById('form-heading').textContent = 'Edit Shipment';
      submitBtn.innerHTML =
        '<iconify-icon icon="ph:check-bold" aria-hidden="true"></iconify-icon> Save Changes';

      trackingCodeDisplay.textContent = shipment.tracking_code;
      generateCodeBtn.hidden = true;

      populateForm(shipment);

      document.getElementById('notes-hint').textContent =
        '(this will be added to the tracking history below)';

      historyPanel.hidden = false;
      renderHistory(shipment.history);
    } catch (err) {
      showStatus('Could not reach the server. Is the backend running?', true);
    }
  }

  function setupCreateMode() {
    document.title = 'Create Shipment | SkyBridge Logistics Admin';
    trackingCodeDisplay.textContent = 'Will be generated automatically when you save';
    generateCodeBtn.hidden = true;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      showStatus('Please fill in all required fields.', true);
      return;
    }

    const payload = {
      customerName: form.querySelector('#customer-name').value.trim(),
      phone: form.querySelector('#customer-phone').value.trim(),
      email: form.querySelector('#customer-email').value.trim(),
      origin: form.querySelector('#origin').value.trim(),
      destination: form.querySelector('#destination').value.trim(),
      description: form.querySelector('#description').value.trim(),
      weight: parseFloat(form.querySelector('#weight').value),
      estimatedDelivery: form.querySelector('#estimated-delivery').value,
      currentStatus: form.querySelector('#current-status').value,
      currentLocation: form.querySelector('#current-location').value.trim(),
    };

    if (isEditMode) {
      const notes = form.querySelector('#update-notes').value.trim();
      if (notes) payload.notes = notes;
    }

    submitBtn.disabled = true;

    try {
      const url = isEditMode
        ? `${API_BASE_URL}/api/shipments/${editId}`
        : `${API_BASE_URL}/api/shipments`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        window.location.href = 'login.html';
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        showStatus(data.error || 'Something went wrong. Please try again.', true);
        return;
      }

      if (isEditMode) {
        showStatus('Changes saved. A new tracking history entry was added.', false);
        form.querySelector('#update-notes').value = '';
        loadShipment();
      } else {
        window.location.href = `shipment-form.html?id=${data.id}`;
      }
    } catch (err) {
      showStatus('Could not reach the server. Is the backend running?', true);
    } finally {
      submitBtn.disabled = false;
    }
  });

  if (isEditMode) {
    loadShipment();
  } else {
    setupCreateMode();
  }
})();
