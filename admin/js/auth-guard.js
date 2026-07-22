/**
 * auth-guard.js
 * Included on every PROTECTED admin page (dashboard, shipments,
 * shipment-form, settings) — never on login.html itself, since
 * that page is the one public admin page.
 */

(function () {
  'use strict';

  const API_BASE_URL = 'https://skybridge-logistics-backend.onrender.com';

  async function checkSession() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include',
      });

      if (!res.ok) {
        window.location.href = 'login.html';
        return;
      }

      const data = await res.json();
      window.__currentAdmin = data.admin;
    } catch (err) {
      window.location.href = 'login.html';
    }
  }

  function setupLogout() {
    const logoutBtn = document.getElementById('admin-logout');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (err) {
        // Even if this fails, there's nothing more useful to do
        // than send them back to the login page anyway.
      }
      window.location.href = 'login.html';
    });
  }

  checkSession();
  setupLogout();
})();
