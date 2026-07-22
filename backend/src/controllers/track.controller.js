import { getShipmentByTrackingCode } from '../services/shipment.service.js';

export async function getTracking(req, res, next) {
  try {
    const shipment = await getShipmentByTrackingCode(req.params.trackingCode);

    if (!shipment) {
      return res.status(404).json({ error: 'No shipment found with that tracking code.' });
    }

    const publicShipment = {
      trackingCode: shipment.tracking_code,
      origin: shipment.origin,
      destination: shipment.destination,
      description: shipment.description,
      weight: shipment.weight,
      estimatedDelivery: shipment.estimated_delivery,
      currentStatus: shipment.current_status,
      currentLocation: shipment.current_location,
      createdAt: shipment.created_at,
      history: shipment.history.map((entry) => ({
        status: entry.status,
        location: entry.location,
        note: entry.note,
        createdAt: entry.created_at,
      })),
    };

    res.json(publicShipment);
  } catch (err) {
    next(err);
  }
}