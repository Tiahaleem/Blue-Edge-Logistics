import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import 'dotenv/config';

/**
 * Single Supabase client, instantiated once and reused across
 * the app. Uses the SERVICE ROLE key deliberately — this is a
 * trusted backend, not the frontend, so it's allowed to bypass
 * Row Level Security. The frontend never talks to Supabase
 * directly; it only ever calls this Express API.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from .env — ' +
      'database-backed routes will fail until real credentials are set.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  // Supabase's client always initializes a realtime connection
  // internally (even though this project doesn't use realtime
  // subscriptions), and that requires native WebSocket support.
  // Node 22+ has it built in; Node < 22 doesn't — passing `ws`
  // explicitly here makes this work on any Node version, rather
  // than assuming everyone (including future hosting providers)
  // runs 22+.
  realtime: {
    transport: ws,
  },
});