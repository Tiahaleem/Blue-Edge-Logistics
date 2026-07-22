import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getTracking } from '../controllers/track.controller.js';

const router = Router();

const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many tracking requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/:trackingCode', trackLimiter, getTracking);

export default router;