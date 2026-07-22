import { z } from 'zod';
import { verifyAdminCredentials, generateAdminToken } from '../services/auth.service.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'strict',
  maxAge: 8 * 60 * 60 * 1000,
};

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Please provide a valid email and password.' });
    }

    const { email, password } = parsed.data;
    const admin = await verifyAdminCredentials(email, password);

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateAdminToken(admin);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ admin });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ message: 'Logged out.' });
}

export function me(req, res) {
  res.json({ admin: req.admin });
}
