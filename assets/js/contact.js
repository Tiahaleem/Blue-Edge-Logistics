/**
 * contact.js
 * Client-side validation only for now — no backend exists yet.
 * Swap the TODO block for a real fetch() call to a contact
 * endpoint once the Express API is live. No window.alert() or
 * native popups anywhere — status shows inline in the form.
 */

(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('contact-form-status');

  if (!form || !statusEl) return;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nameInput = form.querySelector('#contact-name');
    const emailInput = form.querySelector('#contact-email');
    const messageInput = form.querySelector('#contact-message');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !email || !message) {
      showStatus('Please fill in your name, email, and message.', true);
      return;
    }

    if (!emailPattern.test(email)) {
      showStatus('Please enter a valid email address.', true);
      return;
    }

    // TODO: replace with a real request once the backend exists, e.g.
    // fetch('/api/contact', { method: 'POST', body: JSON.stringify({ name, email, message, ... }) })
    showStatus(`Thanks, ${name} — we'll be in touch shortly.`, false);
    form.reset();
  });

  function showStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle('contact-form__status--error', isError);
  }
})();