/**
 * settings.js
 * Three independent panels: profile, password, notification
 * preferences — all now calling the real backend.
 */

(function () {
  'use strict';

  const API_BASE_URL = 'http://localhost:4000';

  // Backend uses camelCase keys (newShipment, statusChange,
  // delays); the HTML's data-pref attributes use kebab-case
  // (new-shipment, status-change) since that matches normal HTML
  // attribute conventions. This maps between the two.
  const PREF_KEY_MAP = {
    'new-shipment': 'newShipment',
    'status-change': 'statusChange',
    delays: 'delays',
  };

  // --- Password show/hide toggles (multiple fields on this page) ---

  document.querySelectorAll('[data-password-toggle]').forEach((toggleBtn) => {
    const targetId = toggleBtn.dataset.passwordToggle;
    const input = document.getElementById(targetId);
    if (!input) return;

    toggleBtn.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      toggleBtn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
      toggleBtn.innerHTML = `<iconify-icon icon="${isHidden ? 'ph:eye-slash-bold' : 'ph:eye-bold'}" aria-hidden="true"></iconify-icon>`;
    });
  });

  function showStatus(el, message, isError) {
    el.textContent = message;
    el.classList.toggle('admin-form__status--error', isError);
  }

  // --- Load current profile + preferences on page load ---

  async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        window.location.href = 'login.html';
        return;
      }

      if (!res.ok) return;

      const { admin } = await res.json();

      document.getElementById('profile-name').value = admin.full_name || '';
      document.getElementById('profile-phone').value = admin.phone || '';
      document.getElementById('profile-email').value = admin.email || '';

      const prefs = admin.notification_preferences || {};
      document.querySelectorAll('[data-pref]').forEach((input) => {
        const backendKey = PREF_KEY_MAP[input.dataset.pref];
        if (backendKey in prefs) {
          input.checked = Boolean(prefs[backendKey]);
        }
      });
    } catch (err) {
      // Non-fatal — the form just keeps its default placeholder
      // values if this fails; the user can still try saving.
    }
  }

  // --- Profile form ---

  const profileForm = document.getElementById('profile-form');
  const profileStatus = document.getElementById('profile-status');

  if (profileForm && profileStatus) {
    profileForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!profileForm.checkValidity()) {
        showStatus(profileStatus, 'Please fill in all required fields.', true);
        return;
      }

      const payload = {
        fullName: document.getElementById('profile-name').value.trim(),
        phone: document.getElementById('profile-phone').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
      };

      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/profile`, {
          method: 'PUT',
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
          showStatus(profileStatus, data.error || 'Could not update profile.', true);
          return;
        }

        showStatus(profileStatus, 'Profile updated successfully.', false);
      } catch (err) {
        showStatus(profileStatus, 'Could not reach the server. Is the backend running?', true);
      }
    });
  }

  // --- Password form ---

  const passwordForm = document.getElementById('password-form');
  const passwordStatus = document.getElementById('password-status');

  if (passwordForm && passwordStatus) {
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const current = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirm = document.getElementById('confirm-password').value;

      if (!current || !newPassword || !confirm) {
        showStatus(passwordStatus, 'Please fill in all password fields.', true);
        return;
      }

      if (newPassword.length < 8) {
        showStatus(passwordStatus, 'New password must be at least 8 characters.', true);
        return;
      }

      if (newPassword !== confirm) {
        showStatus(passwordStatus, 'New password and confirmation do not match.', true);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ currentPassword: current, newPassword }),
        });

        const data = await res.json();

        if (!res.ok) {
          // A 401 here specifically means "current password was
          // wrong" (the server checked it against the hash) —
          // NOT "you're not logged in" (auth-guard already
          // confirmed that on page load). So this one deliberately
          // does NOT redirect on 401, unlike the other forms.
          showStatus(passwordStatus, data.error || 'Could not update password.', true);
          return;
        }

        showStatus(passwordStatus, 'Password updated successfully.', false);
        passwordForm.reset();
      } catch (err) {
        showStatus(passwordStatus, 'Could not reach the server. Is the backend running?', true);
      }
    });
  }

  // --- Notification preferences ---

  const savePreferencesBtn = document.getElementById('save-preferences-btn');
  const preferencesStatus = document.getElementById('preferences-status');

  if (savePreferencesBtn && preferencesStatus) {
    savePreferencesBtn.addEventListener('click', async () => {
      const preferences = {};
      document.querySelectorAll('[data-pref]').forEach((input) => {
        const backendKey = PREF_KEY_MAP[input.dataset.pref];
        preferences[backendKey] = input.checked;
      });

      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/preferences`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(preferences),
        });

        if (res.status === 401) {
          window.location.href = 'login.html';
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          showStatus(preferencesStatus, data.error || 'Could not save preferences.', true);
          return;
        }

        showStatus(preferencesStatus, 'Notification preferences saved.', false);
      } catch (err) {
        showStatus(preferencesStatus, 'Could not reach the server. Is the backend running?', true);
      }
    });
  }

  // Logout is handled by the shared js/auth-guard.js.

  loadProfile();
})();