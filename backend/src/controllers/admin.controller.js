import { z } from 'zod';
import {
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword,
  updateAdminPreferences,
} from '../services/admin.service.js';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('A valid email is required'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const preferencesSchema = z.object({
  newShipment: z.boolean(),
  statusChange: z.boolean(),
  delays: z.boolean(),
});

function formatValidationError(zodError) {
  const issue = zodError.issues[0];
  const field = issue.path.join('.');
  return field ? `${field}: ${issue.message}` : issue.message;
}

export async function getProfile(req, res, next) {
  try {
    const profile = await getAdminProfile(req.admin.id);
    if (!profile) return res.status(404).json({ error: 'Admin not found.' });
    res.json({ admin: profile });
  } catch (err) {
    next(err);
  }
}

export async function putProfile(req, res, next) {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: formatValidationError(parsed.error) });
    const profile = await updateAdminProfile(req.admin.id, parsed.data);
    res.json({ admin: profile });
  } catch (err) {
    next(err);
  }
}

export async function putPassword(req, res, next) {
  try {
    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: formatValidationError(parsed.error) });
    await updateAdminPassword(req.admin.id, parsed.data.currentPassword, parsed.data.newPassword);
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function putPreferences(req, res, next) {
  try {
    const parsed = preferencesSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: formatValidationError(parsed.error) });
    const result = await updateAdminPreferences(req.admin.id, parsed.data);
    res.json({ notificationPreferences: result.notification_preferences });
  } catch (err) {
    next(err);
  }
}