import bcrypt from 'bcrypt';
import { supabase } from '../config/supabaseClient.js';

export async function getAdminProfile(id) {
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, full_name, phone, notification_preferences')
    .eq('id', id)
    .maybeSingle();

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  return data;
}

export async function updateAdminProfile(id, { fullName, phone, email }) {
  const { data, error } = await supabase
    .from('admins')
    .update({ full_name: fullName, phone, email })
    .eq('id', id)
    .select('id, email, full_name, phone, notification_preferences')
    .maybeSingle();

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  return data;
}

export async function updateAdminPassword(id, currentPassword, newPassword) {
  const { data: admin, error: fetchError } = await supabase
    .from('admins')
    .select('password_hash')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw Object.assign(new Error(fetchError.message), { status: 500 });
  if (!admin) throw Object.assign(new Error('Admin not found.'), { status: 404 });

  const currentMatches = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!currentMatches) {
    throw Object.assign(new Error('Current password is incorrect.'), { status: 401 });
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabase
    .from('admins')
    .update({ password_hash: newHash })
    .eq('id', id);

  if (updateError) throw Object.assign(new Error(updateError.message), { status: 500 });
}

export async function updateAdminPreferences(id, preferences) {
  const { data, error } = await supabase
    .from('admins')
    .update({ notification_preferences: preferences })
    .eq('id', id)
    .select('notification_preferences')
    .maybeSingle();

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  return data;
}