import { supabase } from '../config/supabaseClient.js';

const VALID_STATUSES = ['pending', 'in-transit', 'delivered'];

const STATUS_LABELS = {
  pending: 'Processing',
  'in-transit': 'In Transit',
  delivered: 'Delivered',
};

async function generateUniqueTrackingCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const digits = Math.floor(100000 + Math.random() * 900000);
    const code = `SPW-${digits}`;

    const { data, error } = await supabase
      .from('shipments')
      .select('id')
      .eq('tracking_code', code)
      .maybeSingle();

    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    if (!data) return code;
  }

  throw Object.assign(new Error('Could not generate a unique tracking code. Please try again.'), {
    status: 500,
  });
}

export async function listShipments({ search, status, page = 1, limit = 8 }) {
  let query = supabase.from('shipments').select('*', { count: 'exact' });

  if (status && VALID_STATUSES.includes(status)) {
    query = query.eq('current_status', status);
  }

  if (search) {
    query = query.or(`tracking_code.ilike.%${search}%,customer_name.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw Object.assign(new Error(error.message), { status: 500 });

  return { shipments: data, total: count };
}

export async function getShipmentById(id) {
  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (shipmentError) throw Object.assign(new Error(shipmentError.message), { status: 500 });
  if (!shipment) return null;

  const { data: history, error: historyError } = await supabase
    .from('tracking_history')
    .select('*')
    .eq('shipment_id', id)
    .order('created_at', { ascending: true });

  if (historyError) throw Object.assign(new Error(historyError.message), { status: 500 });

  return { ...shipment, history };
}

export async function getShipmentByTrackingCode(trackingCode) {
  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .select('*')
    .eq('tracking_code', trackingCode)
    .maybeSingle();

  if (shipmentError) throw Object.assign(new Error(shipmentError.message), { status: 500 });
  if (!shipment) return null;

  const { data: history, error: historyError } = await supabase
    .from('tracking_history')
    .select('*')
    .eq('shipment_id', shipment.id)
    .order('created_at', { ascending: true });

  if (historyError) throw Object.assign(new Error(historyError.message), { status: 500 });

  return { ...shipment, history };
}

export async function createShipment(payload) {
  const trackingCode = await generateUniqueTrackingCode();

  const { data: shipment, error: insertError } = await supabase
    .from('shipments')
    .insert({
      tracking_code: trackingCode,
      customer_name: payload.customerName,
      phone: payload.phone,
      email: payload.email,
      origin: payload.origin,
      destination: payload.destination,
      description: payload.description,
      weight: payload.weight,
      estimated_delivery: payload.estimatedDelivery,
      current_status: payload.currentStatus,
      current_location: payload.currentLocation,
    })
    .select()
    .single();

  if (insertError) throw Object.assign(new Error(insertError.message), { status: 500 });

  const { error: historyError } = await supabase.from('tracking_history').insert({
    shipment_id: shipment.id,
    status: STATUS_LABELS[payload.currentStatus] || 'Shipment Created',
    location: payload.origin,
    note: 'Shipment created.',
  });

  if (historyError) throw Object.assign(new Error(historyError.message), { status: 500 });

  return shipment;
}

export async function updateShipment(id, payload) {
  const { data: shipment, error: updateError } = await supabase
    .from('shipments')
    .update({
      customer_name: payload.customerName,
      phone: payload.phone,
      email: payload.email,
      origin: payload.origin,
      destination: payload.destination,
      description: payload.description,
      weight: payload.weight,
      estimated_delivery: payload.estimatedDelivery,
      current_status: payload.currentStatus,
      current_location: payload.currentLocation,
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (updateError) throw Object.assign(new Error(updateError.message), { status: 500 });
  if (!shipment) return null;

  const { error: historyError } = await supabase.from('tracking_history').insert({
    shipment_id: id,
    status: STATUS_LABELS[payload.currentStatus] || payload.currentStatus,
    location: payload.currentLocation,
    note: payload.notes || null,
  });

  if (historyError) throw Object.assign(new Error(historyError.message), { status: 500 });

  return shipment;
}

export async function deleteShipment(id) {
  const { data, error } = await supabase.from('shipments').delete().eq('id', id).select().maybeSingle();

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  return data;
}