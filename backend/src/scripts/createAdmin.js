import bcrypt from 'bcrypt';
import { supabase } from '../config/supabaseClient.js';

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Usage: node src/scripts/createAdmin.js <email> <password>');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

async function createAdmin() {
  const { data: existing, error: lookupError } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (lookupError) {
    console.error('Could not check for an existing admin:', lookupError.message);
    process.exit(1);
  }

  if (existing) {
    console.error(`An admin with the email "${email}" already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { error: insertError } = await supabase
    .from('admins')
    .insert({ email, password_hash: passwordHash });

  if (insertError) {
    console.error('Failed to create admin:', insertError.message);
    process.exit(1);
  }

  console.log(`Admin account created for ${email}. You can now log in at /admin/login.html.`);
  process.exit(0);
}

createAdmin();