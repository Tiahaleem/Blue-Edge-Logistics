import { supabase } from '../config/supabaseClient.js';

export async function getHealth(req, res) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'unknown',
  };

  try {
    const { error } = await supabase.from('admins').select('id').limit(1);
    health.database = error ? 'unreachable' : 'connected';
    if (error) health.databaseError = error.message;
  } catch (err) {
    health.database = 'unreachable';
    health.databaseError = err.message;
  }

  const overallStatus = health.database === 'connected' ? 200 : 503;
  res.status(overallStatus).json(health);
}