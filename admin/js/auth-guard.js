/**
 * auth-guard.js
 * Included on every PROTECTED admin page (dashboard, shipments,
 * shipment-form, settings) — never on login.html itself, since
 * that page is the one public admin page.
 *
 * Two jobs:
 *   1. On load, confirms there's a real, valid session by calling
 *      GET /api/auth/me. If not logged in (or the backend can't
 *      be reached at all), redirects to login.html immediately.
 *   2. Wires up the Logout button to actually call
 *      POST /api/auth/logout on the server first (clearing the
 *      real cookie), then redirects to login.html — replaces the
 *      old per-page logout handlers, which just redirected without
 *      telling the server anything.
 *
 * Note: this is a client-side convenience, not the real security
 * boundary — someone could still disable JavaScript and see the
 * page's static HTML. The actual protection is (and always has to
 * be) server-side: every shipment-data endpoint requires a valid
 * session via the requireAuth middleware, regardless of what this
 * script does. This just gives a better experience (an instant
 * redirect) instead of showing an empty/broken dashboard to
 * someone who isn't logged in.
 */

(function () {
  'use strict';

  const API_BASE_URL = 'http://localhost:4000';

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
      // Stashed here in case a page wants to show the real admin's
      // email somewhere later, instead of the static "A" avatar.
      window.__currentAdmin = data.admin;
    } catch (err) {
      // Can't reach the backend at all — treat the same as "not
      // logged in" rather than leaving a half-loaded page sitting
      // there with data that hasn't been confirmed accessible.
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