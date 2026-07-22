import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient.js';

export async function verifyAdminCredentials(email, password) {
  const { data: admin, error } = await supabase
    .from('admins')
    .select('id, email, password_hash')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw Object.assign(new Error('Database error while checking credentials'), { status: 500 });
  }

  if (!admin) return null;

  const passwordMatches = await bcrypt.compare(password, admin.password_hash);
  if (!passwordMatches) return null;

  return { id: admin.id, email: admin.email };
}

export function generateAdminToken(admin) {
  return jwt.sign({ sub: admin.id, email: admin.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}