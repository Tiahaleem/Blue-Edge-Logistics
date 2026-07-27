/**
 * contact.js
 * Validates the contact form, then POSTs it to the backend at
 * /api/contact. API_BASE_URL stays empty because Vercel rewrites
 * /api/* through to the Render backend, making it same-origin.
 * No window.alert() anywhere — status shows inline in the form.
 */

(function () {
  'use strict';

  const API_BASE_URL = '';

  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('contact-form-status');

  if (!form || !statusEl) return;

  const submitBtn = form.querySelector('.contact-form__submit');
  const submitDefaultText = submitBtn ? submitBtn.textContent : 'Submit Now';

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let isSubmitting = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const fullName = form.querySelector('#contact-name').value.trim();
    const email = form.querySelector('#contact-email').value.trim();
    const mobile = form.querySelector('#contact-mobile').value.trim();
    const company = form.querySelector('#contact-company').value.trim();
    const message = form.querySelector('#contact-message').value.trim();

    if (!fullName || !email || !message) {
      showStatus('Please fill in your name, email, and message.', true);
      return;
    }

    if (!emailPattern.test(email)) {
      showStatus('Please enter a valid email address.', true);
      return;
    }

    if (message.length < 10) {
      showStatus('Please write a slightly longer message.', true);
      return;
    }

    setSubmitting(true);
    showStatus('Sending your message…', false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, mobile, company, message }),
      });

      let result = {};
      try {
        result = await response.json();
      } catch (parseError) {
        result = {};
      }

      if (!response.ok || !result.success) {
        showStatus(
          result.message || 'We could not send your message. Please try again shortly.',
          true
        );
        return;
      }

      showStatus(
        result.message || `Thanks, ${fullName} — we'll be in touch shortly.`,
        false
      );
      form.reset();
    } catch (networkError) {
      showStatus(
        'Could not reach the server. Please check your connection and try again.',
        true
      );
    } finally {
      setSubmitting(false);
    }
  });

  function setSubmitting(state) {
    isSubmitting = state;
    if (!submitBtn) return;
    submitBtn.disabled = state;
    submitBtn.textContent = state ? 'Sending…' : submitDefaultText;
  }

  function showStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle('contact-form__status--error', isError);
  }
})();
