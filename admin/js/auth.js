/**
 * auth.js
 * Powers the login screen. Calls the real backend now that it
 * exists — a successful login sets an httpOnly cookie (the
 * browser handles storing it automatically; this file never
 * touches the token itself) and redirects to the dashboard.
 *
 * IMPORTANT: this page must be served over http:// (e.g. VS
 * Code's "Live Server" extension, or any local dev server) —
 * NOT opened by double-clicking the file directly. Cookies do
 * not work at all over a file:// address, in any browser.
 */

(function () {
  'use strict';

  // Change this once the backend is deployed somewhere real —
  // for local development it points at the Express server
  // running on your machine.
  const API_BASE_URL = 'https://skybridge-logistics-backend.onrender.com';

  const passwordInput = document.getElementById('admin-password');
  const toggleBtn = document.getElementById('admin-password-toggle');

  if (passwordInput && toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      toggleBtn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
      toggleBtn.innerHTML = `<iconify-icon icon="${isHidden ? 'ph:eye-slash-bold' : 'ph:eye-bold'}" aria-hidden="true"></iconify-icon>`;
    });
  }

  const form = document.getElementById('admin-login-form');
  const statusEl = document.getElementById('admin-login-status');
  const submitBtn = form ? form.querySelector('.admin-auth__submit') : null;

  if (form && statusEl) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = document.getElementById('admin-email').value.trim();
      const password = passwordInput.value;

      statusEl.classList.remove('admin-auth__status--error');
      statusEl.textContent = '';
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Required so the browser actually stores/sends the
          // httpOnly cookie the server sets on login — without
          // this, the cookie would be silently dropped.
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          statusEl.textContent = data.error || 'Login failed. Please try again.';
          statusEl.classList.add('admin-auth__status--error');
          return;
        }

        window.location.href = 'dashboard.html';
      } catch (err) {
        statusEl.textContent =
          'Could not reach the server. Is the backend running?';
        statusEl.classList.add('admin-auth__status--error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
})();
