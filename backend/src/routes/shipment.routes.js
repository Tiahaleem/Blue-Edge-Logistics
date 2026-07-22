import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  getShipments,
  getShipment,
  postShipment,
  putShipment,
  removeShipment,
} from '../controllers/shipment.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getShipments);
router.get('/:id', getShipment);
router.post('/', postShipment);
router.put('/:id', putShipment);
router.delete('/:id', removeShipment);

export default router;