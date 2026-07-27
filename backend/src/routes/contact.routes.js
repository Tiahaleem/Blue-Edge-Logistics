import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { Resend } from 'resend';

const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL ||
  'SkyBridge Logistics <noreply@skybridgelogistics.com.ng>';

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'info@skybridgelogistics.com.ng';

/**
 * Public endpoint, so it is rate limited per IP to keep the
 * mailbox (and the Resend quota) from being flooded.
 */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many messages sent. Please try again in a few minutes.',
  },
});

const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter your full name.')
    .max(100, 'That name is too long.'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .max(200, 'That email address is too long.'),
  mobile: z.string().trim().max(40, 'That phone number is too long.').optional(),
  company: z.string().trim().max(120, 'That company name is too long.').optional(),
  message: z
    .string()
    .trim()
    .min(10, 'Please write a slightly longer message.')
    .max(5000, 'That message is too long.'),
});

/**
 * Visitor input is untrusted, so escape it before dropping it
 * into the HTML body of the notification email.
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml({ fullName, email, mobile, company, message }) {
  const row = (label, value) => `
    <tr>
      <td style="padding:8px 16px 8px 0;vertical-align:top;color:#6b7280;font-size:14px;white-space:nowrap;">${label}</td>
      <td style="padding:8px 0;vertical-align:top;color:#111827;font-size:14px;">${escapeHtml(value) || '&mdash;'}</td>
    </tr>`;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;">
    <h2 style="margin:0 0 4px;color:#111827;font-size:20px;">New contact form message</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Sent from skybridgelogistics.com.ng</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      ${row('Name', fullName)}
      ${row('Email', email)}
      ${row('Mobile', mobile)}
      ${row('Company', company)}
    </table>

    <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
      <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Message</p>
      <p style="margin:0;color:#111827;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</p>
    </div>

    <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">
      Reply directly to this email to respond to ${escapeHtml(fullName)}.
    </p>
  </div>`;
}

function buildText({ fullName, email, mobile, company, message }) {
  return [
    'New contact form message',
    'Sent from skybridgelogistics.com.ng',
    '',
    `Name:    ${fullName}`,
    `Email:   ${email}`,
    `Mobile:  ${mobile || '-'}`,
    `Company: ${company || '-'}`,
    '',
    'Message:',
    message,
  ].join('\n');
}

router.post('/', contactLimiter, async (req, res) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY is not set');
    return res.status(500).json({
      success: false,
      message: 'Email is not configured. Please try again later.',
    });
  }

  const parsed = contactSchema.safeParse(req.body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return res.status(400).json({
      success: false,
      message: firstIssue?.message || 'Please check the form and try again.',
    });
  }

  const payload = parsed.data;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: payload.email,
      subject: `New enquiry from ${payload.fullName}`,
      html: buildHtml(payload),
      text: buildText(payload),
    });

    if (error) {
      console.error('[contact] Resend error:', error);
      return res.status(502).json({
        success: false,
        message: 'We could not send your message. Please try again shortly.',
      });
    }

    console.log(`[contact] Sent message ${data?.id} from ${payload.email}`);

    return res.status(200).json({
      success: true,
      message: 'Thanks for reaching out. We will be in touch shortly.',
    });
  } catch (err) {
    console.error('[contact] Unexpected error:', err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again shortly.',
    });
  }
});

export default router;
