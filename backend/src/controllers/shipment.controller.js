import { z } from 'zod';
import {
  listShipments,
  getShipmentById,
  createShipment,
  updateShipment,
  deleteShipment,
} from '../services/shipment.service.js';

const shipmentInputSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('A valid email is required'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  description: z.string().min(1, 'Description is required'),
  weight: z.number().positive('Weight must be a positive number'),
  estimatedDelivery: z.string().min(1, 'Estimated delivery date is required'),
  currentStatus: z.enum(['pending', 'in-transit', 'delivered']),
  currentLocation: z.string().min(1, 'Current location is required'),
  notes: z.string().optional(),
});

function formatValidationError(zodError) {
  const issue = zodError.issues[0];
  const field = issue.path.join('.');
  return field ? `${field}: ${issue.message}` : issue.message;
}

export async function getShipments(req, res, next) {
  try {
    const { search, status, page, limit } = req.query;
    const result = await listShipments({
      search: search || undefined,
      status: status || undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 8,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getShipment(req, res, next) {
  try {
    const shipment = await getShipmentById(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found.' });
    res.json(shipment);
  } catch (err) {
    next(err);
  }
}

export async function postShipment(req, res, next) {
  try {
    const parsed = shipmentInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: formatValidationError(parsed.error) });
    const shipment = await createShipment(parsed.data);
    res.status(201).json(shipment);
  } catch (err) {
    next(err);
  }
}

export async function putShipment(req, res, next) {
  try {
    const parsed = shipmentInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: formatValidationError(parsed.error) });
    const shipment = await updateShipment(req.params.id, parsed.data);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found.' });
    res.json(shipment);
  } catch (err) {
    next(err);
  }
}

export async function removeShipment(req, res, next) {
  try {
    const shipment = await deleteShipment(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found.' });
    res.json({ message: 'Shipment deleted.' });
  } catch (err) {
    next(err);
  }
}