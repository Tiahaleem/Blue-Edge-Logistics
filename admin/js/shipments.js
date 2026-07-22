/**
 * shipments.js
 * Real backend version. Search, status filter, and pagination
 * are now server-side (query params on GET /api/shipments)
 * rather than filtering a local array, since the dataset is now
 * a real, growing database table.
 */

(function () {
  'use strict';

  const API_BASE_URL = 'http://localhost:4000';
  const PAGE_SIZE = 8;

  const STATUS_LABELS = {
    pending: 'Processing',
    'in-transit': 'In Transit',
    delivered: 'Delivered',
  };

  let currentPage = 1;
  let pendingDeleteId = null;

  const searchInput = document.getElementById('shipment-search');
  const statusFilter = document.getElementById('shipment-status-filter');
  const tbody = document.querySelector('#shipments-table tbody');
  const emptyState = document.getElementById('shipments-empty');
  const emptyStateText = emptyState ? emptyState.querySelector('p') : null;
  const paginationEl = document.getElementById('shipments-pagination');
  const paginationInfo = document.getElementById('shipments-pagination-info');
  const pageIndicator = document.getElementById('shipments-page-indicator');
  const prevBtn = document.getElementById('shipments-prev');
  const nextBtn = document.getElementById('shipments-next');

  function formatDate(dateLike) {
    const date = new Date(dateLike);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function showEmpty(message) {
    tbody.innerHTML = '';
    if (emptyStateText) emptyStateText.textContent = message;
    emptyState.hidden = false;
    paginationEl.hidden = true;
  }

  async function fetchShipments() {
    const query = searchInput.value.trim();
    const status = statusFilter.value;

    const url = new URL(`${API_BASE_URL}/api/shipments`);
    if (query) url.searchParams.set('search', query);
    if (status !== 'all') url.searchParams.set('status', status);
    url.searchParams.set('page', String(currentPage));
    url.searchParams.set('limit', String(PAGE_SIZE));

    try {
      const res = await fetch(url, { credentials: 'include' });

      if (res.status === 401) {
        window.location.href = 'login.html';
        return;
      }

      if (!res.ok) {
        showEmpty('Could not load shipments. Please try again.');
        return;
      }

      const { shipments, total } = await res.json();
      render(shipments, total);
    } catch (err) {
      showEmpty('Could not reach the server. Is the backend running?');
    }
  }

  function render(shipments, total) {
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);

    if (!shipments || shipments.length === 0) {
      showEmpty('No shipments match your search or filter.');
      return;
    }

    emptyState.hidden = true;
    paginationEl.hidden = false;

    tbody.innerHTML = shipments
      .map(
        (shipment) => `
      <tr>
        <td class="admin-table__code">${shipment.tracking_code}</td>
        <td>${shipment.customer_name}</td>
        <td>${shipment.origin}</td>
        <td>${shipment.destination}</td>
        <td>
          <span class="admin-status-badge admin-status-badge--${shipment.current_status}">
            <span class="admin-status-badge__dot"></span>
            ${STATUS_LABELS[shipment.current_status] || shipment.current_status}
          </span>
        </td>
        <td>${formatDate(shipment.estimated_delivery)}</td>
        <td>
          <div class="admin-table__actions">
            <a href="shipment-form.html?id=${shipment.id}" class="admin-table__action-btn" aria-label="Edit ${shipment.tracking_code}">
              <iconify-icon icon="ph:pencil-simple-bold" aria-hidden="true"></iconify-icon>
            </a>
            <button type="button" class="admin-table__action-btn admin-table__action-btn--danger" data-delete-id="${shipment.id}" data-delete-code="${shipment.tracking_code}" aria-label="Delete ${shipment.tracking_code}">
              <iconify-icon icon="ph:trash-bold" aria-hidden="true"></iconify-icon>
            </button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');

    const start = (currentPage - 1) * PAGE_SIZE;
    paginationInfo.textContent = `Showing ${start + 1}\u2013${Math.min(start + PAGE_SIZE, total)} of ${total}`;
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    tbody.querySelectorAll('[data-delete-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openDeleteModal(btn.dataset.deleteId, btn.dataset.deleteCode);
      });
    });
  }

  // Debounced — avoids firing a network request on every single
  // keystroke while typing in the search box.
  let searchTimeout = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      fetchShipments();
    }, 300);
  });

  statusFilter.addEventListener('change', () => {
    currentPage = 1;
    fetchShipments();
  });

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      fetchShipments();
    }
  });

  nextBtn.addEventListener('click', () => {
    currentPage += 1;
    fetchShipments();
  });

  // --- Delete confirm modal ---

  const modalOverlay = document.getElementById('delete-modal-overlay');
  const modal = document.getElementById('delete-modal');
  const modalCode = document.getElementById('delete-modal-code');
  const modalError = document.getElementById('delete-modal-error');
  const cancelBtn = document.getElementById('delete-modal-cancel');
  const confirmBtn = document.getElementById('delete-modal-confirm');

  let lastFocusedElement = null;

  function openDeleteModal(id, code) {
    pendingDeleteId = id;
    modalCode.textContent = code;
    if (modalError) modalError.textContent = '';
    lastFocusedElement = document.activeElement;

    modalOverlay.hidden = false;
    void modalOverlay.offsetWidth;
    modalOverlay.classList.add('is-visible');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');

    document.body.style.overflow = 'hidden';
    cancelBtn.focus();

    document.addEventListener('keydown', handleModalKeydown);
  }

  function closeDeleteModal() {
    modalOverlay.classList.remove('is-visible');
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');

    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleModalKeydown);

    const onTransitionEnd = () => {
      modalOverlay.hidden = true;
      modalOverlay.removeEventListener('transitionend', onTransitionEnd);
    };
    modalOverlay.addEventListener('transitionend', onTransitionEnd);

    pendingDeleteId = null;
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function handleModalKeydown(event) {
    if (event.key === 'Escape') {
      closeDeleteModal();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = [cancelBtn, confirmBtn];
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

  cancelBtn.addEventListener('click', closeDeleteModal);
  modalOverlay.addEventListener('click', closeDeleteModal);

  confirmBtn.addEventListener('click', async () => {
    if (pendingDeleteId === null) return;

    confirmBtn.disabled = true;
    if (modalError) modalError.textContent = '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/shipments/${pendingDeleteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.status === 401) {
        window.location.href = 'login.html';
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        if (modalError) modalError.textContent = data.error || 'Could not delete this shipment.';
        return;
      }

      closeDeleteModal();
      fetchShipments();
    } catch (err) {
      if (modalError) modalError.textContent = 'Could not reach the server.';
    } finally {
      confirmBtn.disabled = false;
    }
  });

  fetchShipments();
})();